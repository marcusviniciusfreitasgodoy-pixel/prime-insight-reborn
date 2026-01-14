import { useState, useRef, useEffect, memo, useCallback } from "react";
import { Search, Loader2, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStreetSuggestions, StreetSuggestion } from "@/hooks/useStreetSuggestions";
import { supabase } from "@/integrations/supabase/client";

interface MapSearchBoxProps {
  bairro: string | null;
  onSelect: (lat: number, lng: number, logradouro: string) => void;
}

// Geocode a logradouro using secure edge function
async function geocodeLogradouro(logradouro: string, bairro: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // First check cache (read-only access allowed for all users)
    const { data: cached } = await supabase
      .from("logradouros_geocoded")
      .select("latitude, longitude")
      .eq("logradouro", logradouro)
      .eq("bairro", bairro.toUpperCase())
      .maybeSingle();

    if (cached?.latitude && cached?.longitude) {
      return { lat: cached.latitude, lng: cached.longitude };
    }

    // Use edge function for geocoding (handles cache writes securely)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/geocode-logradouro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ logradouro, bairro }),
    });

    if (!response.ok) {
      console.error("Geocoding API error:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.lat && data.lng) {
      return { lat: data.lat, lng: data.lng };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export const MapSearchBox = memo(function MapSearchBox({ bairro, onSelect }: MapSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
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

  const handleSelect = useCallback(async (suggestion: StreetSuggestion) => {
    if (!bairro) return;
    
    setQuery(suggestion.logradouro);
    setIsOpen(false);
    setIsGeocoding(true);

    try {
      const coords = await geocodeLogradouro(suggestion.logradouro, bairro);
      if (coords) {
        onSelect(coords.lat, coords.lng, suggestion.logradouro);
      }
    } finally {
      setIsGeocoding(false);
    }
  }, [bairro, onSelect]);

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
          placeholder={bairro ? `Buscar rua, avenida em ${bairro}...` : "Primeiro selecione um bairro acima"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={!bairro}
          className="pl-9 pr-9 bg-white shadow-lg border-0 focus-visible:ring-[#D4AF37] text-sm"
        />
        {query && !isGeocoding && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {(isLoading || isGeocoding) && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && query.length >= 2 && suggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border max-h-[280px] overflow-y-auto z-[1001]">
          {suggestions.slice(0, 10).map((suggestion, index) => (
            <button
              key={`${suggestion.logradouro}-${index}`}
              onClick={() => handleSelect(suggestion)}
              className="w-full px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#D4AF37] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[#0C2340] font-medium truncate">
                      {suggestion.logradouro}
                    </span>
                    {suggestion.total_transacoes > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">
                        {suggestion.total_transacoes} tx
                      </span>
                    )}
                  </div>
                  {suggestion.nome_condominio && (
                    <span className="text-xs text-[#D4AF37] block truncate mt-0.5">
                      {suggestion.nome_condominio}
                    </span>
                  )}
                  {suggestion.microbairro && (
                    <span className="text-xs text-gray-500 block truncate">
                      {suggestion.microbairro}
                    </span>
                  )}
                </div>
              </div>
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