-- Fix RLS policies for leads table: drop old permissive policies and enforce rate limiting

-- Drop all old permissive policies that allow unrestricted INSERT
DROP POLICY IF EXISTS "Permitir cadastro público de leads" ON public.leads;
DROP POLICY IF EXISTS "Qualquer pessoa pode se cadastrar como lead" ON public.leads;
DROP POLICY IF EXISTS "Permitir cadastro público de leads com rate limit" ON public.leads;

-- Create new properly validated policy with actual rate limit enforcement
CREATE POLICY "Permitir cadastro público de leads com rate limit" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  -- Required fields validation
  length(trim(nome)) > 0 AND
  length(trim(email)) > 0 AND
  length(trim(telefone)) > 0 AND
  -- Email format validation
  email ~ '^[^@]+@[^@]+\.[^@]+$' AND
  -- Field length limits
  length(nome) <= 200 AND
  length(email) <= 255 AND
  length(telefone) <= 20 AND
  (bairro_interesse IS NULL OR length(bairro_interesse) <= 100) AND
  (diferenciais_imovel IS NULL OR length(diferenciais_imovel) <= 1000) AND
  (notas IS NULL OR length(notas) <= 2000) AND
  (endereco_imovel_analise IS NULL OR length(endereco_imovel_analise) <= 500) AND
  -- ENFORCE rate limiting - max 3 submissions per email per 5 minutes
  public.check_lead_rate_limit(email) = true
);