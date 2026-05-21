# Corrigir contagem de Leads no Meta Pixel

## Problema

O Gerenciador da Meta mostra 8 "Leads" mas só existe **1 lead real** na tabela `leads` (e 3 contatos vieram por clique direto no WhatsApp). A inflação acontece porque:

- O código **não dispara** `fbq('track','Lead')` em lugar nenhum.
- O `index.html` carrega o Pixel com **detecção automática de eventos ligada** (padrão da Meta). A plataforma observa cliques em botões e submits e classifica vários deles como `Lead` sem nosso controle.

Resultado: a métrica de Lead conta cliques em CTA, abandonos de form, cliques no WhatsApp já removido — qualquer coisa que o algoritmo "achar parecida" com lead.

## Solução

1. **Desligar a detecção automática** do Pixel.
2. **Disparar `Lead` explicitamente** apenas após insert bem-sucedido na tabela `leads` (formulários completos).
3. Deixar pronto um helper para, no futuro, marcar cliques em CTA como eventos **custom** (não como `Lead`).

## Mudanças

### 1. Novo arquivo `src/lib/metaPixel.ts`
Helper centralizado:
- `trackLead(params)` → `fbq('track','Lead', …)` — usar SÓ em conversão qualificada.
- `trackCtaClick(name, params)` → `fbq('trackCustom', …)` — para WhatsApp/Parecer/Calendly, sem inflar Lead.
- Tipos globais para `window.fbq` e try/catch defensivo.

### 2. `index.html` — desligar autoConfig
Antes do `fbq('init', …)` adicionar:
```js
fbq('set', 'autoConfig', 'false', '858164903276236');
```
Mantém `init` + `PageView` como hoje. Sem isso, qualquer melhoria abaixo continua sendo sobrescrita pela detecção automática.

### 3. Disparar `Lead` no submit real
- `src/components/leads/QuickValuationForm.tsx`: após `sendLeadToCrm(...)` chamar `trackLead({ content_name: 'quick_valuation_form', value: estimativa.med, currency: 'BRL' })`.
- `src/components/leads/LeadCaptureForm.tsx`: após `sendLeadToCrm(...)` chamar `trackLead({ content_name: 'lead_capture_form', value: valor, currency: 'BRL' })`.

## O que NÃO muda

- Nada na tabela `leads`, RLS, edge functions ou CRM webhook.
- `PageView` continua sendo disparado em todas as páginas.
- Sem novos secrets / variáveis de ambiente.

## Efeito esperado

- Painel de Leads do Meta passa a refletir **apenas formulários completos**, batendo com `/admin/leads`.
- Campanhas otimizadas para "Lead" passam a otimizar para conversão real, não para cliques aleatórios.
- Você poderá, num próximo passo, instrumentar cliques de contato como `ClickWhatsApp` / `ClickParecer` (eventos custom) para medir intenção sem poluir Lead.

## Observação

A detecção automática só pode ser totalmente desativada no painel do Pixel (Gerenciador de Eventos → Configurações → "Eventos detectados automaticamente"). O `fbq('set','autoConfig','false', …)` cobre o lado do código; recomendo também desligar lá no painel para garantir.
