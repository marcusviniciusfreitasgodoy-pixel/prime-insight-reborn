import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GeocodeRequest {
  logradouro: string;
  bairro: string;
}

// Expand ITBI abbreviations to full names for better API matching
function expandAbbreviations(name: string): string {
  const abbreviations: Record<string, string> = {
    "AVN": "AVENIDA",
    "AV": "AVENIDA",
    "R": "RUA",
    "PR": "PRACA",
    "PCA": "PRACA",
    "PRC": "PRACA",
    "TRV": "TRAVESSA",
    "TV": "TRAVESSA",
    "EST": "ESTRADA",
    "AL": "ALAMEDA",
    "LGO": "LARGO",
    "BC": "BECO",
    "LD": "LADEIRA",
    "VL": "VILA",
    "GAL": "GENERAL",
    "CEL": "CORONEL",
    "DR": "DOUTOR",
    "DESEN": "DESEMBARGADOR",
    "DES": "DESEMBARGADOR",
    "COMTE": "COMANDANTE",
    "EMBAIX": "EMBAIXADOR",
    "EMB": "EMBAIXADOR",
    "JORN": "JORNALISTA",
    "SEN": "SENADOR",
    "DEP": "DEPUTADO",
    "PRES": "PRESIDENTE",
    "CAP": "CAPITAO",
    "MAJ": "MAJOR",
    "TEN": "TENENTE",
    "SGT": "SARGENTO",
    "ALM": "ALMIRANTE",
    "ALMTE": "ALMIRANTE",
    "PROF": "PROFESSOR",
    "ENG": "ENGENHEIRO",
    "ARQ": "ARQUITETO",
    "MIN": "MINISTRO",
    "GOV": "GOVERNADOR",
    "PREF": "PREFEITO",
    "VER": "VEREADOR",
    "MAL": "MARECHAL",
    "COM": "COMENDADOR",
    "BRIG": "BRIGADEIRO",
    "PROC": "PROCURADOR",
    "CONS": "CONSELHEIRO",
  };

  return name.split(/\s+/).map(word => {
    const upper = word.toUpperCase();
    return abbreviations[upper] || word;
  }).join(" ");
}

async function geocodeWithPrefeitura(searchTerm: string, bairroNormalized: string): Promise<{ lat: number; lng: number; attributes?: Record<string, unknown> } | null> {
  const whereClause = encodeURIComponent(`completo LIKE '%${searchTerm}%' AND bairro = '${bairroNormalized}'`);
  const url = `https://pgeo3.rio.rj.gov.br/arcgis/rest/services/CadLog/Trechos_Logradouros/MapServer/0/query?where=${whereClause}&outFields=*&f=json&returnGeometry=true`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  if (!data.features || data.features.length === 0) return null;

  const feature = data.features[0];
  const geometry = feature.geometry;
  if (!geometry?.paths?.[0]?.length) return null;

  const path = geometry.paths[0];
  let sumX = 0, sumY = 0;
  for (const point of path) {
    sumX += point[0];
    sumY += point[1];
  }

  return {
    lat: sumY / path.length,
    lng: sumX / path.length,
    attributes: feature.attributes,
  };
}

async function geocodeWithGoogle(logradouro: string, bairro: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    console.log("GOOGLE_MAPS_API_KEY not configured, skipping Google fallback");
    return null;
  }

  const address = encodeURIComponent(`${logradouro}, ${bairro}, Rio de Janeiro, RJ, Brasil`);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}&components=country:BR`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  if (data.status !== "OK" || !data.results?.[0]) return null;

  const location = data.results[0].geometry.location;
  return { lat: location.lat, lng: location.lng };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { logradouro, bairro }: GeocodeRequest = await req.json();

    if (!logradouro || !bairro) {
      return new Response(
        JSON.stringify({ error: "logradouro and bairro are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (logradouro.length > 200 || bairro.length > 100) {
      return new Response(
        JSON.stringify({ error: "Input too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bairroNormalized = bairro.toUpperCase().trim();

    // Check cache first
    const { data: cached } = await supabase
      .from("logradouros_geocoded")
      .select("latitude, longitude")
      .eq("logradouro", logradouro)
      .eq("bairro", bairroNormalized)
      .maybeSingle();

    if (cached?.latitude && cached?.longitude) {
      return new Response(
        JSON.stringify({ lat: cached.latitude, lng: cached.longitude, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Expand abbreviations for better matching
    const originalTerm = logradouro.toUpperCase().trim();
    const expandedTerm = expandAbbreviations(originalTerm);

    console.log(`Geocoding: "${originalTerm}" -> expanded: "${expandedTerm}" in ${bairroNormalized}`);

    // Try Prefeitura API with expanded name first
    let result = await geocodeWithPrefeitura(expandedTerm, bairroNormalized);

    // If expanded didn't work, try original
    if (!result && expandedTerm !== originalTerm) {
      console.log("Trying original term with Prefeitura API");
      result = await geocodeWithPrefeitura(originalTerm, bairroNormalized);
    }

    // Fallback: Google Geocoding API
    if (!result) {
      console.log("Prefeitura API failed, trying Google Geocoder");
      const googleResult = await geocodeWithGoogle(expandedTerm, bairroNormalized);
      if (googleResult) {
        result = { lat: googleResult.lat, lng: googleResult.lng };
      }
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: "No geocoding results found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to cache
    await supabase.from("logradouros_geocoded").upsert({
      logradouro,
      bairro: bairroNormalized,
      latitude: result.lat,
      longitude: result.lng,
      hierarquia: result.attributes?.hierarquia as string | undefined,
      velocidade_regulamentada: result.attributes?.velocidade_regulamentada as number | undefined,
      cod_trecho: result.attributes?.cod_trecho as number | undefined,
    }, { onConflict: "logradouro,bairro" });

    return new Response(
      JSON.stringify({ lat: result.lat, lng: result.lng, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Geocoding error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
