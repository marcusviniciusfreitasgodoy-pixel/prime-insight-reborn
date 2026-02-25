import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 50;

// Expand ITBI abbreviations to full names
function expandAbbreviations(name: string): string {
  const abbreviations: Record<string, string> = {
    "AVN": "AVENIDA", "AV": "AVENIDA", "R": "RUA",
    "PR": "PRACA", "PCA": "PRACA", "PRC": "PRACA",
    "TRV": "TRAVESSA", "TV": "TRAVESSA", "EST": "ESTRADA",
    "AL": "ALAMEDA", "LGO": "LARGO", "BC": "BECO",
    "LD": "LADEIRA", "VL": "VILA", "GAL": "GENERAL",
    "CEL": "CORONEL", "DR": "DOUTOR", "DESEN": "DESEMBARGADOR",
    "DES": "DESEMBARGADOR", "COMTE": "COMANDANTE",
    "EMBAIX": "EMBAIXADOR", "EMB": "EMBAIXADOR",
    "JORN": "JORNALISTA", "SEN": "SENADOR", "DEP": "DEPUTADO",
    "PRES": "PRESIDENTE", "CAP": "CAPITAO", "MAJ": "MAJOR",
    "TEN": "TENENTE", "SGT": "SARGENTO", "ALM": "ALMIRANTE",
    "ALMTE": "ALMIRANTE", "PROF": "PROFESSOR", "ENG": "ENGENHEIRO",
    "ARQ": "ARQUITETO", "MIN": "MINISTRO", "GOV": "GOVERNADOR",
    "PREF": "PREFEITO", "VER": "VEREADOR", "MAL": "MARECHAL",
    "COM": "COMENDADOR", "BRIG": "BRIGADEIRO",
    "PROC": "PROCURADOR", "CONS": "CONSELHEIRO",
  };

  return name.split(/\s+/).map(word => abbreviations[word.toUpperCase()] || word).join(" ");
}

async function geocodeWithPrefeitura(searchTerm: string, bairro: string): Promise<{ lat: number; lng: number; attributes?: Record<string, unknown> } | null> {
  try {
    const whereClause = encodeURIComponent(`completo LIKE '%${searchTerm}%' AND bairro = '${bairro}'`);
    const url = `https://pgeo3.rio.rj.gov.br/arcgis/rest/services/CadLog/Trechos_Logradouros/MapServer/0/query?where=${whereClause}&outFields=*&f=json&returnGeometry=true`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.features?.length) return null;

    const geometry = data.features[0].geometry;
    if (!geometry?.paths?.[0]?.length) return null;

    const path = geometry.paths[0];
    let sumX = 0, sumY = 0;
    for (const point of path) { sumX += point[0]; sumY += point[1]; }

    return {
      lat: sumY / path.length,
      lng: sumX / path.length,
      attributes: data.features[0].attributes,
    };
  } catch {
    return null;
  }
}

async function geocodeWithGoogle(logradouro: string, bairro: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const address = encodeURIComponent(`${logradouro}, ${bairro}, Rio de Janeiro, RJ, Brasil`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}&components=country:BR`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== "OK" || !data.results?.[0]) return null;

    const location = data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate cron secret
    const cronSecret = Deno.env.get("CRON_SECRET");
    const requestSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("Authorization");

    // Allow either cron secret or valid auth
    if (cronSecret && requestSecret !== cronSecret && !authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get distinct logradouro+bairro pairs from ITBI that aren't geocoded yet
    const { data: pending, error: queryError } = await supabase.rpc("get_pending_geocode_streets", {
      p_limit: BATCH_SIZE,
    });

    if (queryError) {
      // Fallback: direct query if RPC doesn't exist yet
      console.log("RPC not available, using direct query");
      const { data: itbiStreets, error: itbiError } = await supabase
        .from("itbi_transactions")
        .select("logradouro, bairro")
        .not("logradouro", "is", null)
        .not("bairro", "is", null)
        .limit(1000);

      if (itbiError) throw itbiError;

      // Deduplicate
      const uniquePairs = new Map<string, { logradouro: string; bairro: string }>();
      for (const row of itbiStreets || []) {
        if (row.logradouro && row.bairro) {
          const key = `${row.logradouro}|${row.bairro}`;
          uniquePairs.set(key, { logradouro: row.logradouro, bairro: row.bairro });
        }
      }

      // Check which ones are already geocoded
      const { data: existing } = await supabase
        .from("logradouros_geocoded")
        .select("logradouro, bairro")
        .not("latitude", "is", null);

      const existingSet = new Set((existing || []).map(e => `${e.logradouro}|${e.bairro}`));
      const pendingPairs = Array.from(uniquePairs.values())
        .filter(p => !existingSet.has(`${p.logradouro}|${p.bairro}`))
        .slice(0, BATCH_SIZE);

      return await processBatch(supabase, pendingPairs, googleApiKey);
    }

    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending streets to geocode", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return await processBatch(supabase, pending, googleApiKey);

  } catch (error) {
    console.error("Batch geocode error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processBatch(
  supabase: ReturnType<typeof createClient>,
  streets: Array<{ logradouro: string; bairro: string }>,
  googleApiKey: string
) {
  let success = 0;
  let failed = 0;
  let googleUsed = 0;
  const results: Array<{ logradouro: string; bairro: string; status: string }> = [];

  for (const { logradouro, bairro } of streets) {
    const bairroNorm = bairro.toUpperCase().trim();
    const originalTerm = logradouro.toUpperCase().trim();
    const expandedTerm = expandAbbreviations(originalTerm);

    // Try Prefeitura with expanded name
    let result = await geocodeWithPrefeitura(expandedTerm, bairroNorm);

    // Try original if expanded didn't work
    if (!result && expandedTerm !== originalTerm) {
      result = await geocodeWithPrefeitura(originalTerm, bairroNorm);
    }

    // Fallback: Google
    if (!result && googleApiKey) {
      const googleResult = await geocodeWithGoogle(expandedTerm, bairroNorm, googleApiKey);
      if (googleResult) {
        result = { lat: googleResult.lat, lng: googleResult.lng };
        googleUsed++;
      }
    }

    if (result) {
      await supabase.from("logradouros_geocoded").upsert({
        logradouro,
        bairro: bairroNorm,
        latitude: result.lat,
        longitude: result.lng,
        hierarquia: result.attributes?.hierarquia as string | undefined,
        velocidade_regulamentada: result.attributes?.velocidade_regulamentada as number | undefined,
        cod_trecho: result.attributes?.cod_trecho as number | undefined,
      }, { onConflict: "logradouro,bairro" });
      success++;
      results.push({ logradouro, bairro: bairroNorm, status: "ok" });
    } else {
      failed++;
      results.push({ logradouro, bairro: bairroNorm, status: "not_found" });
    }

    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`Batch geocode complete: ${success} success, ${failed} failed, ${googleUsed} via Google`);

  return new Response(
    JSON.stringify({ processed: streets.length, success, failed, googleUsed, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
