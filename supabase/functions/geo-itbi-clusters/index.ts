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

// Expand common abbreviations in logradouro names
function expandLogradouroName(name: string): string {
  const abbreviations: Record<string, string> = {
    "AVN": "AVENIDA",
    "AV": "AVENIDA",
    "R": "RUA",
    "RUA": "RUA",
    "PR": "PRACA",
    "PCA": "PRACA",
    "TRV": "TRAVESSA",
    "TV": "TRAVESSA",
    "EST": "ESTRADA",
    "AL": "ALAMEDA",
    "LGO": "LARGO",
    "BC": "BECO",
    "LD": "LADEIRA",
    "GAL": "GENERAL",
    "CEL": "CORONEL",
    "DR": "DOUTOR",
    "DESEN": "DESEMBARGADOR",
    "DES": "DESEMBARGADOR",
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
  };
  
  // Split and expand each word
  return name.split(" ").map(word => {
    const upper = word.toUpperCase();
    return abbreviations[upper] || word;
  }).join(" ");
}

// Query Prefeitura API for logradouro geometry
async function fetchLogradouroGeometry(logradouro: string, bairro: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Clean and expand abbreviations
    const searchTerm = expandLogradouroName(logradouro.toUpperCase().trim());
    const bairroTerm = bairro.toUpperCase().trim();
    
    // Build API query - use contains search for flexibility
    const whereClause = encodeURIComponent(`completo LIKE '%${searchTerm}%' AND bairro = '${bairroTerm}'`);
    const url = `https://pgeo3.rio.rj.gov.br/arcgis/rest/services/CadLog/Trechos_Logradouros/MapServer/0/query?where=${whereClause}&outFields=*&f=json&returnGeometry=true`;
    
    console.log(`Fetching geometry for: ${searchTerm} (was: ${logradouro}), ${bairro}`);
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      // Try partial match if full name didn't work
      const words = searchTerm.split(" ").filter(w => w.length > 3);
      if (words.length >= 2) {
        const partialSearch = words.slice(-2).join(" ");
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
      
      console.log(`No geometry found for: ${searchTerm}, ${bairro}`);
      return null;
    }
    
    // Get first matching feature
    const feature = data.features[0];
    return calculateCentroid(feature.geometry);
  } catch (error) {
    console.error(`Error fetching geometry: ${error}`);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Step 4: Geocode missing logradouros (limit to 10 per request to avoid timeout)
    const geocodeLimit = Math.min(toGeocode.length, 10);
    console.log(`Geocoding ${geocodeLimit} new logradouros`);

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
