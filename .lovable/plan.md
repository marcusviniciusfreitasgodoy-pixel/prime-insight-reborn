

# Incluir Média de Transações por Ano no Diagnóstico de Liquidez

## Objetivo
Adicionar a média de transações por ano como informação contextual no diagnóstico de liquidez, permitindo ao usuário avaliar a robustez estatística dos dados apresentados.

## Abordagem
Inserir a média de transações/ano como frase complementar ao final de cada mensagem de liquidez, com qualificação textual (alto, moderado, baixo volume).

### Mudanças no arquivo `src/hooks/useHistoricalAnalysis.ts`

Na função `generateDiagnosis`, após construir a string `liquidity` em cada bloco condicional, adicionar uma frase final com o volume médio e sua qualificação:

```
// Após o bloco de liquidez (depois da linha 139)
const volumeLabel = avgTransactionsPerYear >= 50 
  ? 'alto volume' 
  : avgTransactionsPerYear >= 20 
    ? 'volume moderado' 
    : 'volume limitado';

liquidity += ` Média de ${Math.round(avgTransactionsPerYear)} transações/ano na região (${volumeLabel}).`;
```

**Faixas de qualificação:**
- 50+ transações/ano: "alto volume" -- dados robustos
- 20-49 transações/ano: "volume moderado" -- dados razoáveis
- Menos de 20 transações/ano: "volume limitado" -- dados limitados, cautela na interpretação

### Exemplos de resultado final

- **Alto volume**: "...indicando maior demanda e facilidade de venda. Média de 85 transações/ano na região (alto volume)."
- **Volume moderado**: "...mantendo liquidez consistente ao longo dos anos. Média de 32 transações/ano na região (volume moderado)."
- **Volume limitado**: "...indicando menor liquidez. Recomenda-se precificação competitiva. Média de 8 transações/ano na região (volume limitado)."

### Detalhes Técnicos
- Adicionar 5 linhas de código após a linha 139 (fechamento do bloco else de liquidez), antes do bloco de preço
- Nenhuma alteração no frontend -- a string de liquidez já é renderizada diretamente no `HistoricalAnalysisChart.tsx`
- O alerta de volume baixo no `overall` (linha 178) permanece como está, pois serve propósito diferente (alerta visual no diagnóstico geral)

