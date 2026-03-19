
-- Add operator type (Plantilla or Subcontratado)
ALTER TABLE public.operators ADD COLUMN operator_type text NOT NULL DEFAULT 'Plantilla';

-- Add 3 cost article references
ALTER TABLE public.operators ADD COLUMN cost_article_standard_hour_id text DEFAULT NULL;
ALTER TABLE public.operators ADD COLUMN cost_article_app_hour_id text DEFAULT NULL;
ALTER TABLE public.operators ADD COLUMN cost_article_urgency_hour_id text DEFAULT NULL;
