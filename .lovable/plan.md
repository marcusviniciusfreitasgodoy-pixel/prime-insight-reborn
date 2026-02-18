

# Plano: Corrigir Todos os Findings de Nivel "warn"

## Resumo dos 7 Findings

| # | Finding | Risco | Acao |
|---|---------|-------|------|
| 1 | `analytics_public_insert` - INSERT sem validacao na tabela analytics_events | Poluicao de dados | Corrigir: adicionar validacao RLS |
| 2 | `google_maps_api_key` - Chave API exposta no cliente | Abuso de quota | Ignorar: chave projetada para uso client-side |
| 3 | `edge_functions_verify_jwt` - Edge Functions sem autenticacao | Acesso indevido | Corrigir: adicionar auth em 3 funcoes |
| 4 | `SUPA_extension_in_public` - Extensao pg_net no schema public | Configuracao | Ignorar: limitacao da plataforma |
| 5 | `SUPA_auth_leaked_password_protection` - Protecao contra senhas vazadas desabilitada | Senhas fracas | Corrigir: habilitar via configuracao |
| 6 | `valuations_user_data_exposure` - Dados de avaliacoes vinculados ao usuario | Enumeracao | Ignorar: RLS ja protege corretamente |
| 7 | `itbi_stats_views_unrestricted` - Views agregadas sem RLS | Dados publicos | Ignorar: dados agregados intencionalmente publicos |

---

## Detalhes Tecnicos

### 1. Corrigir: Validacao na tabela analytics_events (Migracao SQL)

A politica atual permite INSERT com `WITH CHECK (true)` sem nenhuma validacao. Vamos adicionar validacao de campos:

```sql
-- Remover politica atual
DROP POLICY "Permitir inserção pública de eventos" ON public.analytics_events;

-- Criar politica com validacao
CREATE POLICY "Permitir inserção pública de eventos validada"
ON public.analytics_events
FOR INSERT
WITH CHECK (
  length(event_type) <= 100 AND
  (bairro IS NULL OR length(bairro) <= 100) AND
  (metadata IS NULL OR (jsonb_typeof(metadata) = 'object' AND pg_column_size(metadata) < 5000))
);
```

### 2. Ignorar: Google Maps API Key (`google_maps_api_key`)

Chaves da Google Maps JavaScript API sao projetadas para uso no frontend. A protecao correta e configurar restricoes de dominio no Google Cloud Console (responsabilidade do administrador, nao do codigo). O `.env` ja esta no `.gitignore`.

### 3. Corrigir: Autenticacao em Edge Functions

**3a. `send-lead-notification`** - Chamada pelo frontend via `supabase.functions.invoke()` que inclui o anon key automaticamente. Adicionar validacao basica para garantir que veio via SDK:

```typescript
// Validar que a chamada veio via Supabase SDK (tem Authorization header)
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**3b. `geo-itbi-clusters`** - Mesma situacao, chamada pelo frontend via SDK. Adicionar mesma validacao.

**3c. `send-followup-email`** - Tem auth mas a validacao e fraca (`authHeader?.includes(cronSecret)`). Corrigir para usar validacao dedicada via header `x-cron-secret` (mesmo padrao do `sync-itbi-daily`):

```typescript
const cronSecret = req.headers.get('x-cron-secret');
const expectedSecret = Deno.env.get('CRON_SECRET');

if (!expectedSecret || cronSecret !== expectedSecret) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**3d. `search-logradouros-prefeitura`** - Funcao de busca publica chamada pelo frontend. Adicionar validacao de Authorization header.

### 4. Ignorar: Extension in Public (`SUPA_extension_in_public`)

Limitacao da plataforma Lovable Cloud. A extensao `pg_net` e instalada no schema `public` por padrao. Nao pode ser movida sem recriar o banco.

### 5. Corrigir: Leaked Password Protection (`SUPA_auth_leaked_password_protection`)

Habilitar protecao contra senhas vazadas usando a ferramenta de configuracao de autenticacao. Isso verifica se a senha do usuario aparece em bases de dados de senhas comprometidas (HaveIBeenPwned).

### 6. Ignorar: Valuations User Data (`valuations_user_data_exposure`)

As politicas RLS ja estao corretas:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

Nao ha risco de enumeracao pois todas as queries sao filtradas pelo `user_id` do usuario autenticado. UUIDs previnem adivinhacao.

### 7. Ignorar: Views Agregadas sem RLS (`itbi_stats_views_unrestricted`)

As views `itbi_stats_bairro`, `itbi_stats_public`, `view_ranking_microbairros` e `analytics_events_daily` contem apenas dados agregados de mercado (medias, medianas) sem informacoes pessoais. Sao intencionalmente publicas para o dashboard. As views usam `security_invoker=on` e os dados fonte (`itbi_transactions`) estao protegidos com RLS admin-only.

---

## Sequencia de Implementacao

1. Migracao SQL: atualizar politica RLS do `analytics_events`
2. Configurar auth: habilitar leaked password protection
3. Editar `send-lead-notification/index.ts`: adicionar validacao de Authorization header
4. Editar `geo-itbi-clusters/index.ts`: adicionar validacao de Authorization header
5. Editar `search-logradouros-prefeitura/index.ts`: adicionar validacao de Authorization header
6. Editar `send-followup-email/index.ts`: substituir auth fraca por validacao `x-cron-secret`
7. Atualizar findings no scan: marcar 4 como ignorados com justificativas

