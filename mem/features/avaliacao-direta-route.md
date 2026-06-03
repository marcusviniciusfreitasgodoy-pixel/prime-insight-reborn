---
name: Avaliação Direta route
description: Rota /avaliacao-direta para leads quentes (Meta Form, indicações) — pula venda e leva direto ao formulário
type: feature
---
Rota: `/avaliacao-direta` (page: `src/pages/AvaliacaoDireta.tsx`, lazy-loaded em App.tsx).

Propósito: enviar a leads já aquecidos (ex.: vindos de formulário Meta, indicações, WhatsApp manual) onde a página completa de venda (`/avaliacao`) atrapalha a conversão.

Diferenças vs `/avaliacao`:
- Sem hero longo, problemas, soluções, personas, FAQ, comparações
- Header minimalista (logo + telefone) e rodapé curto
- 3 selos de confiança (ITBI / NBR 14653-2 / CRECI) acima do formulário
- Marca `noindex,nofollow` para não competir com a página pública no SEO
- Reaproveita `QuickValuationForm` e `QuickValuationResult` (mesmo backend, mesmas regras de rate limit)
- Lead é salvo com `origem = "avaliacao_direta"` (prop passada ao `QuickValuationForm`) — diferenciável no admin/Leads

Link padrão para WhatsApp:
`https://avaliacao.godoyprime.com.br/avaliacao-direta?utm_source=meta_lead&utm_medium=whatsapp&utm_campaign=form_meta`

NÃO usar para tráfego pago/SEO — para isso continue usando `/` e `/avaliacao`.
