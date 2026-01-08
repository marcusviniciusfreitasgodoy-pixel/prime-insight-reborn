import { useState, useRef, useEffect, memo } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStreetSuggestions } from "@/hooks/useStreetSuggestions";

interface MapSearchBoxProps {
  bairro: string | null;
  onSelect: (lat: number, lng: number, logradouro: string) => void;
}

export const MapSearchBox = memo(function MapSearchBox({ bairro, onSelect }: MapSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading } = useStreetSuggestions(query, bairro || undefined);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (logradouro: string) => {
    setQuery(logradouro);
    setIsOpen(false);
    // Note: We'd need geocoding here, for now just close the dropdown
    // In a real implementation, we'd call the geo API to get coordinates
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={bairro ? `Buscar rua em ${bairro}...` : "Selecione um bairro primeiro"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={!bairro}
          className="pl-9 pr-9 bg-white shadow-lg border-0 focus-visible:ring-[#D4AF37]"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && query.length >= 2 && suggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border max-h-[200px] overflow-y-auto z-[1001]">
          {suggestions.slice(0, 8).map((suggestion, index) => (
            <button
              key={`${suggestion.logradouro}-${index}`}
              onClick={() => handleSelect(suggestion.logradouro)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#0C2340] truncate">
                  {suggestion.logradouro}
                </span>
                {suggestion.total_transacoes > 0 && (
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">
                    {suggestion.total_transacoes} tx
                  </span>
                )}
              </div>
              {suggestion.nome_condominio && (
                <span className="text-xs text-[#D4AF37] block truncate">
                  {suggestion.nome_condominio}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && !isLoading && suggestions?.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border p-3 z-[1001]">
          <p className="text-sm text-muted-foreground text-center">
            Nenhum resultado encontrado
          </p>
        </div>
      )}
    </div>
  );
});
