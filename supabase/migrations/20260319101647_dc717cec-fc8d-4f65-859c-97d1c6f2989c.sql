
-- Add urgency pricing columns (3 cost + 3 sale article references)
ALTER TABLE public.operators
  ADD COLUMN cost_article_salida_id text DEFAULT NULL,
  ADD COLUMN cost_article_dia_guardia_id text DEFAULT NULL,
  ADD COLUMN cost_article_hora_guardia_id text DEFAULT NULL,
  ADD COLUMN article_salida_id text DEFAULT NULL,
  ADD COLUMN article_dia_guardia_id text DEFAULT NULL,
  ADD COLUMN article_hora_guardia_id text DEFAULT NULL;
