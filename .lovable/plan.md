

# Melhorar a Geocodificação da Base de Dados

## Situação Atual
- 116 logradouros geocodificados (todos na Barra da Tijuca)
- 3.036 logradouros únicos na base ITBI em 146 bairros
- Cobertura de apenas 3,8% do total
- Geocodificação acontece apenas sob demanda (quando usuário busca)
- Nomes abreviados do ITBI (AVN, PRC, ETR) frequentemente falham na API da Prefeitura

## Estratégia Proposta: Batch Geocoding via Edge Function

### 1. Criar Edge Function `batch-geocode-streets`

Uma função que percorre todos os logradouros únicos da tabela `itbi_transactions` que ainda não estão na `logradouros_geocoded` e tenta geocodificá-los em lote.

**Fluxo:**
1. Consultar logradouros distintos do ITBI que não existem na tabela de cache
2. Para cada logradouro, expandir abreviações (AVN -> AVENIDA, PRC -> PRAÇA, etc.) usando a mesma lógica já existente em `search-logradouros-prefeitura`
3. Consultar a API da Prefeitura com o nome expandido
4. Se encontrar, salvar coordenadas na `logradouros_geocoded`
5. Se não encontrar na Prefeitura, tentar Google Geocoding API como fallback
6. Processar em lotes de 20-50 ruas por execução (para respeitar limites de tempo e rate limits)

### 2. Melhorar a normalização de nomes no `geocode-logradouro`

A edge function atual busca o nome exato na API da Prefeitura, mas os nomes do ITBI usam abreviações diferentes. Adicionar a mesma lógica de `expandAbbreviations` do `search-logradouros-prefeitura` na função `geocode-logradouro` para aumentar a taxa de acerto.

Exemplo: "AVN GAL OLYNTHO PILLAR" -> buscar por "AVENIDA GENERAL OLYNTHO PILLAR"

### 3. Agendar execução via CRON

Usar `pg_cron` para executar a função `batch-geocode-streets` diariamente (ex: 3h da manhã), preenchendo gradualmente a base. Em ~60 dias, com 50 ruas/dia, toda a base estaria geocodificada.

### 4. Adicionar fallback Google Geocoder na edge function existente

Quando a API da Prefeitura não retornar resultados, usar a Google Geocoding API (chave `GOOGLE_MAPS_API_KEY` já configurada nos secrets) como segunda tentativa antes de retornar 404.

## Detalhes Técnicos

### Arquivos a criar:
- `supabase/functions/batch-geocode-streets/index.ts` -- nova edge function para geocodificação em lote

### Arquivos a modificar:
- `supabase/functions/geocode-logradouro/index.ts` -- adicionar expansão de abreviações e fallback com Google Geocoder

### Estimativa de impacto:
- Cobertura esperada após batch: de 3,8% para 80-90% (API da Prefeitura cobre a maioria dos logradouros do Rio)
- Com fallback Google: cobertura próxima de 95-100%
- Custo Google Geocoding: ~US$ 5/1000 requisições (só usado como fallback)

### Sequência de implementação:
1. Adicionar expansão de abreviações + fallback Google na `geocode-logradouro` (melhoria imediata)
2. Criar `batch-geocode-streets` com processamento em lotes
3. Configurar CRON para execução diária
