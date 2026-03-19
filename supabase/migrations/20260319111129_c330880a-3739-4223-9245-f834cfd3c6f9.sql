
-- Add creator and manager fields to services
ALTER TABLE public.services
  ADD COLUMN created_by_email text NOT NULL DEFAULT '',
  ADD COLUMN created_by_name text NOT NULL DEFAULT '',
  ADD COLUMN managed_by_email text NOT NULL DEFAULT '',
  ADD COLUMN managed_by_name text NOT NULL DEFAULT '';
