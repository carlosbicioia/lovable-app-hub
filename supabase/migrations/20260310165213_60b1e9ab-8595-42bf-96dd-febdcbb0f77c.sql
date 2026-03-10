
-- Add structured address fields to all relevant tables
-- Existing 'address' column becomes 'calle' conceptually

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS street_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS floor text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_extra text NOT NULL DEFAULT '';

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS street_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS floor text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_extra text NOT NULL DEFAULT '';

ALTER TABLE public.operators
  ADD COLUMN IF NOT EXISTS street_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS floor text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_extra text NOT NULL DEFAULT '';

ALTER TABLE public.collaborators
  ADD COLUMN IF NOT EXISTS street_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS floor text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_extra text NOT NULL DEFAULT '';

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS street_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS floor text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_extra text NOT NULL DEFAULT '';

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS street_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS floor text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_extra text NOT NULL DEFAULT '';

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS street_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS floor text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_extra text NOT NULL DEFAULT '';
