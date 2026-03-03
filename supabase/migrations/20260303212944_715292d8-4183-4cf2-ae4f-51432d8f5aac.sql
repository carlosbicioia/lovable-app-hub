-- Add company-level fields to collaborators
ALTER TABLE public.collaborators
  ADD COLUMN IF NOT EXISTS tax_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS province text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS postal_code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS website text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';