import { memo } from "react";
import { Building2, Home, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MapLegendProps {
  filters?: {
    tipologia: string[];
    minTransacoes: number;
  };
  onFiltersChange?: (filters: { tipologia: string[]; minTransacoes: number }) => void;
}

const VALUE_RANGES = [
  { label: "< R$ 8k/m²", color: "#22c55e", min: 0, max: 8000 },
  { label: "R$ 8k - 12k", color: "#eab308", min: 8000, max: 12000 },
  { label: "R$ 12k - 16k", color: "#f97316", min: 12000, max: 16000 },
  { label: "R$ 16k - 20k", color: "#ef4444", min: 16000, max: 20000 },
  { label: "> R$ 20k/m²", color: "#7c3aed", min: 20000, max: Infinity },
];

const TIPOLOGIAS = [
  { value: "Apartamento", label: "Apartamento", icon: Building2 },
  { value: "Casa", label: "Casa", icon: Home },
];

const MIN_TRANSACOES_OPTIONS = [
  { value: 1, label: "Todos" },
  { value: 3, label: "3+ transações" },
  { value: 5, label: "5+ transações" },
  { value: 10, label: "10+ transações" },
];

export const MapLegend = memo(function MapLegend({ filters, onFiltersChange }: MapLegendProps) {
  const handleTipologiaToggle = (tipologia: string) => {
    if (!onFiltersChange || !filters) return;
    
    const newTipologias = filters.tipologia.includes(tipologia)
      ? filters.tipologia.filter(t => t !== tipologia)
      : [...filters.tipologia, tipologia];
    
    onFiltersChange({ ...filters, tipologia: newTipologias });
  };

  const handleMinTransacoesChange = (value: number) => {
    if (!onFiltersChange || !filters) return;
    onFiltersChange({ ...filters, minTransacoes: value });
  };

  return (
    <div className="flex items-end gap-2">
      {/* Color Legend */}
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2.5">
        <p className="text-[10px] font-semibold text-[#0C2340] mb-1.5 uppercase tracking-wide">
          Valor R$/m²
        </p>
        <div className="space-y-1">
          {VALUE_RANGES.map((range) => (
            <div key={range.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: range.color }}
              />
              <span className="text-[10px] text-gray-600">{range.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Dropdown */}
      {onFiltersChange && filters && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white shadow-lg h-9 px-3"
            >
              <Filter className="h-4 w-4 mr-1.5" />
              Filtros
              {(filters.tipologia.length < TIPOLOGIAS.length || filters.minTransacoes > 1) && (
                <span className="ml-1.5 bg-[#D4AF37] text-[#0C2340] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {(TIPOLOGIAS.length - filters.tipologia.length) + (filters.minTransacoes > 1 ? 1 : 0)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Tipologia</DropdownMenuLabel>
            {TIPOLOGIAS.map((tipo) => (
              <DropdownMenuCheckboxItem
                key={tipo.value}
                checked={filters.tipologia.includes(tipo.value)}
                onCheckedChange={() => handleTipologiaToggle(tipo.value)}
              >
                <tipo.icon className="h-4 w-4 mr-2" />
                {tipo.label}
              </DropdownMenuCheckboxItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Mín. Transações</DropdownMenuLabel>
            {MIN_TRANSACOES_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={filters.minTransacoes === option.value}
                onCheckedChange={() => handleMinTransacoesChange(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
});
