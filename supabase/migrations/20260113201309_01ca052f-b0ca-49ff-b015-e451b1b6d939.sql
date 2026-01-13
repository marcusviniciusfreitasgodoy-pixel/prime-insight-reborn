-- Add columns to track follow-up emails
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS followup_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS parecer_solicitado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parecer_solicitado_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient follow-up queries
CREATE INDEX IF NOT EXISTS idx_leads_followup 
ON public.leads (created_at, followup_sent_at, parecer_solicitado) 
WHERE followup_sent_at IS NULL AND parecer_solicitado = false;