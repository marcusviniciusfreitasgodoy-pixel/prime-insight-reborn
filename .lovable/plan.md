# Atualizar base ITBI até maio/2026 + rotina mensal

## Situação atual
- Última transação na base: **15/nov/2025** (33.520 registros).
- Existem duas funções:
  - `sync-itbi-prefeitura` — sync amplo por período, exige login admin.
  - `sync-itbi-daily` — pega apenas mês corrente e anterior, usa `CRON_SECRET`.
- Não há nenhum `cron.schedule` ativo para ITBI.

## O que será feito

### 1. Backfill imediato (dez/2025 → mai/2026)
Disparar `sync-itbi-prefeitura` com `{ clearExisting: true, minYear: 2025, maxYear: 2026 }`.
- Apaga apenas o período 2025–2026 e reinsere completo, evitando duplicatas e capturando registros que entraram com atraso.
- Mantém intactos os 6 anos anteriores (2020–2024).

### 2. Ajustar rotina mensal
Trocar a janela do `sync-itbi-daily` (hoje pega só 1–2 meses) por uma janela de **últimos 3 meses**, e renomear logicamente para uso mensal. Manter `CRON_SECRET`.
- Lookback de 3 meses cobre atrasos cartoriais sem reinserir tudo.
- Antes de inserir, deleta o período-alvo (últimos 3 meses) para evitar duplicatas — mesma estratégia do sync amplo.

### 3. Agendar execução mensal via pg_cron
- Habilitar `pg_cron` e `pg_net` (se ainda não estiverem).
- Agendar `sync-itbi-daily` no **dia 5 de cada mês, 03:00 BRT** (08:00 UTC).
  - Dia 5 garante que o cartório já consolidou o mês anterior.
- Header `x-cron-secret` injetado a partir do secret existente.

## Detalhes técnicos

- Edição em `supabase/functions/sync-itbi-daily/index.ts`:
  - Calcular `startDate = hoje - 3 meses` (primeiro dia do mês).
  - Filtrar `recentRecords` por `ano/mes >= startDate`.
  - Antes do insert, executar `delete().gte('data_transacao', startDate)`.
- Cron via `supabase--insert` (não migration, pois contém project ref e anon key):
  ```sql
  select cron.schedule(
    'sync-itbi-monthly',
    '0 8 5 * *',
    $$ select net.http_post(
        url := 'https://hmnyizoihyaqtxnlutvg.supabase.co/functions/v1/sync-itbi-daily',
        headers := jsonb_build_object('x-cron-secret', '<CRON_SECRET>', 'Content-Type','application/json'),
        body := '{}'::jsonb
    ); $$
  );
  ```

## Validação
- Após backfill: `SELECT MAX(data_transacao), COUNT(*) FROM itbi_transactions;` deve mostrar maio/2026.
- Conferir entrada agendada em `cron.job`.
- Inspecionar logs da edge function no próximo dia 5.
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
