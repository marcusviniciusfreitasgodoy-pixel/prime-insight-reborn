import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SIRGAS 2000 to WGS84 conversion (simple approximation for Rio de Janeiro)
// For Rio de Janeiro area, the difference is minimal (~0.0001 degrees)
function sirgasToWGS84(x: number, y: number): { lat: number; lng: number } {
  // SIRGAS 2000 is essentially aligned with WGS84 for practical purposes
  return { lat: y, lng: x };
}

// Calculate centroid from polyline geometry
function calculateCentroid(geometry: { paths?: number[][][] }): { lat: number; lng: number } | null {
  if (!geometry?.paths || !geometry.paths[0] || geometry.paths[0].length === 0) {
    return null;
  }
  
  const path = geometry.paths[0];
  let sumX = 0, sumY = 0;
  
  for (const point of path) {
    sumX += point[0];
    sumY += point[1];
  }
  
  const centroidX = sumX / path.length;
  const centroidY = sumY / path.length;
  
  return sirgasToWGS84(centroidX, centroidY);
}

// Google Maps Geocoding API fallback - key loaded from environment
const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

// Expand abbreviations for Google Geocoding (more aggressive)
function expandForGoogle(name: string): string {
  const abbreviations: Record<string, string> = {
    "AVN": "AVENIDA",
    "AV": "AVENIDA",
    "RUA": "RUA",
    "R": "RUA",
    "PR": "PRACA",
    "PCA": "PRACA",
    "TRV": "TRAVESSA",
    "TV": "TRAVESSA",
    "EST": "ESTRADA",
    "ETR": "ESTRADA",
    "AL": "ALAMEDA",
    "LGO": "LARGO",
    "BC": "BECO",
    "LD": "LADEIRA",
    "PRC": "PRACA",
    // Title abbreviations - expand for better Google matching
    "DESEN": "DESENHISTA",
    "DES": "DESEMBARGADOR",
    "GAL": "GENERAL",
    "CEL": "CORONEL",
    "DR": "DOUTOR",
    "COMTE": "COMANDANTE",
    "EMBAIX": "EMBAIXADOR",
    "JORN": "JORNALISTA",
    "SEN": "SENADOR",
    "DEP": "DEPUTADO",
    "PRES": "PRESIDENTE",
    "CAP": "CAPITAO",
    "MAJ": "MAJOR",
    "TEN": "TENENTE",
    "SGT": "SARGENTO",
    "ALM": "ALMIRANTE",
    "PROF": "PROFESSOR",
    "ENG": "ENGENHEIRO",
    "PREF": "PREFEITO",
    "MONSEN": "MONSENHOR",
  };
  
  return name.split(" ").map(word => {
    const upper = word.toUpperCase();
    return abbreviations[upper] || word;
  }).join(" ");
}

async function geocodeWithGoogle(logradouro: string, bairro: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('GOOGLE_MAPS_API_KEY not configured');
    return null;
  }
  
  try {
    // Expand abbreviations for better Google matching
    const expandedName = expandForGoogle(logradouro.toUpperCase().trim());
    const address = encodeURIComponent(`${expandedName}, ${bairro}, Rio de Janeiro, RJ, Brasil`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR&region=br`;
    
    console.log(`Google Geocoding for: ${expandedName} (was: ${logradouro}), ${bairro}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Google Geocoding API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;
      
      // Verify that the result is actually in the expected bairro
      const addressComponents = result.address_components || [];
      const foundBairro = addressComponents.find((c: any) => 
        c.types.includes("sublocality") || c.types.includes("sublocality_level_1")
      );
      
      if (foundBairro) {
        const foundBairroName = foundBairro.long_name.toUpperCase();
        if (!foundBairroName.includes(bairro.substring(0, 5))) {
          console.log(`Google returned different bairro: ${foundBairroName} vs ${bairro}`);
          // Still return but log warning
        }
      }
      
      console.log(`Google Geocoding found: ${location.lat}, ${location.lng} for ${expandedName}`);
      return { lat: location.lat, lng: location.lng };
    }
    
    console.log(`Google Geocoding no results for: ${expandedName}, ${bairro}`);
    return null;
  } catch (error) {
    console.error(`Google Geocoding error: ${error}`);
    return null;
  }
}

