

# Corrigir Diagnostico Contraditorio no Mercado Seletivo

## Problema Identificado

Quando o mercado e classificado como "SELETIVO" (transacoes em queda + precos em alta), o sistema gera mensagens contraditorias:

- **Liquidez**: "diminuiu X%... Recomenda-se precificacao competitiva" (sugere baixar preco)
- **Precos**: "valorizou X%... aquecimento do mercado" (precos subindo)

Recomendar "precificacao competitiva" (baixar preco) quando os precos estao subindo nao faz sentido. O cenario de mercado seletivo indica que compradores estao mais exigentes e pagam mais por imoveis diferenciados.

## Solucao

Modificar a funcao `generateDiagnosis` em `src/hooks/useHistoricalAnalysis.ts` para contextualizar as mensagens de liquidez e preco conforme a combinacao dos dois indicadores.

### Mudancas no arquivo `src/hooks/useHistoricalAnalysis.ts`

**Mensagem de liquidez quando transacoes caem MAS precos sobem** (mercado seletivo):
- De: "diminuiu X%... indicando menor liquidez. Recomenda-se precificacao competitiva."
- Para: "diminuiu X%... indicando mercado mais seletivo. Compradores exigentes estao pagando mais por imoveis diferenciados."

**Mensagem de preco quando precos sobem MAS transacoes caem** (mercado seletivo):
- De: "valorizou X%... refletindo aquecimento do mercado local."
- Para: "valorizou X%... mesmo com menor volume, os precos praticados sao mais altos, valorizando imoveis com diferenciais."

A funcao passara a receber ambas as tendencias como parametro para gerar mensagens combinadas coerentes, em vez de gerar cada mensagem isoladamente.

### Detalhes Tecnicos

Refatorar `generateDiagnosis` (linhas 110-155) para que as strings de `liquidity` e `price` levem em conta a combinacao das duas tendencias, nao apenas cada tendencia isolada. Isso afeta 4 combinacoes possiveis:

1. **up/up** (aquecido): mensagens atuais OK
2. **down/down** (desafiador): mensagens atuais OK
3. **up/down** (ajuste): mensagem de preco OK, liquidez OK
4. **down/up** (seletivo): **corrigir ambas as mensagens** para eliminar a contradicao

Nenhuma outra alteracao necessaria - os componentes que consomem esses dados (`HistoricalAnalysisChart.tsx`) exibem as strings diretamente.
