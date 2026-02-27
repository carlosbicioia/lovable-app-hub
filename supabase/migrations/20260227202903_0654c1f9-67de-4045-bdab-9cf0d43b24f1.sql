
ALTER TABLE public.clients
  ADD COLUMN client_type text NOT NULL DEFAULT 'Particular',
  ADD COLUMN company_name text NOT NULL DEFAULT '',
  ADD COLUMN tax_id text NOT NULL DEFAULT '';
