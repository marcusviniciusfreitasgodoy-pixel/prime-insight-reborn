
-- Drop the anon-only policy
DROP POLICY IF EXISTS "Permitir avaliações públicas anônimas" ON public.valuations;

-- Create policy that works for both anon and authenticated
CREATE POLICY "Permitir avaliações públicas"
ON public.valuations
FOR INSERT
TO public
WITH CHECK (
  user_id IS NULL 
  AND origin = 'public'
  AND length(logradouro) > 0
  AND property_area_m2 > 0
);
