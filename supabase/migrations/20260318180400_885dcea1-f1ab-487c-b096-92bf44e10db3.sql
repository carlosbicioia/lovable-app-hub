-- Add 3 article reference columns to operators
ALTER TABLE public.operators
  ADD COLUMN article_standard_hour_id text DEFAULT NULL,
  ADD COLUMN article_app_hour_id text DEFAULT NULL,
  ADD COLUMN article_urgency_hour_id text DEFAULT NULL;

-- Remove hourly_rate from specialties
ALTER TABLE public.specialties DROP COLUMN IF EXISTS hourly_rate;