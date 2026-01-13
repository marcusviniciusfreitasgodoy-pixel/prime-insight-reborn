import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FollowUpMetrics {
  totalLeads: number;
  leadsElegiveis: number;
  followupEnviados: number;
  followupUltimaSemana: number;
  leadsPendentes: number;
  parecerSolicitado: number;
  taxaConversaoParecer: number;
  taxaEnvioFollowup: number;
  convertidosPosFollowup: number;
  taxaConversaoFollowup: number;
  aceitaMarketing: number;
  evolucaoDiaria: Array<{
    dia: string;
    followups: number;
    pareceres: number;
  }>;
  proximosFollowups: Array<{
    id: string;
    nome: string;
    email: string;
    bairro: string | null;
    horasRestantes: number;
  }>;
}

export function useFollowUpMetrics(diasFiltro: number = 30) {
  return useQuery({
    queryKey: ["followup-metrics", diasFiltro],
    queryFn: async (): Promise<FollowUpMetrics> => {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - diasFiltro);
      
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);

      const quarentaEOitoHorasAtras = new Date(Date.now() - 48 * 60 * 60 * 1000);

      // Buscar todos os leads do período
      const { data: leads, error } = await supabase
        .from("leads")
        .select("id, nome, email, bairro_interesse, created_at, followup_sent_at, parecer_solicitado, parecer_solicitado_at, convertido, aceita_marketing")
        .gte("created_at", dataInicio.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      const allLeads = leads || [];
      
      // KPIs básicos
      const totalLeads = allLeads.length;
      
      // Leads elegíveis para follow-up (criados há mais de 48h, sem parecer solicitado)
      const leadsElegiveis = allLeads.filter(
        (l) => new Date(l.created_at) <= quarentaEOitoHorasAtras && !l.parecer_solicitado
      ).length;
      
      // Follow-ups enviados
      const followupEnviados = allLeads.filter((l) => l.followup_sent_at).length;
      
      // Follow-ups na última semana
      const followupUltimaSemana = allLeads.filter(
        (l) => l.followup_sent_at && new Date(l.followup_sent_at) >= semanaAtras
      ).length;
      
      // Leads pendentes (criados, mas ainda não elegíveis para follow-up)
      const leadsPendentes = allLeads.filter(
        (l) => new Date(l.created_at) > quarentaEOitoHorasAtras && 
               !l.parecer_solicitado && 
               !l.followup_sent_at
      ).length;
      
      // Parecer solicitado
      const parecerSolicitado = allLeads.filter((l) => l.parecer_solicitado).length;
      
      // Taxa de conversão para parecer
      const taxaConversaoParecer = totalLeads > 0 
        ? (parecerSolicitado / totalLeads) * 100 
        : 0;
      
      // Taxa de envio de follow-up
      const taxaEnvioFollowup = leadsElegiveis > 0 
        ? (followupEnviados / leadsElegiveis) * 100 
        : 0;
      
      // Convertidos após receber follow-up
      const convertidosPosFollowup = allLeads.filter(
        (l) => l.followup_sent_at && l.convertido
      ).length;
      
      // Taxa de conversão pós follow-up
      const taxaConversaoFollowup = followupEnviados > 0
        ? (convertidosPosFollowup / followupEnviados) * 100
        : 0;
      
      // Aceita marketing
      const aceitaMarketing = allLeads.filter((l) => l.aceita_marketing === true).length;

      // Evolução diária
      const evolucaoMap = new Map<string, { followups: number; pareceres: number }>();
      
      allLeads.forEach((lead) => {
        // Contar follow-ups por dia
        if (lead.followup_sent_at) {
          const diaFollowup = new Date(lead.followup_sent_at).toISOString().split("T")[0];
          const entry = evolucaoMap.get(diaFollowup) || { followups: 0, pareceres: 0 };
          entry.followups += 1;
          evolucaoMap.set(diaFollowup, entry);
        }
        
        // Contar pareceres por dia
        if (lead.parecer_solicitado_at) {
          const diaParecer = new Date(lead.parecer_solicitado_at).toISOString().split("T")[0];
          const entry = evolucaoMap.get(diaParecer) || { followups: 0, pareceres: 0 };
          entry.pareceres += 1;
          evolucaoMap.set(diaParecer, entry);
        }
      });
      
      const evolucaoDiaria = Array.from(evolucaoMap.entries())
        .map(([dia, data]) => ({ dia, ...data }))
        .sort((a, b) => a.dia.localeCompare(b.dia));

      // Próximos follow-ups (leads que serão elegíveis nas próximas 48h)
      const agora = new Date();
      const proximosFollowups = allLeads
        .filter((l) => {
          const createdAt = new Date(l.created_at);
          const elegivel48h = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
          return elegivel48h > agora && 
                 !l.parecer_solicitado && 
                 !l.followup_sent_at &&
                 (l.aceita_marketing === true || l.aceita_marketing === null);
        })
        .map((l) => {
          const createdAt = new Date(l.created_at);
          const elegivel48h = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
          const horasRestantes = Math.max(0, Math.round((elegivel48h.getTime() - agora.getTime()) / (1000 * 60 * 60)));
          return {
            id: l.id,
            nome: l.nome,
            email: l.email,
            bairro: l.bairro_interesse,
            horasRestantes,
          };
        })
        .sort((a, b) => a.horasRestantes - b.horasRestantes);

      return {
        totalLeads,
        leadsElegiveis,
        followupEnviados,
        followupUltimaSemana,
        leadsPendentes,
        parecerSolicitado,
        taxaConversaoParecer,
        taxaEnvioFollowup,
        convertidosPosFollowup,
        taxaConversaoFollowup,
        aceitaMarketing,
        evolucaoDiaria,
        proximosFollowups,
      };
    },
  });
}
