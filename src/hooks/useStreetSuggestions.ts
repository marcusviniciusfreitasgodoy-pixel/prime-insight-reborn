import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { expandAbbreviations } from '@/utils/streetNameNormalizer';

export interface StreetSuggestion {
  logradouro: string;
  logradouro_oficial?: string;
  total_transacoes: number;
  nome_condominio?: string;
  microbairro?: string;
  padrao_construtivo?: string;
  source?: 'itbi' | 'prefeitura';
}

/**
 * Hook para buscar sugestões de logradouros.
 * Usa a função RPC do banco get_street_suggestions como fonte primária (mais confiável),
 * enriquece com dados de condomínios, e usa API da Prefeitura como fallback.
 */
export function useStreetSuggestions(query: string, bairro: string = 'BARRA DA TIJUCA') {
  return useQuery<StreetSuggestion[]>({
    queryKey: ['street-suggestions', query, bairro],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const searchTerm = query.toUpperCase().trim();
      const bairroNormalized = bairro.toUpperCase().trim();
      
      // Remove prefixos comuns para buscar pelo nome
      const cleanedSearch = searchTerm
        .replace(/^(AVENIDA|AVN|AV|AV\.|AVENUE)\s*/i, '')
        .replace(/^(RUA|R|R\.)\s*/i, '')
        .replace(/^(PRAÇA|PRC|PRACA)\s*/i, '')
        .replace(/^(ESTRADA|EST|EST\.)\s*/i, '')
        .replace(/^(ALAMEDA|AL|AL\.)\s*/i, '')
        .replace(/^(TRAVESSA|TV|TV\.)\s*/i, '')
        .trim();

      // Aplicar correções de digitação e acentuação
      const correctedSearch = applyTypoCorrections(cleanedSearch);

      // Gerar variações de busca
      const searchVariations = generateSearchVariations(cleanedSearch, correctedSearch);

      // 1. Buscar via RPC do banco (mais confiável)
      const rpcResults = await fetchViaRPC(searchVariations, bairroNormalized);

      // 2. Buscar dados de condomínios para enriquecer
      const condominioMap = await fetchCondominioData(searchVariations);

      // 3. Combinar resultados com dados de condomínios
      const suggestions: StreetSuggestion[] = rpcResults.map((logradouro) => {
        const condInfo = condominioMap.get(logradouro);
        return {
          logradouro,
          logradouro_oficial: expandAbbreviations(logradouro),
          total_transacoes: 1, // RPC não retorna contagem, assumir 1
          nome_condominio: condInfo?.nome,
          microbairro: condInfo?.microbairro,
          padrao_construtivo: condInfo?.padrao,
          source: 'itbi' as const,
        };
      });

      // Adicionar condomínios que correspondem à busca mas não estão nos resultados ITBI
      addCondominioSuggestions(suggestions, condominioMap, searchVariations);

      // 4. Se não houver resultados, tentar API da Prefeitura como fallback
      if (suggestions.length === 0) {
        const prefeituraResults = await fetchFromPrefeituraAPI(searchTerm, bairroNormalized);
        suggestions.push(...prefeituraResults);
      }

      return suggestions.slice(0, 15);
    },
    enabled: query.length >= 2,
    staleTime: 30000,
    retry: 2,
  });
}

/**
 * Busca logradouros via função RPC do banco (mais confiável que queries complexas)
 */
async function fetchViaRPC(searchVariations: string[], bairro: string): Promise<string[]> {
  const allResults = new Set<string>();

  // Buscar para cada variação de pesquisa
  for (const variation of searchVariations.slice(0, 3)) { // Limitar a 3 variações para performance
    try {
      const { data, error } = await supabase.rpc('get_street_suggestions', {
        p_search: variation,
        p_bairro: bairro,
        p_limit: 20,
      });

      if (!error && data) {
        data.forEach((row: { logradouro: string }) => {
          allResults.add(row.logradouro);
        });
      }
    } catch (err) {
      console.warn('RPC search failed for variation:', variation, err);
    }
  }

  return Array.from(allResults);
}

/**
 * Busca dados de condomínios para enriquecer sugestões
 */
