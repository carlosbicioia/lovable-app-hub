ALTER TABLE public.collaborators
  ADD COLUMN IF NOT EXISTS portal_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS additional_contacts jsonb NOT NULL DEFAULT '[]'::jsonb;