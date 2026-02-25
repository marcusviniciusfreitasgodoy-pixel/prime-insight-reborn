

# Fix Security Scan Issues

## Issues to Fix

### 1. Recreate 3 views as SECURITY INVOKER (fixes 3 ERRORs + 3 WARNs)

The views `analytics_events_daily`, `view_ranking_microbairros`, and `itbi_stats_public` are currently `SECURITY DEFINER`, meaning they bypass RLS of the calling user. They also have no RLS policies.

**Fix:** Drop and recreate each view with `security_invoker = true`, then enable RLS on each and add explicit public SELECT policies (these views contain only aggregated, non-sensitive statistics intended for public consumption).

### 2. Add RLS policy to `itbi_stats_bairro` (fixes 1 WARN)

This table/view has no RLS policies. Add a public read policy since it contains only aggregated neighborhood statistics.

### 3. Enable leaked password protection (fixes 1 WARN)

Use the auth configuration tool to enable HIBP (Have I Been Pwned) leaked password checking.

### 4. Extension in public schema (no action)

This is a common warning about `pg_cron` or similar extensions. Moving extensions between schemas can break functionality and is low risk. Will be noted but not changed.

## Technical Details

### SQL Migration

```sql
-- 1. Recreate analytics_events_daily as SECURITY INVOKER
DROP VIEW IF EXISTS public.analytics_events_daily;
CREATE VIEW public.analytics_events_daily
WITH (security_invoker = true)
AS
SELECT
  date_trunc('day', created_at)::date AS dia,
  event_type,
  bairro,
  count(*) AS total
FROM public.analytics_events
GROUP BY (date_trunc('day', created_at)::date), event_type, bairro;

ALTER VIEW public.analytics_events_daily OWNER TO postgres;
GRANT SELECT ON public.analytics_events_daily TO anon, authenticated;

-- 2. Recreate view_ranking_microbairros as SECURITY INVOKER
DROP VIEW IF EXISTS public.view_ranking_microbairros;
CREATE VIEW public.view_ranking_microbairros
WITH (security_invoker = true)
AS
SELECT
  cm.microbairro,
  round(avg(it.valor_m2), 2) AS preco_medio_m2,
  count(*) AS total_transacoes,
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY it.valor_m2))::numeric, 2) AS mediana_m2,
  round(min(it.valor_m2), 2) AS preco_min_m2,
  round(max(it.valor_m2), 2) AS preco_max_m2
FROM public.itbi_transactions it
JOIN public.condominios_mapeamento cm
  ON it.logradouro = cm.logradouro_padrao
WHERE cm.microbairro IS NOT NULL
  AND it.valor_m2 IS NOT NULL
  AND it.valor_m2 > 0
GROUP BY cm.microbairro
HAVING count(*) >= 3;

ALTER VIEW public.view_ranking_microbairros OWNER TO postgres;
GRANT SELECT ON public.view_ranking_microbairros TO anon, authenticated;

-- 3. Recreate itbi_stats_public as SECURITY INVOKER
DROP VIEW IF EXISTS public.itbi_stats_public;
CREATE VIEW public.itbi_stats_public
WITH (security_invoker = true)
AS
SELECT
  bairro, logradouro, uso,
  count(*) AS total_transacoes,
  round(avg(valor_m2), 2) AS preco_medio_m2,
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY valor_m2))::numeric, 2) AS mediana_m2,
  round(min(valor_m2), 2) AS preco_min_m2,
  round(max(valor_m2), 2) AS preco_max_m2,
  min(data_transacao) AS primeira_transacao,
  max(data_transacao) AS ultima_transacao,
  round(avg(area_m2), 2) AS area_media_m2
FROM public.itbi_transactions
WHERE valor_m2 IS NOT NULL AND valor_m2 > 0
GROUP BY bairro, logradouro, uso;

ALTER VIEW public.itbi_stats_public OWNER TO postgres;
GRANT SELECT ON public.itbi_stats_public TO anon, authenticated;

-- 4. Handle itbi_stats_bairro (also a view - recreate as SECURITY INVOKER)
DROP VIEW IF EXISTS public.itbi_stats_bairro;
CREATE VIEW public.itbi_stats_bairro
WITH (security_invoker = true)
AS
SELECT
  bairro, uso,
  count(*) AS total_transacoes,
  round(avg(valor_m2), 2) AS preco_medio_m2,
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY valor_m2))::numeric, 2) AS mediana_m2,
  round((percentile_cont(0.1) WITHIN GROUP (ORDER BY valor_m2))::numeric, 2) AS preco_p10_m2,
  round((percentile_cont(0.9) WITHIN GROUP (ORDER BY valor_m2))::numeric, 2) AS preco_p90_m2,
  min(data_transacao) AS primeira_transacao,
  max(data_transacao) AS ultima_transacao,
  round(avg(area_m2), 2) AS area_media_m2
FROM public.itbi_transactions
WHERE valor_m2 IS NOT NULL AND valor_m2 > 0
GROUP BY bairro, uso;

ALTER VIEW public.itbi_stats_bairro OWNER TO postgres;
GRANT SELECT ON public.itbi_stats_bairro TO anon, authenticated;
```

Note: Since these views query `itbi_transactions` (which has RLS restricting SELECT to admins only), using `security_invoker` means anonymous/public users won't be able to read the views anymore. To maintain public access to aggregated stats, we need to either:
- Keep the views as `SECURITY DEFINER` but explicitly owned by postgres (acceptable since they only expose aggregated data), OR
- Create a dedicated RLS policy on `itbi_transactions` that allows SELECT for the specific aggregated columns

The safer approach is to keep these aggregated views as `SECURITY DEFINER` (since they intentionally expose only aggregated public statistics) but add explicit RLS policies on the views themselves to make the security posture explicit. However, views don't support RLS in PostgreSQL the same way tables do.

**Revised approach:** Since these are views over `itbi_transactions` (admin-only), changing to `SECURITY INVOKER` would break public access to aggregated stats. The correct fix is to keep them as `SECURITY DEFINER` (intentional design) and mark these findings as acknowledged/ignored with justification.

### Files modified
- One SQL migration for the leaked password protection or view adjustments
- Security findings updated to reflect acknowledged status

### Leaked password protection
- Enable via auth settings configuration tool

