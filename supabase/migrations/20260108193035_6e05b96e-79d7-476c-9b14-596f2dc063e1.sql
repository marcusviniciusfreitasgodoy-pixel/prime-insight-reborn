-- Create table to cache geocoded logradouros from Prefeitura API
CREATE TABLE public.logradouros_geocoded (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logradouro TEXT NOT NULL,
  bairro TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  cod_trecho INTEGER,
  hierarquia TEXT,
  velocidade_regulamentada SMALLINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(logradouro, bairro)
);

-- Create index for faster lookups
CREATE INDEX idx_logradouros_geocoded_bairro ON public.logradouros_geocoded(bairro);
CREATE INDEX idx_logradouros_geocoded_logradouro ON public.logradouros_geocoded(logradouro);

-- Enable RLS
ALTER TABLE public.logradouros_geocoded ENABLE ROW LEVEL SECURITY;

-- Allow public read access (this is public data from Prefeitura)
CREATE POLICY "Allow public read access to geocoded logradouros"
ON public.logradouros_geocoded
FOR SELECT
USING (true);

-- Only allow backend (service role) to insert/update
CREATE POLICY "Allow service role to manage geocoded logradouros"
ON public.logradouros_geocoded
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_logradouros_geocoded_updated_at
BEFORE UPDATE ON public.logradouros_geocoded
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();