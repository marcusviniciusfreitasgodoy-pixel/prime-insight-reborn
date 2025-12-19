-- Add column for questionnaire responses
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS respostas_questionario JSONB;