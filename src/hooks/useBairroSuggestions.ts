import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BairroSuggestion {
  bairro: string;
  total_transacoes: number;
}

export function useBairroSuggestions(query: string) {
  return useQuery<BairroSuggestion[]>({
    queryKey: ["bairro-suggestions", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      // Usar a view pública agregada em vez da tabela protegida
      const { data, error } = await supabase
        .from("itbi_stats_bairro")
        .select("bairro, total_transacoes")
        .not("bairro", "is", null)
        .ilike("bairro", `%${query}%`);

      if (error) throw error;

      // Agrupar por bairro (somando diferentes usos)
      const bairroMap: Record<string, number> = {};
      for (const row of data || []) {
        if (row.bairro) {
          bairroMap[row.bairro] = (bairroMap[row.bairro] || 0) + (row.total_transacoes || 0);
        }
      }

      // Converter para array e ordenar
      return Object.entries(bairroMap)
        .map(([bairro, total_transacoes]) => ({ bairro, total_transacoes }))
        .sort((a, b) => b.total_transacoes - a.total_transacoes)
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
      // Usar a view pública agregada em vez da tabela protegida
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
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
