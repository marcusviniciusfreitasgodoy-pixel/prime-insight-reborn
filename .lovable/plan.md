
# Corrigir Street View para Direcionar ao Endereço do Formulário

## Problema
O Street View está mostrando um ponto central da Barra da Tijuca em vez do endereço informado no formulário. Isso acontece porque:

1. A busca no banco de dados (`logradouros_geocoded`) tem apenas 116 endereços geocodificados para toda a Barra, e frequentemente nao encontra o logradouro do formulario
2. Quando nao encontra, o mapa fica centralizado no `DEFAULT_CENTER` (coordenada generica da Barra)
3. O Street View so abre manualmente via clique, e quando o geocoding falha, usa coordenadas imprecisas dos clusters

## Solucao

### 1. Adicionar fallback com Google Geocoding API (`src/components/map/PropertyMap.tsx`)

No `useEffect` que geocodifica o `selectedLogradouro` (linhas 124-157), adicionar um fallback: quando a busca no banco falhar, usar o `google.maps.Geocoder` para geocodificar o endereco dinamicamente.

```typescript
// Dentro do useEffect de selectedLogradouro
const searchAddress = async () => {
  try {
    // Tentativa 1: buscar no banco
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
        mapRef.current.setZoom(16);
      }
      // Auto-abrir Street View no endereco encontrado
      openStreetView(position);
      return;
    }
  } catch (error) {
    console.log("Address not found in geocoded data, trying Google Geocoder");
  }

  // Tentativa 2: fallback com Google Geocoder
  try {
    const geocoder = new google.maps.Geocoder();
    const searchQuery = `${selectedLogradouro}, ${selectedBairro}, Rio de Janeiro, RJ, Brasil`;
    const result = await geocoder.geocode({ address: searchQuery });
    
    if (result.results?.[0]?.geometry?.location) {
      const loc = result.results[0].geometry.location;
      const position = { lat: loc.lat(), lng: loc.lng() };
      setAddressMarker({ position, logradouro: selectedLogradouro });
      if (mapRef.current) {
        mapRef.current.panTo(position);
        mapRef.current.setZoom(16);
      }
      // Auto-abrir Street View no endereco encontrado
      openStreetView(position);
    }
  } catch (error) {
    console.log("Google Geocoder also failed:", error);
  }
};
```

### 2. Auto-abrir Street View quando o endereco e encontrado

Apos geocodificar com sucesso (seja pelo banco ou pelo Google Geocoder), chamar automaticamente `openStreetView(position)` para que o usuario ja veja o Street View direcionado ao endereco correto, sem precisar clicar manualmente.

### 3. Aumentar zoom ao encontrar o endereco

Alterar o zoom de 15 para 16 quando o endereco e encontrado, para uma visualizacao mais proxima.

## Detalhes Tecnicos

- **Arquivo modificado**: `src/components/map/PropertyMap.tsx` (linhas 124-157)
- O `openStreetView` ja esta definido como `useCallback` e busca o panorama mais proximo num raio de 100m
- O Google Geocoder ja esta disponivel via `@react-google-maps/api` (carregado pelo `useJsApiLoader`)
- Nenhuma dependencia nova necessaria
- A dependencia do `useEffect` precisa incluir `openStreetView` para evitar stale closures
