-- Create function to get pending streets for batch geocoding
CREATE OR REPLACE FUNCTION public.get_pending_geocode_streets(p_limit integer DEFAULT 50)
RETURNS TABLE(logradouro text, bairro text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT i.logradouro, i.bairro
  FROM public.itbi_transactions i
  WHERE i.logradouro IS NOT NULL
    AND i.bairro IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.logradouros_geocoded g
      WHERE g.logradouro = i.logradouro
        AND g.bairro = i.bairro
        AND g.latitude IS NOT NULL
    )
  ORDER BY i.bairro, i.logradouro
  LIMIT p_limit;
$$;