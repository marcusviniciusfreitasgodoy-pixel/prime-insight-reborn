import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeocodeRequest {
  logradouro: string;
  bairro: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Use service role client to bypass RLS for cache writes
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { logradouro, bairro }: GeocodeRequest = await req.json();

    if (!logradouro || !bairro) {
      return new Response(
        JSON.stringify({ error: "logradouro and bairro are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input lengths to prevent abuse
    if (logradouro.length > 200 || bairro.length > 100) {
      return new Response(
        JSON.stringify({ error: "Input too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bairroNormalized = bairro.toUpperCase().trim();

    // First check cache
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

    // Query Prefeitura API
    const searchTerm = logradouro.toUpperCase().trim();
    const whereClause = encodeURIComponent(`completo LIKE '%${searchTerm}%' AND bairro = '${bairroNormalized}'`);
    const url = `https://pgeo3.rio.rj.gov.br/arcgis/rest/services/CadLog/Trechos_Logradouros/MapServer/0/query?where=${whereClause}&outFields=*&f=json&returnGeometry=true`;

    const response = await fetch(url);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch from Prefeitura API" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      return new Response(
        JSON.stringify({ error: "No geocoding results found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const feature = data.features[0];
    const geometry = feature.geometry;

    if (!geometry?.paths?.[0]?.length) {
      return new Response(
        JSON.stringify({ error: "Invalid geometry in response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate centroid
    const path = geometry.paths[0];
    let sumX = 0, sumY = 0;
    for (const point of path) {
      sumX += point[0];
      sumY += point[1];
    }
    const lat = sumY / path.length;
    const lng = sumX / path.length;

    // Save to cache using service role (bypasses RLS)
    await supabase.from("logradouros_geocoded").upsert({
      logradouro,
      bairro: bairroNormalized,
      latitude: lat,
      longitude: lng,
      hierarquia: feature.attributes?.hierarquia,
      velocidade_regulamentada: feature.attributes?.velocidade_regulamentada,
      cod_trecho: feature.attributes?.cod_trecho,
    }, { onConflict: "logradouro,bairro" });

    return new Response(
      JSON.stringify({ lat, lng, cached: false }),
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
