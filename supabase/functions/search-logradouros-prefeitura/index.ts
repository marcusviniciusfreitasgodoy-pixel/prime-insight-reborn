import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Expand abbreviations for better search
function expandAbbreviations(name: string): string {
  const abbreviations: Record<string, string> = {
    "AVN": "AVENIDA",
    "AV": "AVENIDA",
    "R": "RUA",
    "PR": "PRACA",
    "PCA": "PRACA",
    "TRV": "TRAVESSA",
    "TV": "TRAVESSA",
    "EST": "ESTRADA",
    "AL": "ALAMEDA",
    "LGO": "LARGO",
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
    "ALM": "ALMIRANTE",
    "ALMTE": "ALMIRANTE",
    "PROF": "PROFESSOR",
    "ENG": "ENGENHEIRO",
    "MAL": "MARECHAL",
    "COM": "COMENDADOR",
  };
  
  return name.split(" ").map(word => {
    const upper = word.toUpperCase();
    return abbreviations[upper] || word;
  }).join(" ");
}

// Contract full names to ITBI format
function contractToITBI(name: string): string {
  const fullToAbbr: Record<string, string> = {
    "AVENIDA": "AVN",
    "PRACA": "PRC",
    "TRAVESSA": "TRV",
    "ESTRADA": "EST",
    "ALAMEDA": "AL",
    "LARGO": "LGO",
    "GENERAL": "GAL",
    "CORONEL": "CEL",
    "DOUTOR": "DR",
    "DESEMBARGADOR": "DESEN",
    "COMANDANTE": "COMTE",
    "EMBAIXADOR": "EMBAIX",
    "JORNALISTA": "JORN",
    "SENADOR": "SEN",
    "DEPUTADO": "DEP",
    "PRESIDENTE": "PRES",
    "CAPITAO": "CAP",
    "MAJOR": "MAJ",
    "TENENTE": "TEN",
    "ALMIRANTE": "ALMTE",
    "PROFESSOR": "PROF",
    "ENGENHEIRO": "ENG",
    "MARECHAL": "MAL",
    "COMENDADOR": "COM",
  };
  
  return name.split(" ").map(word => {
    const upper = word.toUpperCase();
    return fullToAbbr[upper] || word;
  }).join(" ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate that request came via Supabase SDK (has Authorization header)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, bairro, limit = 10 } = await req.json();

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strip SQL/wildcard chars before interpolating into ArcGIS WHERE clause
    const sanitize = (s: string) => s.replace(/[';%"\\]/g, '').slice(0, 100);
    const searchTerm = sanitize(expandAbbreviations(query.toUpperCase().trim()));
    const bairroTerm = sanitize(bairro?.toUpperCase().trim() || "");

    console.log(`Searching Prefeitura API for: ${searchTerm} in ${bairroTerm || "all bairros"}`);

    // Build query for Prefeitura API
    // A camada da Prefeitura armazena nomes em formato misto
    // ("Rua Jose Higino", "Tijuca"), então normalizamos com UPPER()
    // para a busca ficar case-insensitive.
    let whereClause = `UPPER(completo) LIKE '%${searchTerm}%'`;
    if (bairroTerm) {
      whereClause += ` AND UPPER(bairro) = '${bairroTerm}'`;
    }

    const url = `https://pgeo3.rio.rj.gov.br/arcgis/rest/services/CadLog/Trechos_Logradouros/MapServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=nome_parcial,bairro,hierarquia,completo&returnGeometry=false&returnDistinctValues=true&f=json`;

    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      console.error(`Prefeitura API error: ${response.status}`);
      return new Response(
        JSON.stringify({ results: [], error: "API error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.log(`No results found for: ${searchTerm}`);
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by unique logradouro
    const uniqueLogradouros = new Map<string, { 
      logradouro: string; 
      logradouro_itbi: string;
      bairro: string; 
      hierarquia: string;
      completo: string;
    }>();

    for (const feature of data.features) {
      const { logradouro, bairro: featureBairro, hierarquia, completo } = feature.attributes;
      const key = `${logradouro}|${featureBairro}`;
      
      if (!uniqueLogradouros.has(key)) {
        uniqueLogradouros.set(key, {
          logradouro: completo || logradouro,
          logradouro_itbi: contractToITBI(completo || logradouro),
          bairro: featureBairro,
          hierarquia: hierarquia || "",
          completo: completo || logradouro,
        });
      }
    }

    const results = Array.from(uniqueLogradouros.values())
      .slice(0, limit)
      .map(r => ({
        logradouro_oficial: r.logradouro,
        logradouro_itbi: r.logradouro_itbi,
        bairro: r.bairro,
        hierarquia: r.hierarquia,
        source: "prefeitura",
      }));

    console.log(`Returning ${results.length} results from Prefeitura API`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in search-logradouros-prefeitura:", error);
    return new Response(
      JSON.stringify({ results: [], error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
