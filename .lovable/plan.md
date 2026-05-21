# Restringir disparo do Pixel "Lead" ao botão "Ver Análise Agora"

## Situação atual
O evento padrão `Lead` do Meta Pixel é disparado em **dois pontos**:

1. `src/components/leads/QuickValuationForm.tsx` (linha 399) — submit do botão **"Ver Análise Agora"** (avaliação rápida pública).
2. `src/components/leads/LeadCaptureForm.tsx` (linha 292) — submit do formulário longo "Proteger Meu Patrimônio Antes de Assinar" (captura para Parecer Técnico).

Isso infla a métrica de Lead no Gerenciador de Anúncios, pois conta duas conversões para o mesmo usuário.

## Mudança proposta
Manter o `trackLead` **apenas** no submit do "Ver Análise Agora" (`QuickValuationForm.tsx`) e **substituir** o disparo no `LeadCaptureForm.tsx` por um evento custom (`trackCtaClick` ou `trackEvent`) chamado `LeadCaptureFormSubmitted` — assim continuamos com visibilidade no Pixel, mas sem somar ao Lead oficial.

## Arquivos alterados
- `src/components/leads/LeadCaptureForm.tsx` — trocar `trackLead({...})` por `trackEvent("LeadCaptureFormSubmitted", {...})` e remover o import de `trackLead`.

Nenhuma outra alteração (UI, backend, RLS, fluxo de lead) é necessária.

## Validação
- DevTools → Network → filtrar `facebook.com/tr`: confirmar que `ev=Lead` só aparece ao clicar **"Ver Análise Agora"**.
- Submit do formulário longo deve disparar `ev=LeadCaptureFormSubmitted` (custom), não `Lead`.
