import { useEffect, useRef, useState, memo, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapData, getValueColor, MapFeature } from "@/hooks/useMapData";
import { MapLegend } from "./MapLegend";
import { MapSearchBox } from "./MapSearchBox";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface PropertyMapProps {
  selectedBairro: string | null;
  onSelectAddress?: (logradouro: string, bairro: string) => void;
  className?: string;
}

interface MapFilters {
  tipologia: string[];
  minTransacoes: number;
}

// Barra da Tijuca center coordinates
const DEFAULT_CENTER: [number, number] = [-23.000, -43.365];
const DEFAULT_ZOOM = 13;

// Create custom circle marker
function createCircleMarker(feature: MapFeature): L.CircleMarker {
  const color = getValueColor(feature.properties.valor_m2_medio);
  const radius = Math.min(20, Math.max(8, feature.properties.total_transacoes / 3));

  return L.circleMarker(
    [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
    {
      radius,
      fillColor: color,
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    }
  );
}

// Create popup content
function createPopupContent(feature: MapFeature): string {
  const { logradouro, bairro, valor_m2_medio, total_transacoes, tipologias } = feature.properties;
  
  return `
    <div class="p-2 min-w-[200px]">
      <h4 class="font-bold text-sm text-[#0C2340] mb-1 leading-tight">${logradouro}</h4>
      <p class="text-xs text-gray-500 mb-2">${bairro}</p>
      <div class="space-y-1">
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-600">Valor médio/m²:</span>
          <span class="font-bold text-sm text-[#D4AF37]">R$ ${valor_m2_medio.toLocaleString("pt-BR")}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-600">Transações:</span>
          <span class="font-medium text-sm">${total_transacoes}</span>
        </div>
        ${tipologias.length > 0 ? `
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-600">Tipos:</span>
            <span class="text-xs">${tipologias.join(", ")}</span>
          </div>
        ` : ""}
      </div>
      <button 
        onclick="window.dispatchEvent(new CustomEvent('map-select-address', { detail: { logradouro: '${logradouro.replace(/'/g, "\\'")}', bairro: '${bairro}' } }))"
        class="mt-3 w-full bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
      >
        Avaliar este endereço
      </button>
    </div>
  `;
}

export const PropertyMap = memo(function PropertyMap({ 
  selectedBairro, 
  onSelectAddress,
  className = "" 
}: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [filters, setFilters] = useState<MapFilters>({
    tipologia: ["Apartamento", "Casa"],
    minTransacoes: 1,
  });

  const { data: geoData, isLoading, error } = useMapData(selectedBairro);

  // Filter features based on current filters
  const filteredFeatures = useMemo(() => {
    if (!geoData?.features) return [];
    
    return geoData.features.filter(feature => {
      const { tipologias, total_transacoes } = feature.properties;
      
      // Filter by minimum transactions
      if (total_transacoes < filters.minTransacoes) return false;
      
      // Filter by tipologia (if feature has tipologias, at least one must match)
      if (tipologias.length > 0) {
        const hasMatchingTipologia = tipologias.some(t => filters.tipologia.includes(t));
        if (!hasMatchingTipologia) return false;
      }
      
      return true;
    });
  }, [geoData?.features, filters]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    // Add zoom control to top right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Create markers layer
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle address selection from popup
  useEffect(() => {
    const handleSelectAddress = (e: CustomEvent<{ logradouro: string; bairro: string }>) => {
      if (onSelectAddress) {
        onSelectAddress(e.detail.logradouro, e.detail.bairro);
      }
    };

    window.addEventListener("map-select-address", handleSelectAddress as EventListener);
    return () => {
      window.removeEventListener("map-select-address", handleSelectAddress as EventListener);
    };
  }, [onSelectAddress]);

  // Update markers when filtered data changes
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    if (filteredFeatures.length === 0) return;

    // Add new markers
    const bounds = L.latLngBounds([]);

    for (const feature of filteredFeatures) {
      const marker = createCircleMarker(feature);
      marker.bindPopup(createPopupContent(feature), {
        maxWidth: 280,
        className: "property-popup",
      });
      marker.addTo(markersLayerRef.current);
      bounds.extend([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
    }

    // Fit map to markers
    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [filteredFeatures]);

  // Geolocation
  const handleLocateMe = useCallback(() => {
    if (!mapRef.current) return;
    
    setIsLocating(true);
    
    mapRef.current.locate({ setView: true, maxZoom: 15 });
    
    mapRef.current.once("locationfound", (e) => {
      setIsLocating(false);
      L.marker(e.latlng)
        .addTo(mapRef.current!)
        .bindPopup("Você está aqui")
        .openPopup();
    });
    
    mapRef.current.once("locationerror", () => {
      setIsLocating(false);
    });
  }, []);

  // Handle search result with geocoding
  const handleSearchSelect = useCallback((lat: number, lng: number, logradouro: string) => {
    if (!mapRef.current) return;
    
    // Remove previous search marker
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
    }

    // Add new marker at searched location
    const searchIcon = L.divIcon({
      className: "search-marker",
      html: `<div style="background: #D4AF37; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    searchMarkerRef.current = L.marker([lat, lng], { icon: searchIcon })
      .addTo(mapRef.current)
      .bindPopup(`
        <div class="p-2">
          <h4 class="font-bold text-sm text-[#0C2340] mb-2">${logradouro}</h4>
          <button 
            onclick="window.dispatchEvent(new CustomEvent('map-select-address', { detail: { logradouro: '${logradouro.replace(/'/g, "\\'")}', bairro: '${selectedBairro || ""}' } }))"
            class="w-full bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
          >
            Avaliar este endereço
          </button>
        </div>
      `, { maxWidth: 250 })
      .openPopup();

    mapRef.current.setView([lat, lng], 16);
  }, [selectedBairro]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: MapFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[400px] rounded-xl overflow-hidden ${className}`}>
      {/* Map container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Search box */}
      <div className="absolute top-3 left-3 right-14 z-[1000]">
        <MapSearchBox 
          bairro={selectedBairro} 
          onSelect={handleSearchSelect}
        />
      </div>

      {/* Controls */}
      <div className="absolute top-16 right-3 z-[1000] flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="bg-white shadow-lg hover:bg-gray-50 w-10 h-10"
          title="Minha localização"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Legend with filters */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        <MapLegend 
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[1001] bg-white/70 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            <span className="text-sm text-muted-foreground">Carregando dados do mapa...</span>
          </div>
        </div>
      )}

      {/* No bairro selected */}
      {!selectedBairro && !isLoading && (
        <div className="absolute inset-0 z-[1001] bg-gray-50/90 flex items-center justify-center">
          <div className="text-center p-6">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <h4 className="font-semibold text-[#0C2340] mb-1">Selecione um bairro</h4>
            <p className="text-sm text-muted-foreground">
              Escolha um bairro no formulário para ver os valores no mapa
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute bottom-16 left-3 right-3 z-[1001]">
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-lg">
            Erro ao carregar dados do mapa
          </div>
        </div>
      )}

      {/* Metadata info */}
      {geoData?.metadata && (
        <div className="absolute bottom-3 right-3 z-[1000]">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow text-xs text-muted-foreground">
            {filteredFeatures.length} pontos
            {geoData.metadata.pending_geocode > 0 && ` • ${geoData.metadata.pending_geocode} pendentes`}
          </div>
        </div>
      )}
    </div>
  );
});
