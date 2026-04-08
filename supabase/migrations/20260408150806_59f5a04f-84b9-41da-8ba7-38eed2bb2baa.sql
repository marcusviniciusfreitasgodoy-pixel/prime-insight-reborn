
-- 1. Add origin column to valuations
ALTER TABLE public.valuations 
ADD COLUMN origin varchar NOT NULL DEFAULT 'professional';

-- 2. Create materialized-style view with IQR outlier filtering (last 18 months)
CREATE OR REPLACE VIEW public.itbi_stats_recent AS
WITH base AS (
  SELECT 
    logradouro,
    bairro,
    uso,
    valor_m2
  FROM public.itbi_transactions
  WHERE percentual_transferido >= 90
    AND valor_m2 IS NOT NULL
    AND valor_m2 > 0
    AND data_transacao >= (CURRENT_DATE - interval '18 months')
),
quartiles AS (
  SELECT 
    logradouro,
    bairro,
    uso,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY valor_m2) AS q1,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY valor_m2) AS q3
  FROM base
  GROUP BY logradouro, bairro, uso
),
filtered AS (
  SELECT 
    b.logradouro,
    b.bairro,
    b.uso,
    b.valor_m2
  FROM base b
  JOIN quartiles q ON b.logradouro = q.logradouro AND b.bairro = q.bairro AND b.uso = q.uso
  WHERE b.valor_m2 >= q.q1 - 1.5 * (q.q3 - q.q1)
    AND b.valor_m2 <= q.q3 + 1.5 * (q.q3 - q.q1)
)
SELECT 
  logradouro,
  bairro,
  uso,
  COUNT(*) AS total_transacoes,
  PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY valor_m2) AS preco_min_m2,
  PERCENTILE_CONT(0.20) WITHIN GROUP (ORDER BY valor_m2) AS preco_p20_m2,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY valor_m2) AS preco_medio_m2,
  PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY valor_m2) AS preco_p80_m2,
  PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY valor_m2) AS preco_max_m2
FROM filtered
GROUP BY logradouro, bairro, uso;

-- 3. Create optimized function for evaluation with IQR filtering
CREATE OR REPLACE FUNCTION public.get_itbi_stats_filtered(
  p_bairro text, 
  p_logradouro text DEFAULT NULL, 
  p_uso text DEFAULT 'Residencial'
)
RETURNS TABLE(min_m2 numeric, med_m2 numeric, max_m2 numeric, transaction_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_logradouro IS NOT NULL AND length(trim(p_logradouro)) > 0 THEN
    -- Specific street: use P10/P90 from IQR-filtered data
    RETURN QUERY
    SELECT 
      s.preco_min_m2::numeric,
      s.preco_medio_m2::numeric,
      s.preco_max_m2::numeric,
      s.total_transacoes::bigint
    FROM public.itbi_stats_recent s
    WHERE s.bairro = upper(trim(p_bairro))
      AND s.logradouro ILIKE '%' || p_logradouro || '%'
      AND s.uso = p_uso::uso_imovel
    ORDER BY s.total_transacoes DESC
    LIMIT 1;
  END IF;

  -- If no street or no results, use neighborhood-wide with tighter spread (P20/P80)
  IF NOT FOUND OR p_logradouro IS NULL THEN
    RETURN QUERY
    SELECT 
      PERCENTILE_CONT(0.20) WITHIN GROUP (ORDER BY s.preco_medio_m2)::numeric as min_m2,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY s.preco_medio_m2)::numeric as med_m2,
      PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY s.preco_medio_m2)::numeric as max_m2,
      SUM(s.total_transacoes)::bigint as transaction_count
    FROM public.itbi_stats_recent s
    WHERE s.bairro = upper(trim(p_bairro))
      AND s.uso = p_uso::uso_imovel;
  END IF;
END;
$$;

-- 4. RLS: Allow anonymous inserts into valuations (public evaluations)
CREATE POLICY "Permitir avaliações públicas anônimas"
ON public.valuations
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL 
  AND origin = 'public'
  AND length(logradouro) > 0
  AND property_area_m2 > 0
);

-- 5. RLS: Allow admins to see ALL valuations (including public ones)
CREATE POLICY "Admins podem ver todas avaliações"
ON public.valuations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
