import { useState, memo } from "react";
import { MapPin, ChevronDown, Search } from "lucide-react";
import { useAllBairros } from "@/hooks/useBairroSuggestions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MapBairroSelectorProps {
  selectedBairro: string | null;
  onBairroChange: (bairro: string) => void;
}

export const MapBairroSelector = memo(function MapBairroSelector({
  selectedBairro,
  onBairroChange,
}: MapBairroSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const { data: bairros, isLoading } = useAllBairros();

  const filteredBairros = (bairros || [])
    .filter((b) => b.bairro.toLowerCase().includes(searchFilter.toLowerCase()))
    .sort((a, b) => b.total_transacoes - a.total_transacoes)
    .slice(0, 30);

  const handleSelect = (bairro: string) => {
    onBairroChange(bairro);
    setIsOpen(false);
    setSearchFilter("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-white shadow-lg hover:bg-gray-50 gap-2 px-3 h-10 min-w-[160px] justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 text-[#D4AF37] shrink-0" />
            <span className="truncate text-sm font-medium">
              {selectedBairro || "Selecione o bairro"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar bairro..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 h-9"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando bairros...
            </div>
          ) : filteredBairros.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum bairro encontrado
            </div>
          ) : (
            <div className="p-1">
              {filteredBairros.map(({ bairro, total_transacoes }) => (
                <button
                  key={bairro}
                  onClick={() => handleSelect(bairro)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedBairro === bairro
                      ? "bg-[#D4AF37]/10 text-[#0C2340] font-medium"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate">{bairro}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {total_transacoes.toLocaleString("pt-BR")} tx
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
});
