import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MAX_FREE_EVALUATIONS = 5;

export interface LeadsMetrics {
  totalLeads: number;
  leadsUltimaSemana: number;
  leadsAtingiramLimite: number;
  taxaLimiteAtingido: number;
  leadsConvertidos: number;
  taxaConversao: number;
  taxaConversaoPosLimite: number;
  mediaAvaliacoes: number;
  evolucaoDiaria: Array<{
    dia: string;
    novosLeads: number;
    atingiramLimite: number;
  }>;
  porBairro: Array<{
    bairro: string;
    total: number;
  }>;
  porOrigem: Array<{
    origem: string;
    total: number;
    convertidos: number;
  }>;
}

export function useLeadsMetrics(diasFiltro: number = 30) {
  return useQuery({
    queryKey: ["leads-metrics", diasFiltro],
    queryFn: async (): Promise<LeadsMetrics> => {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - diasFiltro);
      
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);

      // Buscar todos os leads
      const { data: leads, error } = await supabase
        .from("leads")
        .select("*")
        .gte("created_at", dataInicio.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      const allLeads = leads || [];
      
      // KPIs
      const totalLeads = allLeads.length;
      const leadsUltimaSemana = allLeads.filter(
        (l) => new Date(l.created_at) >= semanaAtras
      ).length;
      const leadsAtingiramLimite = allLeads.filter(
        (l) => (l.evaluation_count || 0) >= MAX_FREE_EVALUATIONS
      ).length;
      const taxaLimiteAtingido = totalLeads > 0 
        ? (leadsAtingiramLimite / totalLeads) * 100 
        : 0;
      const leadsConvertidos = allLeads.filter((l) => l.convertido).length;
      const taxaConversao = totalLeads > 0 
        ? (leadsConvertidos / totalLeads) * 100 
        : 0;
      
      // Taxa de conversão pós-limite
      const convertidosPosLimite = allLeads.filter(
        (l) => (l.evaluation_count || 0) >= MAX_FREE_EVALUATIONS && l.convertido
      ).length;
      const taxaConversaoPosLimite = leadsAtingiramLimite > 0
        ? (convertidosPosLimite / leadsAtingiramLimite) * 100
        : 0;
      
      const mediaAvaliacoes = totalLeads > 0
        ? allLeads.reduce((acc, l) => acc + (l.evaluation_count || 0), 0) / totalLeads
        : 0;

      // Evolução diária
      const evolucaoMap = new Map<string, { novosLeads: number; atingiramLimite: number }>();
      allLeads.forEach((lead) => {
        const dia = new Date(lead.created_at).toISOString().split("T")[0];
        const entry = evolucaoMap.get(dia) || { novosLeads: 0, atingiramLimite: 0 };
        entry.novosLeads += 1;
        if ((lead.evaluation_count || 0) >= MAX_FREE_EVALUATIONS) {
          entry.atingiramLimite += 1;
        }
        evolucaoMap.set(dia, entry);
      });
      const evolucaoDiaria = Array.from(evolucaoMap.entries())
        .map(([dia, data]) => ({ dia, ...data }))
        .sort((a, b) => a.dia.localeCompare(b.dia));

      // Por bairro
      const bairroMap = new Map<string, number>();
      allLeads.forEach((lead) => {
        const bairro = lead.bairro_interesse || "Não informado";
        bairroMap.set(bairro, (bairroMap.get(bairro) || 0) + 1);
      });
      const porBairro = Array.from(bairroMap.entries())
        .map(([bairro, total]) => ({ bairro, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Por origem
      const origemMap = new Map<string, { total: number; convertidos: number }>();
      allLeads.forEach((lead) => {
        const origem = lead.origem || "Não informado";
        const entry = origemMap.get(origem) || { total: 0, convertidos: 0 };
        entry.total += 1;
        if (lead.convertido) entry.convertidos += 1;
        origemMap.set(origem, entry);
      });
      const porOrigem = Array.from(origemMap.entries())
        .map(([origem, data]) => ({ origem, ...data }))
        .sort((a, b) => b.total - a.total);

      return {
        totalLeads,
        leadsUltimaSemana,
        leadsAtingiramLimite,
        taxaLimiteAtingido,
        leadsConvertidos,
        taxaConversao,
        taxaConversaoPosLimite,
        mediaAvaliacoes,
        evolucaoDiaria,
        porBairro,
        porOrigem,
      };
    },
  });
}
