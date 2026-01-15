import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BairroSuggestion {
  bairro: string;
  total_transacoes: number;
}

const CACHE_KEY = "bairros-cache";
const CACHE_TIMESTAMP_KEY = "bairros-cache-timestamp";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

// Salva bairros no localStorage
function saveBairrosToCache(bairros: BairroSuggestion[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(bairros));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.warn("Falha ao salvar cache de bairros:", e);
  }
}

// Recupera bairros do localStorage
function getBairrosFromCache(): BairroSuggestion[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) return null;
    
    // Verifica se o cache ainda é válido (24h)
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }
    
    return JSON.parse(cached) as BairroSuggestion[];
  } catch (e) {
    console.warn("Falha ao recuperar cache de bairros:", e);
    return null;
  }
}

// Busca bairros do servidor
async function fetchBairrosFromServer(): Promise<BairroSuggestion[]> {
  const { data, error } = await supabase
    .from("itbi_stats_bairro")
    .select("bairro, total_transacoes")
    .not("bairro", "is", null);

  if (error) throw error;

  // Agrupar por bairro (somando diferentes usos: Residencial + Comercial)
  const bairroMap: Record<string, number> = {};
  for (const row of data || []) {
    if (row.bairro) {
      bairroMap[row.bairro] = (bairroMap[row.bairro] || 0) + (row.total_transacoes || 0);
    }
  }

  // Converter para array e ordenar por quantidade de transações
  return Object.entries(bairroMap)
    .map(([bairro, total_transacoes]) => ({ bairro, total_transacoes }))
    .sort((a, b) => b.total_transacoes - a.total_transacoes);
}

export function useBairroSuggestions(query: string) {
  const { data: allBairros } = useAllBairros();

  return useQuery<BairroSuggestion[]>({
    queryKey: ["bairro-suggestions", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      // Usar dados já carregados do useAllBairros (com cache)
      const bairros = allBairros || getBairrosFromCache() || [];
      
      const searchLower = query.toLowerCase();
      return bairros
        .filter(b => b.bairro.toLowerCase().includes(searchLower))
        .slice(0, 10);
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useAllBairros() {
  return useQuery<BairroSuggestion[]>({
    queryKey: ["all-bairros"],
    queryFn: async () => {
      try {
        // Tentar buscar do servidor
        const bairros = await fetchBairrosFromServer();
        
        // Salvar no cache local para uso offline
        saveBairrosToCache(bairros);
        
        return bairros;
      } catch (error) {
        // Fallback: usar cache local se disponível
        const cached = getBairrosFromCache();
        if (cached && cached.length > 0) {
          console.info("Usando cache local de bairros (offline)");
          return cached;
        }
        
        // Se não há cache, propagar o erro
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos no garbage collector
    retry: 2,
    // Inicializar com cache local enquanto carrega
    initialData: () => getBairrosFromCache() || undefined,
    initialDataUpdatedAt: () => {
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      return timestamp ? parseInt(timestamp, 10) : undefined;
    },
  });
}
