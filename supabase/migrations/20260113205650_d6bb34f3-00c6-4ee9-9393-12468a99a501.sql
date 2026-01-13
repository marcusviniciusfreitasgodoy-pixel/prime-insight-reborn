-- Ensure RLS is enabled on leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (prevents service role bypassing RLS unintentionally)
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;

-- Verify existing SELECT policies are restrictive
-- Drop any potentially problematic policies and recreate clean ones

-- Drop existing SELECT policies to recreate them cleanly
DROP POLICY IF EXISTS "Admins podem visualizar todos os leads" ON public.leads;

-- Create explicit SELECT policy that ONLY allows admins
CREATE POLICY "Apenas admins podem visualizar leads" 
ON public.leads 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Note: The existing "Admins podem gerenciar leads" policy covers ALL operations for admins
-- but having an explicit SELECT policy makes the security intent clearer