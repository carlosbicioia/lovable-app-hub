
-- Company settings (single-row table)
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT '',
  tax_id text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  logo_url text,
  sla_first_contact_hours integer NOT NULL DEFAULT 12,
  sla_resolution_hours integer NOT NULL DEFAULT 72,
  default_vat numeric NOT NULL DEFAULT 21,
  currency text NOT NULL DEFAULT 'EUR',
  budget_prefix text NOT NULL DEFAULT 'PRE-',
  budget_next_number integer NOT NULL DEFAULT 1000,
  budget_validity_days integer NOT NULL DEFAULT 30,
  date_format text NOT NULL DEFAULT 'dd/MM/yyyy',
  legal_conditions text NOT NULL DEFAULT '',
  document_footer text NOT NULL DEFAULT '',
  service_prefix text NOT NULL DEFAULT 'SRV-',
  invoice_prefix text NOT NULL DEFAULT 'FAC-',
  theme text NOT NULL DEFAULT 'system',
  language text NOT NULL DEFAULT 'es',
  timezone text NOT NULL DEFAULT 'europe_madrid',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to company_settings"
  ON public.company_settings FOR ALL
  USING (true) WITH CHECK (true);

-- App users table
CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'operario',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to app_users"
  ON public.app_users FOR ALL
  USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default company settings
INSERT INTO public.company_settings (
  company_name, tax_id, address, phone, email, website,
  legal_conditions, document_footer
) VALUES (
  'UrbanGO Facility Services S.L.', 'B12345678',
  'Calle Gran Vía 42, 28013 Madrid', '+34 911 234 567',
  'admin@urbango.es', 'https://urbango.es',
  'Este presupuesto tiene una validez de 30 días naturales desde la fecha de emisión. Los precios indicados no incluyen IVA salvo indicación expresa. Los trabajos se realizarán según la normativa vigente.',
  'UrbanGO Facility Services S.L. — CIF B12345678 — admin@urbango.es'
);

-- Seed default users
INSERT INTO public.app_users (name, email, role, active) VALUES
  ('Carlos García', 'carlos@urbango.es', 'admin', true),
  ('María López', 'maria@urbango.es', 'gestor', true),
  ('Pedro Ruiz', 'pedro@urbango.es', 'operario', false);
