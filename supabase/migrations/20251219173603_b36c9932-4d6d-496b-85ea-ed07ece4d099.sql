-- Drop existing INSERT policy and create a more permissive one
DROP POLICY IF EXISTS "Permitir envio público de feedback" ON public.feedbacks;

CREATE POLICY "Permitir envio público de feedback"
ON public.feedbacks
FOR INSERT
WITH CHECK (
  (length(TRIM(BOTH FROM mensagem)) >= 1)
  AND (length(mensagem) <= 2000)
  AND ((email IS NULL) OR (email ~ '^[^@]+@[^@]+\.[^@]+$'::text))
  AND ((nome IS NULL) OR (length(nome) <= 100))
);