// Expand common abbreviations in logradouro names - keep original if ambiguous
function expandLogradouroName(name: string): string {
  // Only expand unambiguous abbreviations for street types
  const abbreviations: Record<string, string> = {
    "AVN": "AVENIDA",
    "AV": "AVENIDA",
    "PR": "PRACA",
    "PCA": "PRACA",
    "TRV": "TRAVESSA",
    "TV": "TRAVESSA",
    "EST": "ESTRADA",
    "AL": "ALAMEDA",
    "LGO": "LARGO",
    "BC": "BECO",
    "LD": "LADEIRA",
  };
  
  // Split and expand only first word (street type prefix)
  const words = name.split(" ");
  if (words.length > 0) {
    const firstWord = words[0].toUpperCase();
    if (abbreviations[firstWord]) {
      words[0] = abbreviations[firstWord];
    }
  }
  return words.join(" ");
}

// Query Prefeitura API for logradouro geometry, with Google fallback
async function fetchLogradouroGeometry(logradouro: string, bairro: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Clean and expand abbreviations only for street type prefix
    // Strip SQL/wildcard chars before interpolating into ArcGIS WHERE clause
    const sanitize = (s: string) => s.replace(/[';%"\\]/g, '').slice(0, 100);
    const searchTerm = sanitize(expandLogradouroName(logradouro.toUpperCase().trim()));
    const bairroTerm = sanitize(bairro.toUpperCase().trim());
    
    // Build API query - use the original name for search (without aggressive expansion)
    const whereClause = encodeURIComponent(`completo LIKE '%${searchTerm}%' AND bairro = '${bairroTerm}'`);
    const url = `https://pgeo3.rio.rj.gov.br/arcgis/rest/services/CadLog/Trechos_Logradouros/MapServer/0/query?where=${whereClause}&outFields=*&f=json&returnGeometry=true`;
    
    console.log(`Fetching geometry for: ${searchTerm} (was: ${logradouro}), ${bairro}`);
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      console.error(`Prefeitura API error: ${response.status}, trying Google fallback`);
      return geocodeWithGoogle(logradouro, bairro);
    }
    
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      // Try partial match if full name didn't work
      const words = searchTerm.split(" ").filter(w => w.length > 3);
      if (words.length >= 2) {
        const partialSearch = words.slice(-2).join(" ").replace(/[';%"\\]/g, '').slice(0, 100);
        const partialWhere = encodeURIComponent(`completo LIKE '%${partialSearch}%' AND bairro = '${bairroTerm}'`);
        const partialUrl = `https://pgeo3.rio.rj.gov.br/arcgis/rest/services/CadLog/Trechos_Logradouros/MapServer/0/query?where=${partialWhere}&outFields=*&f=json&returnGeometry=true`;
        
        console.log(`Trying partial search: ${partialSearch}`);
        
        const partialResponse = await fetch(partialUrl, { headers: { "Accept": "application/json" } });
        if (partialResponse.ok) {
          const partialData = await partialResponse.json();
          if (partialData.features && partialData.features.length > 0) {
            return calculateCentroid(partialData.features[0].geometry);
          }
        }
      }
      
      // Prefeitura API didn't find it, try Google Geocoding as fallback
      console.log(`Prefeitura API: no results for "${searchTerm}", trying Google fallback`);
      return geocodeWithGoogle(logradouro, bairro);
    }
    
    // Get first matching feature
    const feature = data.features[0];
    return calculateCentroid(feature.geometry);
  } catch (error) {
    console.error(`Error fetching geometry: ${error}, trying Google fallback`);
    return geocodeWithGoogle(logradouro, bairro);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated caller (validate JWT, not just header presence)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsErr || !claimsData?.claims || (claimsData.claims as any).role === 'anon') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bairro, limit = 100 } = await req.json();

    if (!bairro) {
      return new Response(
        JSON.stringify({ error: "Bairro is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bairroUpper = bairro.toUpperCase().trim();
    console.log(`Processing geo clusters for bairro: ${bairroUpper}`);

    // Step 1: Get aggregated ITBI data by logradouro
    const { data: itbiData, error: itbiError } = await supabase
      .from("itbi_transactions")
      .select("logradouro, valor_m2, tipologia")
      .eq("bairro", bairroUpper)
      .not("valor_m2", "is", null)
      .gt("valor_m2", 0);

    if (itbiError) {
      console.error("ITBI query error:", itbiError);
      throw itbiError;
    }

    console.log(`Found ${itbiData?.length || 0} ITBI transactions for ${bairroUpper}`);

    // Aggregate by logradouro
    const aggregated = new Map<string, { total: number; count: number; tipologias: Set<string> }>();
    
    for (const tx of itbiData || []) {
      if (!tx.logradouro) continue;
      
      const existing = aggregated.get(tx.logradouro) || { total: 0, count: 0, tipologias: new Set() };
      existing.total += tx.valor_m2 || 0;
      existing.count += 1;
      if (tx.tipologia) existing.tipologias.add(tx.tipologia);
      aggregated.set(tx.logradouro, existing);
    }

    // Sort by transaction count and take top N
    const sortedLogradouros = Array.from(aggregated.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit);

    console.log(`Top ${sortedLogradouros.length} logradouros to geocode`);

    // Step 2: Check cache for existing geocoded data
    const logradouroNames = sortedLogradouros.map(([name]) => name);
    
    const { data: cachedData, error: cacheError } = await supabase
      .from("logradouros_geocoded")
      .select("*")
      .eq("bairro", bairroUpper)
      .in("logradouro", logradouroNames);

    if (cacheError) {
      console.error("Cache query error:", cacheError);
    }

    const cachedMap = new Map<string, { latitude: number; longitude: number; hierarquia?: string }>();
    for (const cached of cachedData || []) {
      if (cached.latitude && cached.longitude) {
        cachedMap.set(cached.logradouro, {
          latitude: cached.latitude,
          longitude: cached.longitude,
          hierarquia: cached.hierarquia,
        });
      }
    }

    console.log(`Found ${cachedMap.size} cached geocoded entries`);

    // Step 3: Build GeoJSON features
    const features: any[] = [];
    const toGeocode: string[] = [];

    for (const [logradouro, stats] of sortedLogradouros) {
      const valorM2Medio = Math.round(stats.total / stats.count);
      const tipologias = Array.from(stats.tipologias);
      
      const cached = cachedMap.get(logradouro);
      
      if (cached) {
        features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [cached.longitude, cached.latitude],
          },
          properties: {
            logradouro,
            bairro: bairroUpper,
            valor_m2_medio: valorM2Medio,
            total_transacoes: stats.count,
            tipologias,
            hierarquia: cached.hierarquia,
          },
        });
      } else {
        toGeocode.push(logradouro);
      }
    }

    // Step 4: Geocode missing logradouros (increased limit to 25 per request)
    const geocodeLimit = Math.min(toGeocode.length, 25);
    console.log(`Geocoding ${geocodeLimit} new logradouros (${toGeocode.length} pending)`);

    for (let i = 0; i < geocodeLimit; i++) {
      const logradouro = toGeocode[i];
      const stats = aggregated.get(logradouro)!;
      
      const coords = await fetchLogradouroGeometry(logradouro, bairroUpper);
      
      if (coords) {
        // Save to cache
        await supabase.from("logradouros_geocoded").upsert({
          logradouro,
          bairro: bairroUpper,
          latitude: coords.lat,
          longitude: coords.lng,
        }, { onConflict: "logradouro,bairro" });

        const valorM2Medio = Math.round(stats.total / stats.count);
        const tipologias = Array.from(stats.tipologias);

        features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [coords.lng, coords.lat],
          },
          properties: {
            logradouro,
            bairro: bairroUpper,
            valor_m2_medio: valorM2Medio,
            total_transacoes: stats.count,
            tipologias,
          },
        });
      }
    }

    const geojson = {
      type: "FeatureCollection",
      features,
      metadata: {
        bairro: bairroUpper,
        total_features: features.length,
        pending_geocode: Math.max(0, toGeocode.length - geocodeLimit),
      },
    };

    console.log(`Returning ${features.length} features for ${bairroUpper}`);

    return new Response(JSON.stringify(geojson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in geo-itbi-clusters:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
