import { useEffect, useRef, useState, memo, useMemo, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from "@react-google-maps/api";
import { useMapData, getValueColor, MapFeature } from "@/hooks/useMapData";
import { MapLegend } from "./MapLegend";
import { MapSearchBox } from "./MapSearchBox";
import { Loader2, MapPin, Navigation, Eye, Map as MapIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_MAPS_API_KEY = "AIzaSyAU--MGXjnmv7FRXDrdjdKavYHFMepV6FQ";

interface PropertyMapProps {
  selectedBairro: string | null;
  selectedLogradouro?: string | null;
  onSelectAddress?: (logradouro: string, bairro: string) => void;
  className?: string;
}

interface MapFilters {
  tipologia: string[];
  minTransacoes: number;
}

// Barra da Tijuca center coordinates
const DEFAULT_CENTER = { lat: -23.000, lng: -43.365 };
const DEFAULT_ZOOM = 13;

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
  enableCloseButton: false,
  addressControl: true,
  fullscreenControl: false,
  motionTracking: false,
  motionTrackingControl: false,
  showRoadLabels: true,
  zoomControl: true,
  panControl: true,
};

export const PropertyMap = memo(function PropertyMap({ 
  selectedBairro, 
  selectedLogradouro,
  onSelectAddress,
  className = "" 
}: PropertyMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [searchMarker, setSearchMarker] = useState<{ position: google.maps.LatLngLiteral; logradouro: string } | null>(null);
  const [addressMarker, setAddressMarker] = useState<{ position: google.maps.LatLngLiteral; logradouro: string } | null>(null);
  const [showStreetView, setShowStreetView] = useState(false);
  const [streetViewPosition, setStreetViewPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [streetViewAvailable, setStreetViewAvailable] = useState(true);
  const [filters, setFilters] = useState<MapFilters>({
    tipologia: ["Apartamento", "Casa"],
    minTransacoes: 1,
  });

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: "pt-BR",
    region: "BR",
  });

  const { data: geoData, isLoading, error } = useMapData(selectedBairro);

  // Filter features based on current filters
  const filteredFeatures = useMemo(() => {
    if (!geoData?.features) return [];
    
    return geoData.features.filter(feature => {
      const { tipologias, total_transacoes } = feature.properties;
      
      if (total_transacoes < filters.minTransacoes) return false;
      
      if (tipologias.length > 0) {
        const hasMatchingTipologia = tipologias.some(t => filters.tipologia.includes(t));
        if (!hasMatchingTipologia) return false;
      }
      
      return true;
    });
  }, [geoData?.features, filters]);

  // Fit bounds when features change
  useEffect(() => {
    if (!mapRef.current || filteredFeatures.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    filteredFeatures.forEach(feature => {
      bounds.extend({
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      });
    });

    mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }, [filteredFeatures]);

  // Geocode and show marker for selected logradouro from form
  useEffect(() => {
    if (!selectedLogradouro || !selectedBairro) {
      setAddressMarker(null);
      return;
    }

    const searchAddress = async () => {
      try {
        const { data } = await supabase
          .from("logradouros_geocoded")
          .select("latitude, longitude, logradouro")
          .eq("bairro", selectedBairro)
          .ilike("logradouro", `%${selectedLogradouro}%`)
          .not("latitude", "is", null)
          .limit(1)
          .single();

        if (data?.latitude && data?.longitude) {
          const position = { lat: data.latitude, lng: data.longitude };
          setAddressMarker({ position, logradouro: data.logradouro });
          
          if (mapRef.current) {
            mapRef.current.panTo(position);
            mapRef.current.setZoom(15);
          }
        }
      } catch (error) {
        console.log("Address not found in geocoded data:", selectedLogradouro);
      }
    };

    searchAddress();
  }, [selectedLogradouro, selectedBairro]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    
    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(pos);
        setIsLocating(false);
        
        if (mapRef.current) {
          mapRef.current.panTo(pos);
          mapRef.current.setZoom(15);
        }
      },
      () => {
        setIsLocating(false);
      }
    );
  }, []);

  const handleSearchSelect = useCallback((lat: number, lng: number, logradouro: string) => {
    const position = { lat, lng };
    setSearchMarker({ position, logradouro });
    setSelectedFeature(null);
    
    if (mapRef.current) {
      mapRef.current.panTo(position);
      mapRef.current.setZoom(16);
    }
  }, []);

  const handleFiltersChange = useCallback((newFilters: MapFilters) => {
    setFilters(newFilters);
  }, []);

  const handleMarkerClick = useCallback((feature: MapFeature) => {
    setSelectedFeature(feature);
    setSearchMarker(null);
  }, []);

  const handleSelectAddress = useCallback((logradouro: string, bairro: string) => {
    if (onSelectAddress) {
      onSelectAddress(logradouro, bairro);
    }
    setSelectedFeature(null);
    setSearchMarker(null);
  }, [onSelectAddress]);

  // Check Street View availability and open it
  const openStreetView = useCallback((position: google.maps.LatLngLiteral) => {
    const streetViewService = new google.maps.StreetViewService();
    
    streetViewService.getPanorama({ location: position, radius: 100 }, (data, status) => {
      if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
        setStreetViewPosition({
          lat: data.location.latLng.lat(),
          lng: data.location.latLng.lng(),
        });
        setStreetViewAvailable(true);
        setShowStreetView(true);
      } else {
        setStreetViewAvailable(false);
        setShowStreetView(true);
        setTimeout(() => setShowStreetView(false), 2000);
      }
    });
  }, []);

  const handleStreetViewClick = useCallback((position: google.maps.LatLngLiteral) => {
    openStreetView(position);
  }, [openStreetView]);

  const closeStreetView = useCallback(() => {
    setShowStreetView(false);
    setStreetViewPosition(null);
  }, []);

  if (loadError) {
    return (
      <div className={`relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
        <p className="text-destructive">Erro ao carregar o Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`relative w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  // Initialize Street View when position changes
  useEffect(() => {
    if (!showStreetView || !streetViewPosition || !streetViewAvailable) return;

    const streetViewContainer = document.getElementById("street-view-container");
    if (!streetViewContainer) return;

    const panorama = new google.maps.StreetViewPanorama(streetViewContainer, {
      position: streetViewPosition,
      ...streetViewOptions,
    });

    streetViewRef.current = panorama;

    return () => {
      streetViewRef.current = null;
    };
  }, [showStreetView, streetViewPosition, streetViewAvailable]);

  return (
    <div className={`relative w-full h-full min-h-[400px] rounded-xl overflow-hidden ${className}`}>
      {/* Street View Container - hidden when not active */}
      <div 
        id="street-view-container" 
        className={`absolute inset-0 z-10 ${showStreetView && streetViewAvailable ? 'block' : 'hidden'}`}
      />

      {/* Map Container - hidden when street view is active */}
      <div className={`absolute inset-0 ${showStreetView && streetViewAvailable ? 'hidden' : 'block'}`}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
        {/* Property markers */}
        {filteredFeatures.map((feature, index) => {
          const color = getValueColor(feature.properties.valor_m2_medio);
          const size = Math.min(30, Math.max(12, feature.properties.total_transacoes / 2));
          
          return (
            <Circle
              key={`${feature.properties.logradouro}-${index}`}
              center={{
                lat: feature.geometry.coordinates[1],
                lng: feature.geometry.coordinates[0],
              }}
              radius={size * 3}
              options={{
                fillColor: color,
                fillOpacity: 0.8,
                strokeColor: "#fff",
                strokeWeight: 2,
                clickable: true,
              }}
              onClick={() => handleMarkerClick(feature)}
            />
          );
        })}

        {/* Selected feature info window */}
        {selectedFeature && !showStreetView && (
          <InfoWindow
            position={{
              lat: selectedFeature.geometry.coordinates[1],
              lng: selectedFeature.geometry.coordinates[0],
            }}
            onCloseClick={() => setSelectedFeature(null)}
          >
            <div className="p-2 min-w-[200px]">
              <h4 className="font-bold text-sm text-[#0C2340] mb-1 leading-tight">
                {selectedFeature.properties.logradouro}
              </h4>
              <p className="text-xs text-gray-500 mb-2">{selectedFeature.properties.bairro}</p>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Valor médio/m²:</span>
                  <span className="font-bold text-sm text-[#D4AF37]">
                    R$ {selectedFeature.properties.valor_m2_medio.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Transações:</span>
                  <span className="font-medium text-sm">{selectedFeature.properties.total_transacoes}</span>
                </div>
                {selectedFeature.properties.tipologias.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Tipos:</span>
                    <span className="text-xs">{selectedFeature.properties.tipologias.join(", ")}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleStreetViewClick({
                    lat: selectedFeature.geometry.coordinates[1],
                    lng: selectedFeature.geometry.coordinates[0],
                  })}
                  className="flex-1 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Street View
                </button>
                <button
                  onClick={() => handleSelectAddress(
                    selectedFeature.properties.logradouro,
                    selectedFeature.properties.bairro
                  )}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  Avaliar
                </button>
              </div>
            </div>
          </InfoWindow>
        )}

        {/* Search marker */}
        {searchMarker && !showStreetView && (
          <>
            <Marker
              position={searchMarker.position}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: "#D4AF37",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 3,
              }}
              onClick={() => {}}
            />
            <InfoWindow
              position={searchMarker.position}
              onCloseClick={() => setSearchMarker(null)}
            >
              <div className="p-2">
                <h4 className="font-bold text-sm text-[#0C2340] mb-2">{searchMarker.logradouro}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStreetViewClick(searchMarker.position)}
                    className="flex-1 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Street View
                  </button>
                  <button
                    onClick={() => handleSelectAddress(searchMarker.logradouro, selectedBairro || "")}
                    className="flex-1 bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                  >
                    Avaliar
                  </button>
                </div>
              </div>
            </InfoWindow>
          </>
        )}

        {/* Address marker from form */}
        {addressMarker && !showStreetView && (
          <>
            <Marker
              position={addressMarker.position}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 14,
                fillColor: "#D4AF37",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 4,
              }}
              animation={google.maps.Animation.BOUNCE}
            />
            <InfoWindow position={addressMarker.position}>
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-[#D4AF37] w-2 h-2 rounded-full"></div>
                  <span className="text-xs font-semibold text-[#D4AF37]">Endereço do Formulário</span>
                </div>
                <h4 className="font-bold text-sm text-[#0C2340]">{addressMarker.logradouro}</h4>
                <p className="text-xs text-gray-500 mb-2">{selectedBairro}</p>
                <button
                  onClick={() => handleStreetViewClick(addressMarker.position)}
                  className="w-full bg-[#0C2340] hover:bg-[#0C2340]/90 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  Ver Street View
                </button>
              </div>
            </InfoWindow>
          </>
        )}


        {/* User location marker */}
        {userLocation && !showStreetView && (
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 3,
            }}
          />
        )}
      </GoogleMap>
      </div>

      {/* Street View overlay controls */}
      {showStreetView && streetViewAvailable && (
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
          <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#0C2340]" />
            <span className="text-sm font-medium text-[#0C2340]">Street View</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={closeStreetView}
            className="bg-white shadow-lg hover:bg-gray-50"
          >
            <MapIcon className="h-4 w-4 mr-2" />
            Voltar ao Mapa
          </Button>
        </div>
      )}

      {/* Street View not available message */}
      {showStreetView && !streetViewAvailable && (
        <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-xl text-center max-w-sm mx-4">
            <X className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-semibold text-[#0C2340] mb-2">Street View indisponível</h4>
            <p className="text-sm text-muted-foreground">
              Não há imagens de Street View disponíveis para este local.
            </p>
          </div>
        </div>
      )}

      {/* Search box - hidden when street view is active */}
      {!showStreetView && (
        <div className="absolute top-3 left-3 right-14 z-10">
          <MapSearchBox 
            bairro={selectedBairro} 
            onSelect={handleSearchSelect}
          />
        </div>
      )}

      {/* Controls - hidden when street view is active */}
      {!showStreetView && (
        <div className="absolute top-16 right-3 z-10 flex flex-col gap-2">
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
      )}

      {/* Legend with filters - hidden when street view is active */}
      {!showStreetView && (
        <div className="absolute bottom-3 left-3 z-10">
          <MapLegend 
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-white/70 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            <span className="text-sm text-muted-foreground">Carregando dados do mapa...</span>
          </div>
        </div>
      )}

      {/* No bairro selected */}
      {!selectedBairro && !isLoading && !showStreetView && (
        <div className="absolute inset-0 z-20 bg-gray-50/90 flex items-center justify-center">
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
        <div className="absolute bottom-16 left-3 right-3 z-20">
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm p-3 rounded-lg">
            Erro ao carregar dados do mapa
          </div>
        </div>
      )}

      {/* Metadata info - hidden when street view is active */}
      {geoData?.metadata && !showStreetView && (
        <div className="absolute bottom-3 right-3 z-10">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow text-xs text-muted-foreground">
            {filteredFeatures.length} pontos
            {geoData.metadata.pending_geocode > 0 && ` • ${geoData.metadata.pending_geocode} pendentes`}
          </div>
        </div>
      )}
    </div>
  );
});
