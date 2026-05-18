# Integração CRM Externo (Webhook)

## Objetivo
Encaminhar todos os leads gerados (formulários) e eventos de clique em CTAs de WhatsApp para o webhook do CRM:
`https://crm-b2b-interface-clone-9bbb1.shrd00.internal.goskip.dev/backend/v1/webhook-external`

## Arquitetura
Para evitar problemas de CORS e manter a URL configurável, o envio será feito via uma nova edge function `forward-lead-crm`, chamada do frontend após cada conversão/CTA.

```text
Frontend → supabase.functions.invoke('forward-lead-crm', { payload })
            └→ POST → webhook do CRM
```

A URL ficará em um secret `CRM_WEBHOOK_URL` (já com valor padrão), assim qualquer mudança futura não requer redeploy.

## O que será enviado

### 1. Leads de formulários (já existentes)
- `QuickValuationForm` (avaliação rápida pública) — após `insert` em `leads`
- `LeadCaptureForm` (formulário completo) — após `insert` em `leads`

Payload: `{ event: "lead_form", source, lead: { nome, email, telefone, bairro, interesse, objetivo, urgencia, area, tipologia, quartos, banheiros, suites, vagas, estimativaMin/Med/Max, enderecoImovelAnalise, valorPedidoVendedor, utm_* }, page, timestamp }`

### 2. Cliques em CTAs de WhatsApp
- Botão flutuante de WhatsApp em `AvaliacaoPublica`
- Botão "Tirar dúvida" no formulário
- Botões de WhatsApp em `ThankYouStep`, `RealCaseComparison`, `PeritEvaluationSection`

Payload: `{ event: "cta_click", source: "whatsapp_flutuante" | "whatsapp_duvida" | ..., page, utm_*, timestamp }`

## Implementação

1. **Nova edge function** `supabase/functions/forward-lead-crm/index.ts`
   - Recebe `{ event, payload }`
   - Faz `POST` ao `CRM_WEBHOOK_URL` com headers JSON
   - Retorna sucesso/erro sem bloquear o fluxo do usuário
   - `verify_jwt = false` (chamadas anônimas do site público)

2. **Secret** `CRM_WEBHOOK_URL` com a URL fornecida

3. **Helper frontend** `src/lib/crmWebhook.ts`
   - `sendLeadToCrm(payload)` e `sendCtaClickToCrm(source)`
   - Chamadas "fire and forget" (não bloqueiam UX, erros só em console)

4. **Integração nos pontos existentes**
   - `QuickValuationForm.tsx` → após insert lead bem-sucedido
   - `LeadCaptureForm.tsx` → após insert lead bem-sucedido
   - `AvaliacaoPublica.tsx` → onClick dos botões de WhatsApp/CTAs
   - `ThankYouStep.tsx`, `RealCaseComparison.tsx`, `PeritEvaluationSection.tsx` → onClick dos botões de WhatsApp

## Detalhes técnicos
- Edge function usa CORS padrão (origin `*`).
- Frontend não bloqueia espera da resposta — chamadas com `.catch(console.error)`.
- UTMs já capturadas via `useUTMTracking` serão incluídas automaticamente.
- Sem alteração no schema do banco — leads continuam salvos em `public.leads`; o webhook é apenas um espelho.
