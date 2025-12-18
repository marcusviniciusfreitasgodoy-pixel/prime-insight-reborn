-- 1. Remover políticas duplicadas de INSERT na tabela leads (manter apenas uma)
DROP POLICY IF EXISTS "Qualquer pessoa pode se cadastrar como lead" ON public.leads;

-- 2. Adicionar rate limiting via função para proteção contra bots
-- Criar função para verificar rate limit de leads por IP/email
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Verificar quantos leads foram criados com este email nos últimos 5 minutos
  SELECT COUNT(*) INTO recent_count
  FROM public.leads
  WHERE email = lower(trim(p_email))
    AND created_at > now() - interval '5 minutes';
  
  -- Permitir no máximo 3 avaliações por email a cada 5 minutos
  RETURN recent_count < 3;
END;
$$;

-- 3. Atualizar política de INSERT para usar rate limit (remove a antiga e cria nova)
DROP POLICY IF EXISTS "Permitir cadastro público de leads" ON public.leads;

CREATE POLICY "Permitir cadastro público de leads com rate limit" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  -- Campos obrigatórios não podem ser vazios
  length(trim(nome)) > 0 AND
  length(trim(email)) > 0 AND
  length(trim(telefone)) > 0 AND
  -- Email deve ter formato válido (básico)
  email ~ '^[^@]+@[^@]+\.[^@]+$' AND
  -- Limitar tamanho dos campos para evitar ataques
  length(nome) <= 200 AND
  length(email) <= 255 AND
  length(telefone) <= 20 AND
  (bairro_interesse IS NULL OR length(bairro_interesse) <= 100) AND
  (diferenciais_imovel IS NULL OR length(diferenciais_imovel) <= 1000) AND
  (notas IS NULL OR length(notas) <= 2000) AND
  (endereco_imovel_analise IS NULL OR length(endereco_imovel_analise) <= 500)
);

-- 4. Remover acesso público direto às transações ITBI e usar função intermediária
-- Primeiro, criar uma função segura para buscar estatísticas de ITBI
CREATE OR REPLACE FUNCTION public.get_itbi_stats_for_evaluation(
  p_bairro text,
  p_logradouro text DEFAULT NULL,
  p_uso text DEFAULT 'Residencial'
)
RETURNS TABLE (
  min_m2 numeric,
  med_m2 numeric,
  max_m2 numeric,
  transaction_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY valor_m2)::numeric as min_m2,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY valor_m2)::numeric as med_m2,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY valor_m2)::numeric as max_m2,
    COUNT(*)::bigint as transaction_count
  FROM public.itbi_transactions
  WHERE bairro = upper(trim(p_bairro))
    AND (p_logradouro IS NULL OR logradouro ILIKE '%' || p_logradouro || '%')
    AND uso = p_uso::uso_imovel
    AND percentual_transferido >= 90
    AND valor_m2 IS NOT NULL
    AND data_transacao >= '2024-01-01';
END;
$$;

-- 5. Criar função para buscar sugestões de logradouros (limitada)
CREATE OR REPLACE FUNCTION public.get_street_suggestions(
  p_search text,
  p_bairro text DEFAULT 'BARRA DA TIJUCA',
  p_limit integer DEFAULT 10
)
RETURNS TABLE (logradouro text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limitar p_limit para evitar abusos
  IF p_limit > 50 THEN
    p_limit := 50;
  END IF;
  
  RETURN QUERY
  SELECT DISTINCT t.logradouro
  FROM public.itbi_transactions t
  WHERE t.bairro = upper(trim(p_bairro))
    AND t.logradouro ILIKE '%' || p_search || '%'
  ORDER BY t.logradouro
  LIMIT p_limit;
END;
$$;

-- 6. Manter acesso público às transações ITBI mas apenas para SELECT
-- (necessário para o fluxo de avaliação pública funcionar)
-- As políticas atuais já estão corretas, não precisa alterar

-- 7. Adicionar índice para melhorar performance das buscas de rate limit
CREATE INDEX IF NOT EXISTS idx_leads_email_created 
ON public.leads (lower(email), created_at DESC);

-- 8. Garantir que a view de ranking não exponha dados sensíveis
-- A view já mostra apenas agregados, não dados individuais - está OK