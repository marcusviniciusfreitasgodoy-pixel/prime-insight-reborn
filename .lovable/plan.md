

# Contextualizar Diagnostico do Mercado Estavel (Volume Estavel + Preco Estavel)

## Situacao Atual

Quando ambas as tendencias sao "stable", as mensagens atuais sao genericas e desconectadas:

- **Liquidez** (linha 133): "O volume de transacoes permanece estavel na regiao, mantendo liquidez consistente ao longo dos anos." -- OK, mas nao menciona a estabilidade de precos como fator positivo.
- **Preco** (linha 151): "Os precos por m2 mantiveram-se estaveis nos ultimos anos, indicando mercado equilibrado." -- OK, mas nao conecta com a liquidez estavel.
- **Overall** (linha 165): "MERCADO ESTAVEL: Condicoes normais de mercado. Precificacao adequada deve garantir venda em tempo razoavel." -- Razoavel, mas pode ser mais orientativo.

As mensagens nao sao contraditorias (como era o caso do Seletivo), mas podem ser enriquecidas para dar mais valor ao diagnostico, conectando volume e preco.

## Solucao

Adicionar flag `isStableMarket` e contextualizar as 3 mensagens para o cenario estavel+estavel.

### Mudancas no arquivo `src/hooks/useHistoricalAnalysis.ts`

1. Adicionar flag na linha 117:
   ```
   const isStableMarket = transactionTrend.direction === 'stable' && priceTrend.direction === 'stable';
   ```

2. **Mensagem de liquidez** (linha 133) -- quando volume estavel E preco estavel:
   - De: "O volume de transacoes permanece estavel na regiao, mantendo liquidez consistente ao longo dos anos."
   - Para: "O volume de transacoes permanece estavel na regiao. Combinado com precos tambem estaveis, indica um mercado previsivel e com boa absorpcao de imoveis bem precificados."

3. **Mensagem de preco** (linha 151) -- quando preco estavel E volume estavel:
   - De: "Os precos por m2 mantiveram-se estaveis nos ultimos anos, indicando mercado equilibrado."
   - Para: "Os precos por m2 mantiveram-se estaveis nos ultimos anos, acompanhando o volume consistente de transacoes. Mercado equilibrado favorece negociacoes com base em valor justo."

4. **Mensagem overall** (linha 165) -- ja esta razoavel, mas ajustar para ser mais orientativo:
   - De: "MERCADO ESTAVEL: Condicoes normais de mercado. Precificacao adequada deve garantir venda em tempo razoavel."
   - Para: "MERCADO ESTAVEL: Volume e precos consistentes indicam mercado maduro e previsivel. Precificacao adequada ao valor de mercado deve garantir venda em tempo razoavel."

### Detalhes Tecnicos

- Adicionar `const isStableMarket` junto com as outras flags (linha 117)
- Substituir o bloco `else` de liquidez (linha 132-134) por condicional: se `isStableMarket`, usar mensagem contextualizada; senao, manter a generica (para casos mistos como volume estavel + preco subindo)
- Substituir o bloco `else` de preco (linha 150-152) pela mesma logica condicional
- Atualizar a string do overall no bloco `else` final (linha 164-166)
- Nenhuma alteracao no frontend

