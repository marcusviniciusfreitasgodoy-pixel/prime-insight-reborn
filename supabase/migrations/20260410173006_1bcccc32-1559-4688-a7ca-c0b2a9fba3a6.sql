
CREATE TABLE public.whatsapp_messages_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  message_type text NOT NULL,
  message_content text,
  status text NOT NULL DEFAULT 'pending',
  response_data jsonb,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on whatsapp_messages_log"
  ON public.whatsapp_messages_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view whatsapp logs"
  ON public.whatsapp_messages_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
