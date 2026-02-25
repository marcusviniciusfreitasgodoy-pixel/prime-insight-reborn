
# Adicionar Média de Transações/Ano no Diagnóstico de Preço

## Objetivo
Replicar no diagnóstico de preço a mesma informação de volume médio já presente no diagnóstico de liquidez, reforçando a robustez dos dados em ambos os campos.

## Mudança

No arquivo `src/hooks/useHistoricalAnalysis.ts`, após o bloco de construção da string `price` (depois da linha 170), adicionar uma frase contextual que conecta o volume de dados à confiabilidade da análise de preço:

```typescript
// Após linha 170
price += avgTransactionsPerYear >= 50
  ? ` Base de análise: ${Math.round(avgTransactionsPerYear)} transações/ano (amostra robusta).`
  : avgTransactionsPerYear >= 20
    ? ` Base de análise: ${Math.round(avgTransactionsPerYear)} transações/ano (amostra moderada).`
    : ` Base de análise: ${Math.round(avgTransactionsPerYear)} transações/ano (amostra limitada — interpretar com cautela).`;
```

A frase usa "Base de análise" em vez de "Média de" para diferenciar do diagnóstico de liquidez e focar na confiabilidade estatística dos preços, não no volume de mercado.

## Detalhes Técnicos
- 1 inserção de ~4 linhas após a linha 170 no `generateDiagnosis`
- Reutiliza `avgTransactionsPerYear` já disponível como parâmetro da função
- Nenhuma alteração no frontend
