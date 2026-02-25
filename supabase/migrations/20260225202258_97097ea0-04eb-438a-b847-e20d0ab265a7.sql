
CREATE TABLE public.services (
  id TEXT NOT NULL PRIMARY KEY,
  client_id TEXT NOT NULL DEFAULT '',
  client_name TEXT NOT NULL DEFAULT '',
  operator_id TEXT,
  operator_name TEXT,
  collaborator_id TEXT,
  collaborator_name TEXT,
  cluster_id TEXT NOT NULL DEFAULT '',
  origin TEXT NOT NULL DEFAULT 'Directo',
  status TEXT NOT NULL DEFAULT 'Pendiente_Contacto',
  urgency TEXT NOT NULL DEFAULT 'Estándar',
  specialty TEXT NOT NULL DEFAULT 'Fontanería/Agua',
  service_type TEXT NOT NULL DEFAULT 'Reparación_Directa',
  service_category TEXT NOT NULL DEFAULT 'Correctivo',
  claim_status TEXT NOT NULL DEFAULT 'Abierto',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contacted_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  diagnosis_complete BOOLEAN NOT NULL DEFAULT false,
  nps INTEGER,
  budget_total NUMERIC,
  budget_status TEXT,
  description TEXT DEFAULT '',
  address TEXT DEFAULT '',
  real_hours NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to services" ON public.services FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
