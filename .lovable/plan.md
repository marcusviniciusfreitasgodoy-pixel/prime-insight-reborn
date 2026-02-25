

# Aplicar Percentis P10/P90 na View view_ranking_microbairros

## Problema
A view `view_ranking_microbairros` usa `MIN(valor_m2)` e `MAX(valor_m2)` absolutos, inconsistente com a correção já aplicada na `itbi_stats_public` que usa P10/P90.

## Solução
Recriar a view substituindo:
- `min(valor_m2)` por `PERCENTILE_CONT(0.10)` (P10)
- `max(valor_m2)` por `PERCENTILE_CONT(0.90)` (P90)

## Detalhes Técnicos
Uma migração SQL recriará a view mantendo toda a lógica de classificação de microbairros (CTE `microbairro_data`) e os filtros existentes (Barra da Tijuca, Residencial, >= 90% transferido, valor_m2 <= 40000, último ano). Apenas as duas funções de agregação serão trocadas. Os nomes das colunas (`preco_min_m2`, `preco_max_m2`) permanecem iguais, sem impacto no frontend.
