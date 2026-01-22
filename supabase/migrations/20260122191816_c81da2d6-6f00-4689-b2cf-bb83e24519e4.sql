-- Tabela para armazenar eventos de analytics (PDF download, parecer, WhatsApp)
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('pdf_download', 'parecer_solicitado', 'whatsapp_click', 'lead_capture', 'quick_valuation')),
  bairro text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para consultas agregadas
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_bairro ON public.analytics_events(bairro);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Políticas: inserção pública (para tracking), leitura apenas admin
CREATE POLICY "Permitir inserção pública de eventos"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Apenas admins podem visualizar eventos"
ON public.analytics_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- View agregada por dia e bairro para o dashboard
CREATE OR REPLACE VIEW public.analytics_events_daily AS
SELECT 
  date_trunc('day', created_at)::date AS dia,
  event_type,
  COALESCE(bairro, 'Não informado') AS bairro,
  COUNT(*) AS total
FROM public.analytics_events
GROUP BY date_trunc('day', created_at)::date, event_type, bairro
ORDER BY dia DESC, total DESC;