async function fetchCondominioData(searchVariations: string[]): Promise<Map<string, { nome: string; microbairro?: string; padrao?: string }>> {
  const condominioMap = new Map<string, { nome: string; microbairro?: string; padrao?: string }>();

  try {
    // Construir condições OR de forma segura
    const orConditions = searchVariations
      .slice(0, 3)
      .flatMap(v => [
        `nome_condominio.ilike.%${v}%`,
        `logradouro_padrao.ilike.%${v}%`,
      ])
      .join(',');

    const { data: condominios } = await supabase
      .from('condominios_mapeamento')
      .select('logradouro_padrao, nome_condominio, microbairro, padrao_construtivo')
      .or(orConditions)
      .limit(30);

    (condominios || []).forEach(c => {
      condominioMap.set(c.logradouro_padrao, {
        nome: c.nome_condominio,
        microbairro: c.microbairro || undefined,
        padrao: c.padrao_construtivo || undefined,
      });
    });
  } catch (err) {
    console.warn('Condominio search failed:', err);
  }

  return condominioMap;
}

/**
 * Adiciona condomínios que correspondem à busca mas não estão nos resultados
 */
function addCondominioSuggestions(
  suggestions: StreetSuggestion[],
  condominioMap: Map<string, { nome: string; microbairro?: string; padrao?: string }>,
  searchVariations: string[]
): void {
  const existingLogradouros = new Set(suggestions.map(s => s.logradouro));

  condominioMap.forEach((condInfo, logradouro) => {
    if (!existingLogradouros.has(logradouro) && suggestions.length < 15) {
      // Verificar se o nome do condomínio corresponde a alguma variação
      const matchesSearch = searchVariations.some(v => 
        condInfo.nome.toUpperCase().includes(v) || logradouro.toUpperCase().includes(v)
      );
      
      if (matchesSearch) {
        suggestions.push({
          logradouro,
          logradouro_oficial: expandAbbreviations(logradouro),
          total_transacoes: 0,
          nome_condominio: condInfo.nome,
          microbairro: condInfo.microbairro,
          padrao_construtivo: condInfo.padrao,
          source: 'itbi' as const,
        });
      }
    }
  });
}

/**
 * Fallback para API da Prefeitura
 */
async function fetchFromPrefeituraAPI(searchTerm: string, bairro: string): Promise<StreetSuggestion[]> {
  const results: StreetSuggestion[] = [];
  
  try {
    const { data: prefeituraData } = await supabase.functions.invoke('search-logradouros-prefeitura', {
      body: { query: searchTerm, bairro, limit: 10 },
    });

    if (prefeituraData?.results?.length > 0) {
      for (const result of prefeituraData.results) {
        results.push({
          logradouro: result.logradouro_itbi,
          logradouro_oficial: result.logradouro_oficial,
          total_transacoes: 0,
          source: 'prefeitura' as const,
        });
      }
    }
  } catch (prefeituraError) {
    console.warn('Prefeitura API fallback failed:', prefeituraError);
  }

  return results;
}

/**
 * Aplica correções de digitação comuns
 */
