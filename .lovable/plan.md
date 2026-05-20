# Atualizar conexão da página de Leads com o CRM

## Objetivo
Atualizar o endpoint e a chave de API usados pela integração já existente (`forward-lead-crm`) para apontar para o novo webhook do CRM informado pelo usuário, e garantir que a página `/admin/leads` (e os formulários públicos) continuem enviando os leads corretamente.

- Novo endpoint: `https://crm-b2b-interface-clone-9bbb1.shrd00.internal.goskip.dev/backend/v1/webhook_external`
- Nova API Key (header `X-API-Key`): `sk_7b2b7addf0a1596dfae7fe4127fcc4ac0edaa1d315c51b2b`

Observação: já existe a edge function `forward-lead-crm` + secrets `CRM_WEBHOOK_URL` e `CRM_WEBHOOK_API_KEY`. Só precisamos atualizar valores e fazer pequenos ajustes — nada de criar infra nova.

## Mudanças

1. **Atualizar secrets do backend** (via tool de secrets, sem hardcode no código):
   - `CRM_WEBHOOK_URL` → novo endpoint `…/webhook_external`
   - `CRM_WEBHOOK_API_KEY` → `sk_7b2b7addf0a1596dfae7fe4127fcc4ac0edaa1d315c51b2b`

2. **Adicionar reenvio manual a partir da página `/admin/leads`** (novo):
   - Botão "Reenviar ao CRM" em cada linha/detalhe do lead em `src/pages/Leads.tsx` / `LeadDetailDialog.tsx`, que chama `forward-lead-crm` com o payload do lead salvo no banco.
   - Útil para reprocessar leads antigos ou testar a conexão sem precisar refazer o formulário.

3. **Testar a integração**:
   - Deploy da edge function `forward-lead-crm` (não muda código, mas garante que pegue os novos secrets).
   - Chamar a função com um payload de teste e checar logs (`supabase--edge_function_logs`) confirmando HTTP 2xx do CRM.

## O que NÃO muda
- Código da função `forward-lead-crm` (já lê URL/API key de env vars).
- Helper `src/lib/crmWebhook.ts` e as chamadas existentes em `QuickValuationForm`, `LeadCaptureForm`, `ThankYouStep`, `RealCaseComparison`, `PeritEvaluationSection`, `AvaliacaoPublica`.
- Schema do banco — leads continuam salvos em `public.leads`.

## Detalhes técnicos
- A função já envia `X-API-Key` quando `CRM_WEBHOOK_API_KEY` está definido — basta atualizar o secret.
- O endpoint é interno (`*.internal.goskip.dev`); se o CRM bloquear chamadas externas, vamos ver erro de DNS/timeout nos logs e o usuário precisará liberar acesso.
- O botão de reenvio manual usa o mesmo `supabase.functions.invoke("forward-lead-crm", ...)` já configurado.

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
