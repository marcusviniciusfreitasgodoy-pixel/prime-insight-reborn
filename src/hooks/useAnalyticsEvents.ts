import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsEventDaily {
  dia: string;
  event_type: string;
  bairro: string;
  total: number;
}

export interface AnalyticsKPI {
  event_type: string;
  total: number;
  today: number;
  last7days: number;
}

export function useAnalyticsEvents(days: number = 30) {
  return useQuery({
    queryKey: ["analytics-events", days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_type, bairro, created_at")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Agregar por dia, tipo e bairro
      const aggregated: Record<string, AnalyticsEventDaily> = {};
      const kpis: Record<string, AnalyticsKPI> = {};

      const today = new Date().toISOString().split("T")[0];
      const last7 = new Date();
      last7.setDate(last7.getDate() - 7);

      for (const event of data || []) {
        const dia = event.created_at.split("T")[0];
        const bairro = event.bairro || "Não informado";
        const key = `${dia}-${event.event_type}-${bairro}`;

        if (!aggregated[key]) {
          aggregated[key] = { dia, event_type: event.event_type, bairro, total: 0 };
        }
        aggregated[key].total++;

        // KPIs
        if (!kpis[event.event_type]) {
          kpis[event.event_type] = { event_type: event.event_type, total: 0, today: 0, last7days: 0 };
        }
        kpis[event.event_type].total++;
        if (dia === today) kpis[event.event_type].today++;
        if (new Date(event.created_at) >= last7) kpis[event.event_type].last7days++;
      }

      return {
        daily: Object.values(aggregated).sort((a, b) => b.dia.localeCompare(a.dia)),
        kpis: Object.values(kpis),
      };
    },
    staleTime: 60 * 1000, // 1 minuto
    refetchOnWindowFocus: false,
  });
}
