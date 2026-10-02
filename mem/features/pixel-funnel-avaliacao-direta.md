---
name: Funil de Pixel Meta (/avaliacao-direta)
description: Eventos R8 do funil disparam via trackSingleCustom apenas no pixel 1306687940478470; Lead via trackSingle em ambos; guard once-per-page-load
type: feature
---
Instrumentação do funil em `/avaliacao-direta` (`src/lib/metaPixel.ts` + `ValuationWizard.tsx`):

- Eventos de etapa (`Passo1_Objetivo`, `Passo2_Tipo`, `Passo3_Dados`, `Resultado_Visto`) são disparados via `fbq('trackSingleCustom', '1306687940478470', ...)` — SOMENTE no pixel secundário. Função: `trackFunnelStep`.
- `Lead` (padrão) via `trackLead`: `trackSingle` no pixel 858164903276236 e `trackSingle` no 1306687940478470 (com `content_name: "AvaliacaoConcluida"`). Dispara apenas no submit efetivo que grava o lead. Lead de retorno (lead já existente) usa `ReturningLeadEvaluation`, nunca Lead duplicado.
- Guard: `firedFunnelSteps` (useRef Set) em `ValuationWizard.tsx` — cada evento dispara UMA vez por carregamento da página, mesmo com volta/retorno de etapa ou re-render.
- `perfil=vendedor` (R2) pula o passo de objetivo: `Passo1_Objetivo` NUNCA dispara nessa variação; os demais eventos seguem normais.
- `Resultado_Visto` dispara na exibição do resultado, nunca no load. PageView do GTM não foi alterado.
- Toda chamada protegida por `typeof window.fbq === 'function'` (`safeFbq`).
- Observação: chamadas `fbq('track','Lead')` avulsas observadas nos testes vêm de tags do container GTM (GTM-WC8JWRR4), não do código do site — revisar triggers no GTM se o Lead inflar.
