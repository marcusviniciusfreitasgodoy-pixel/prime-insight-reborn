## Problema

No formulário público de avaliação (`QuickValuationForm.tsx`), na etapa 4 ("Seus Dados"), os botões "Voltar" e "Ver Análise Agora" ficam lado a lado em `flex gap-3` com `flex-1` cada. No viewport mobile (390px), o texto "Ver Análise Agora" + ícone não cabe na metade disponível, fazendo o botão estourar visualmente para fora da caixa do card.

## Solução

Empilhar os botões verticalmente em telas pequenas e mantê-los lado a lado em telas maiores (sm+). Ajustar também a ordem visual para que o CTA principal ("Ver Análise Agora") apareça em cima no mobile.

### Alteração em `src/components/leads/QuickValuationForm.tsx` (linhas ~782-810)

1. Trocar o container de `flex gap-3` para `flex flex-col-reverse sm:flex-row gap-3`
   - `flex-col-reverse` no mobile: CTA principal fica em cima, Voltar embaixo
   - `sm:flex-row` no desktop: layout original lado a lado preservado
2. Reduzir padding horizontal do botão de submit no mobile via `px-3 sm:px-8` para garantir que o texto caiba mesmo em telas estreitas
3. Reduzir tamanho do texto/ícone no mobile (`text-sm sm:text-base`) para manter o CTA confortável

### Validação

- Testar no preview em viewport 390x844 (atual) — botão deve ficar dentro do card
- Testar em desktop (>=640px) — layout lado a lado preservado
- Verificar que o botão "Voltar" continua funcional e visível

## Arquivo modificado

- `src/components/leads/QuickValuationForm.tsx` (apenas o bloco de Navigation Buttons)
