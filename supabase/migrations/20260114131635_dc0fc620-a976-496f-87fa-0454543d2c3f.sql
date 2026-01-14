-- =====================================================
-- MIGRATION: Proteger tabela itbi_transactions com view agregada
-- =====================================================

-- 1. Criar view pública com dados AGREGADOS por logradouro
-- Esta view expõe apenas estatísticas, não transações individuais
CREATE OR REPLACE VIEW public.itbi_stats_public
WITH (security_invoker = on) AS
SELECT 
  bairro,
  logradouro,
  uso,
  COUNT(*) as total_transacoes,
  ROUND(AVG(valor_m2)::numeric, 2) as preco_medio_m2,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY valor_m2)::numeric, 2) as mediana_m2,
  ROUND(MIN(valor_m2)::numeric, 2) as preco_min_m2,
  ROUND(MAX(valor_m2)::numeric, 2) as preco_max_m2,
  MIN(data_transacao) as primeira_transacao,
  MAX(data_transacao) as ultima_transacao,
  ROUND(AVG(area_m2)::numeric, 2) as area_media_m2
FROM public.itbi_transactions
WHERE 
  valor_m2 IS NOT NULL 
  AND valor_m2 > 0
  AND percentual_transferido >= 90
  AND data_transacao >= '2020-01-01'
GROUP BY bairro, logradouro, uso
HAVING COUNT(*) >= 3;  -- Mínimo 3 transações para anonimização

-- 2. Criar view para estatísticas por bairro (mais agregada)
CREATE OR REPLACE VIEW public.itbi_stats_bairro
WITH (security_invoker = on) AS
SELECT 
  bairro,
  uso,
  COUNT(*) as total_transacoes,
  ROUND(AVG(valor_m2)::numeric, 2) as preco_medio_m2,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY valor_m2)::numeric, 2) as mediana_m2,
  ROUND(PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY valor_m2)::numeric, 2) as preco_p10_m2,
  ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY valor_m2)::numeric, 2) as preco_p90_m2,
  MIN(data_transacao) as primeira_transacao,
  MAX(data_transacao) as ultima_transacao,
  ROUND(AVG(area_m2)::numeric, 2) as area_media_m2
FROM public.itbi_transactions
WHERE 
  valor_m2 IS NOT NULL 
  AND valor_m2 > 0
  AND percentual_transferido >= 90
GROUP BY bairro, uso;

-- 3. Remover políticas de SELECT público da tabela base
DROP POLICY IF EXISTS "Acesso público para visualização de transações ITBI" ON public.itbi_transactions;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar transações" ON public.itbi_transactions;

-- 4. Criar política restritiva: apenas admins podem ver dados individuais
CREATE POLICY "Apenas admins podem visualizar transações individuais"
ON public.itbi_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Manter política para o service_role (edge functions)
-- O service_role já tem acesso total, mas vamos documentar
COMMENT ON TABLE public.itbi_transactions IS 'Transações ITBI - Acesso restrito a admins. Use itbi_stats_public para dados públicos agregados.';

-- 6. Comentários nas views para documentação
COMMENT ON VIEW public.itbi_stats_public IS 'Estatísticas públicas agregadas de ITBI por logradouro. Mínimo 3 transações para anonimização.';
COMMENT ON VIEW public.itbi_stats_bairro IS 'Estatísticas públicas agregadas de ITBI por bairro.';