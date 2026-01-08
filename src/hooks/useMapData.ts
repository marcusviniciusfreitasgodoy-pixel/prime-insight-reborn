import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MapFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    logradouro: string;
    bairro: string;
    valor_m2_medio: number;
    total_transacoes: number;
    tipologias: string[];
    hierarquia?: string;
  };
}

export interface GeoJSONData {
  type: "FeatureCollection";
  features: MapFeature[];
  metadata?: {
    bairro: string;
    total_features: number;
    pending_geocode: number;
  };
}

export function useMapData(bairro: string | null) {
  return useQuery({
    queryKey: ["map-data", bairro],
    queryFn: async (): Promise<GeoJSONData> => {
      if (!bairro) {
        return { type: "FeatureCollection", features: [] };
      }

      const { data, error } = await supabase.functions.invoke("geo-itbi-clusters", {
        body: { bairro, limit: 100 },
      });

      if (error) {
        console.error("Error fetching map data:", error);
        throw error;
      }

      return data as GeoJSONData;
    },
    enabled: !!bairro,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Get value color based on price per m2
export function getValueColor(valorM2: number): string {
  if (valorM2 < 8000) return "#22c55e"; // green - low
  if (valorM2 < 12000) return "#84cc16"; // lime - below average
  if (valorM2 < 16000) return "#eab308"; // yellow - average
  if (valorM2 < 22000) return "#f97316"; // orange - above average
  return "#ef4444"; // red - high
}

// Format currency for display
export function formatCurrencyShort(value: number): string {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${value.toLocaleString("pt-BR")}`;
}
