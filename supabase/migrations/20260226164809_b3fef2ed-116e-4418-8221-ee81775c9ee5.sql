ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS signature_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signed_by text DEFAULT NULL;