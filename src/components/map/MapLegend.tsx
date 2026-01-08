import { memo } from "react";

const LEGEND_ITEMS = [
  { color: "#22c55e", label: "< R$ 8k/m²", description: "Baixo" },
  { color: "#84cc16", label: "R$ 8-12k/m²", description: "Abaixo média" },
  { color: "#eab308", label: "R$ 12-16k/m²", description: "Médio" },
  { color: "#f97316", label: "R$ 16-22k/m²", description: "Acima média" },
  { color: "#ef4444", label: "> R$ 22k/m²", description: "Alto" },
];

export const MapLegend = memo(function MapLegend() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 min-w-[140px]">
      <h4 className="text-xs font-semibold text-[#0C2340] mb-2">Valor por m²</h4>
      <div className="space-y-1.5">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.color} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-[9px] text-muted-foreground">
          Tamanho = nº transações
        </p>
      </div>
    </div>
  );
});
