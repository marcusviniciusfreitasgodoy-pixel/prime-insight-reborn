
-- Remover politica atual sem validacao
DROP POLICY "Permitir inserção pública de eventos" ON public.analytics_events;

-- Criar politica com validacao de campos
CREATE POLICY "Permitir inserção pública de eventos validada"
ON public.analytics_events
FOR INSERT
WITH CHECK (
  length(event_type) <= 100 AND
  (bairro IS NULL OR length(bairro) <= 100) AND
  (metadata IS NULL OR (jsonb_typeof(metadata) = 'object' AND pg_column_size(metadata) < 5000))
);
