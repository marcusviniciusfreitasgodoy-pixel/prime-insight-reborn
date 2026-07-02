
## Escopo

Apenas correções de texto, rótulos e renderização nos componentes das duas telas gratuitas. Nenhuma mudança de estrutura, arquitetura, layout, paleta, fontes, border-radius ou de seções de venda.

Arquivos afetados:

- `src/components/leads/wizard/StepResultCapture.tsx` (Tela 1)
- `src/components/leads/QuickValuationResult.tsx` (Tela 2, FAQ e CTA final)
- `src/components/leads/PeritEvaluationSection.tsx` (bloco de venda dentro da Tela 2)
- `src/components/leads/ComparisonTable.tsx` (tabela Sozinho vs Com Parecer)
- `src/config/contact.ts` (chave `laudoCompletoDireto` e texto WhatsApp)

Fora do escopo: `src/utils/*pdfExport*`, `src/pages/AvaliacaoPublica.tsx` (seções de venda mantidas), edge functions, `src/integrations/**`.

## Correções

**1. Remover "laudo" das telas gratuitas**

- `StepResultCapture.tsx`:
  - Título "Receba seu laudo completo agora" → "Receba sua análise preliminar completa".
  - Subtítulo "Você verá o laudo completo na tela e a mesma análise chega no seu e-mail e WhatsApp." → "Você verá a análise completa na tela e a mesma análise chega no seu e-mail e WhatsApp."
  - Botão "Receber laudo completo" → "Ver minha análise preliminar".
  - Microcopy "Usamos apenas para enviar o laudo..." → "Usamos apenas para enviar a análise...".
  - Comentário JSX interno atualizado.
- `QuickValuationResult.tsx`:
  - Título "Ficha do laudo" → "Ficha da análise preliminar" (comentário e h4).
  - PARECER_FAQ: reescrever cada resposta que hoje usa "laudo/laudos" trocando por "Parecer Godoy Prime", "documento" ou "análise", conforme o contexto (mantendo o sentido).
  - Pergunta "Posso ver exemplos de laudos anteriores?" → "Posso ver exemplos de Pareceres anteriores?" com resposta reescrita sem a palavra.
- `PeritEvaluationSection.tsx`:
  - Frase "Habilitado judicialmente para emitir laudos com validade legal..." → "Habilitado judicialmente para emitir Pareceres com validade legal...".
  - Rodapé "Quando os primeiros laudos forem entregues..." → "Quando os primeiros Pareceres forem entregues...".
- `contact.ts`:
  - Renomear a chave `laudoCompletoDireto` para `analisePreliminarDireto` e atualizar o texto da mensagem WhatsApp para "Quero receber a análise preliminar completa do especialista por aqui." Atualizar o import em `StepResultCapture.tsx`.
  - Comentários internos atualizados.
- Também remover "laudo" de mensagens de toast em `ValuationWizard.tsx` ("laudo automático" → "análise automática").

**2. Ficha do gratuito sem selo ABNT**

- `QuickValuationResult.tsx`, bloco da ficha: remover a linha "Base ABNT NBR 14.653: Sim" e substituir por "Base de dados: transações reais e oficiais registradas". A menção ABNT permanece somente no PARECER_FAQ (seção de venda do Parecer).

**3. Corrigir rótulo do spread**

- `QuickValuationResult.tsx`, dentro da ficha, linha "Margem de negociação ~X%":
  - Rótulo → "Amplitude da faixa (spread)".
  - Valor → `{Math.round(spreadPercent)}%` (sem "~").
  - Adicionar micro-legenda logo abaixo: "Indica a incerteza da estimativa online, não um desconto disponível. Uma análise presencial estreita essa faixa."

**4. Claim de economia como potencial**

- `PeritEvaluationSection.tsx` (bloco Investimento): rótulo "Economia Média" → "Potencial de economia". Valor "R$ 180-450 mil" mantido.
- `QuickValuationResult.tsx` (CTA final): "Mais de R$ 180-450 mil em economia média por imóvel analisado" → "Potencial de economia de R$ 180-450 mil por imóvel analisado".

**5. Régua única de economia/prejuízo**

- `ComparisonTable.tsx`: linha "Risco de prejuízo / R$ 100-300 mil" → "Potencial de economia / R$ 180-450 mil" com o lado "Com Parecer" ajustado para "Capturado com análise profissional". (Faixa 8-15% do Prime Buyer Experience permanece intocada em `PeritEvaluationSection.tsx`.)

**6. Prazo 7 dias úteis**

- `PeritEvaluationSection.tsx`: "no prazo de 5 dias úteis por falha operacional" → "no prazo de 7 dias úteis após a vistoria por falha operacional".
- `QuickValuationResult.tsx` PARECER_FAQ: substituir todas as ocorrências de "5 dias úteis" por "7 dias úteis após a vistoria", inclusive na pergunta "Quanto tempo leva para receber...".

**7. Confiança reenquadrada**

- `QuickValuationResult.tsx`, barra de confiança da ficha: manter o valor calculado como número, e adicionar abaixo, sempre, o texto "Confiança preliminar. Sobe significativamente com a vistoria presencial do Parecer." O rótulo do topo passa de "Confiança da estimativa" para "Confiança preliminar", ficando "Confiança preliminar: X%" formatado como uma linha só quando renderizado, garantindo que o número nunca apareça isolado.

**8. Tabela comparativa sem células vazias**

- `ComparisonTable.tsx`: revisar `renderCell` e `renderInline` para garantir ícone renderizado em ambos os lados. As linhas booleanas hoje mostram X (Sozinho) e Check (Com Parecer), mas o usuário reporta células vazias. Ação:
  - Trocar cores hardcoded proibidas por tokens neutros (warm-gray para "Sozinho", gold para "Com Parecer") para atender à paleta.
  - Substituir emoji "⭐" do header por ícone lucide `ShieldCheck`.
  - Emoji "⚠️" da nota inferior removido (regra: sem emoji), mantendo o `AlertTriangle` já importado.
  - Adicionar fallback de renderização: quando `alone === false`, exibir `<X /> + "Não"` inline; quando `withParecer === true`, exibir `<Check /> + "Sim"` inline (tanto no card mobile quanto na tabela desktop), assegurando texto+ícone em toda célula.

**Higienização final (regras editoriais)**

Nos arquivos tocados acima, remover:

- Todos os travessões (— e –) em strings, substituindo por vírgula/ponto ou reescrevendo.
- Todos os emojis remanescentes (🚀, 🛡️, 🔒, ⚡, 📋, ⚠️, ✅, 📊, 🔍) das strings visíveis, substituídos por ícone lucide já disponível ou removidos.
- Ocorrências residuais de "cartórios" no PARECER_FAQ (trocar por "bancos e tribunais").
- Verificar zero ocorrências de "laudo", "cheque", "ITBI" (em texto visível) e "cartório" nos arquivos alterados.

## Verificação

Após aplicar, rodar `rg -n "laudo|cartório|cheque\\b|—|–|⚠|✅|🚀|🛡" src/components/leads src/components/leads/wizard src/config/contact.ts` e conferir saída vazia (ITBI permanece apenas em identificadores TS/estado, não em texto visível). Build automático valida imports após a renomeação em `contact.ts`.
