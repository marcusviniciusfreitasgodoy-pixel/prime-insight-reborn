-- Create feedbacks table
CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT,
  email TEXT,
  tipo_feedback TEXT NOT NULL DEFAULT 'sugestao',
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  mensagem TEXT NOT NULL,
  pagina_origem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow public inserts with validation
CREATE POLICY "Permitir envio público de feedback"
ON public.feedbacks
FOR INSERT
WITH CHECK (
  length(trim(mensagem)) >= 10 
  AND length(mensagem) <= 2000
  AND (email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$')
  AND (nome IS NULL OR length(nome) <= 100)
);

-- Only admins can view feedbacks
CREATE POLICY "Admins podem visualizar feedbacks"
ON public.feedbacks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));