function applyTypoCorrections(search: string): string {
  const typoCorrections: Record<string, string> = {
    'GUMARAES': 'GUIMARAES',
    'GUIMARAIS': 'GUIMARAES',
    'GIMARAES': 'GUIMARAES',
    'GUIMARÃES': 'GUIMARAES',
    'PERIERA': 'PEREIRA',
    'FERRIERA': 'FERREIRA',
    'FEREIRA': 'FERREIRA',
    'CARDOZO': 'CARDOSO',
    'OLIVIERA': 'OLIVEIRA',
    'RODRIGEZ': 'RODRIGUES',
    'ALMEYDA': 'ALMEIDA',
    'ALMEÍDA': 'ALMEIDA',
    'RIBERO': 'RIBEIRO',
    'PINHERO': 'PINHEIRO',
    'ESTELITA': 'ESTELLITA',
    'ESTRELITA': 'ESTELLITA',
    'ROZAURO': 'ROSAURO',
    'AMERCIAS': 'AMERICAS',
    'AMÉRICAS': 'AMERICAS',
    'TIJUICA': 'TIJUCA',
    'SERNANBETIBA': 'SERNAMBETIBA',
    'SERNABETIBA': 'SERNAMBETIBA',
    'SERNAMETIBA': 'SERNAMBETIBA',
    'PENNINSULA': 'PENINSULA',
    'OCEÂNICO': 'OCEANICO',
    'OCÊANICO': 'OCEANICO',
    'RECREIU': 'RECREIO',
    'BANDIERANTES': 'BANDEIRANTES',
    'LÚCIO': 'LUCIO',
    'OLEGÁRIO': 'OLEGARIO',
    'DULCÍDIO': 'DULCIDIO',
    'ÉRICO': 'ERICO',
    'VERÍSSIMO': 'VERISSIMO',
    'VERISIMO': 'VERISSIMO',
    'JOSÉ': 'JOSE',
    'JOÃO': 'JOAO',
    'ANTÔNIO': 'ANTONIO',
    'FRANCISO': 'FRANCISCO',
    'NIELSON': 'NELSON',
    'AIRTON': 'AYRTON',
    'SENA': 'SENNA',
    'PRAÇA': 'PRACA',
    'ESTAÇÃO': 'ESTACAO',
    'JARDIN': 'JARDIM',
    'CONDOMÍNIO': 'CONDOMINIO',
    'CONDMINIO': 'CONDOMINIO',
    'REZIDENCIAL': 'RESIDENCIAL',
    'EDIFÍCIO': 'EDIFICIO',
    'SHOOPING': 'SHOPPING',
    'SHOPING': 'SHOPPING',
    'METROPLITANO': 'METROPOLITANO',
    'ABELRDO': 'ABELARDO',
    'BUEÑO': 'BUENO',
  };

  let corrected = search;
  Object.entries(typoCorrections).forEach(([typo, correction]) => {
    corrected = corrected.replace(new RegExp(typo, 'gi'), correction);
  });

  return corrected;
}

/**
 * Gera variações de busca incluindo abreviações e letras duplicadas
 */
function generateSearchVariations(cleanedSearch: string, correctedSearch: string): string[] {
  const variations = new Set<string>([cleanedSearch]);
  
  if (correctedSearch !== cleanedSearch) {
    variations.add(correctedSearch);
  }

  // Mapa de abreviações comuns
  const abbreviationMap: Record<string, string[]> = {
    'DESENHISTA': ['DESEN', 'DESENHISTA'],
    'DESEN': ['DESEN', 'DESENHISTA'],
    'ALMIRANTE': ['ALMTE', 'ALM', 'ALMIRANTE'],
    'ALMTE': ['ALMTE', 'ALM', 'ALMIRANTE'],
    'DOUTOR': ['DR', 'DOUTOR'],
    'DR': ['DR', 'DOUTOR'],
    'ENGENHEIRO': ['ENG', 'ENGENHEIRO'],
    'ENG': ['ENG', 'ENGENHEIRO'],
    'PROFESSOR': ['PROF', 'PROFESSOR'],
    'PROF': ['PROF', 'PROFESSOR'],
    'GENERAL': ['GEN', 'GENERAL'],
    'GEN': ['GEN', 'GENERAL'],
  };

  // Aplicar variações de abreviações
  const words = cleanedSearch.split(/\s+/);
  words.forEach(word => {
    const wordVariations = abbreviationMap[word];
    if (wordVariations) {
      wordVariations.forEach(v => {
        const newSearch = cleanedSearch.replace(new RegExp(`\\b${word}\\b`, 'gi'), v);
        variations.add(newSearch);
      });
    }
  });

  // Adicionar variações com/sem letras duplicadas
  const duplicatePatterns = [
    { single: 'L', double: 'LL' },
    { single: 'R', double: 'RR' },
    { single: 'S', double: 'SS' },
    { single: 'T', double: 'TT' },
  ];

  duplicatePatterns.forEach(({ single, double }) => {
    if (cleanedSearch.includes(single) && !cleanedSearch.includes(double)) {
      variations.add(cleanedSearch.replace(new RegExp(single, 'g'), double));
    }
    if (cleanedSearch.includes(double)) {
      variations.add(cleanedSearch.replace(new RegExp(double, 'g'), single));
    }
  });

  return Array.from(variations);
}
