
# Contextualizar Diagnóstico do Mercado em Ajuste (Volume Up + Preço Down)

## Problema
No cenário "MERCADO EM AJUSTE", as mensagens de liquidez e preço são geradas isoladamente, sem refletir a relação entre elas:
- **Liquidez**: "aumentou X%... maior demanda e facilidade de venda" — não menciona que o volume cresce porque preços caíram
- **Preço**: "recuou X%... Considere este fator" — genérico, não conecta com o aumento de demanda

## Solução
Aplicar a mesma abordagem usada no Mercado Seletivo: detectar a combinação e gerar mensagens contextualizadas.

### Mudanças no arquivo `src/hooks/useHistoricalAnalysis.ts`

1. Adicionar flag `isAdjustmentMarket` (volume up + preço down), similar ao `isSelectiveMarket` já existente

2. **Mensagem de liquidez quando volume sobe MAS preço cai**:
   - De: "aumentou X%... indicando maior demanda e facilidade de venda."
   - Para: "aumentou X%... indicando que a correção de preços está atraindo mais compradores. O mercado está se ajustando a patamares mais acessíveis."

3. **Mensagem de preço quando preço cai MAS volume sobe**:
   - De: "recuou X%... Considere este fator na estratégia de precificação."
   - Para: "recuou X%... porém o aumento no volume de transações indica que há demanda ativa a preços mais competitivos. Precifique de acordo com o novo patamar do mercado."

### Detalhes Técnicos
- Adicionar `const isAdjustmentMarket = transactionTrend.direction === 'up' && priceTrend.direction === 'down';` na linha 116
- Adicionar condição `if (isAdjustmentMarket)` dentro do bloco de liquidez `direction === 'up'` (linha 119-120)
- Adicionar condição `if (isAdjustmentMarket)` dentro do bloco de preço `direction === 'down'` (linha 139-140)
- Nenhuma alteração no frontend — os componentes consomem as strings diretamente
