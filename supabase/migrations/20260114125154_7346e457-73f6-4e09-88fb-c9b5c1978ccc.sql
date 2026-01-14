-- Fix: Secure the logradouros_geocoded table
-- Drop the overly permissive policy that allows anyone to write
DROP POLICY IF EXISTS "Allow service role to manage geocoded logradouros" ON public.logradouros_geocoded;

-- Create properly restricted write policies (service role only)
-- Since RLS policies using TO service_role work correctly, restrict all write operations to service role
CREATE POLICY "Service role can insert geocoded logradouros"
ON public.logradouros_geocoded
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update geocoded logradouros"
ON public.logradouros_geocoded
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can delete geocoded logradouros"
ON public.logradouros_geocoded
FOR DELETE
TO service_role
USING (true);

-- The existing "Allow public read access to geocoded logradouros" policy remains for read access