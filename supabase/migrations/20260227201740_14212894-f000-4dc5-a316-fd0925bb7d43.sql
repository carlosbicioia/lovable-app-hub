
-- Clients table
CREATE TABLE public.clients (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  dni text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT '',
  cluster_id text NOT NULL DEFAULT '',
  collaborator_id text,
  collaborator_name text,
  plan_type text NOT NULL DEFAULT 'Ninguno',
  last_service_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Gestor can modify clients" ON public.clients FOR ALL USING (is_admin_or_gestor(auth.uid())) WITH CHECK (is_admin_or_gestor(auth.uid()));
CREATE POLICY "Authenticated can read clients" ON public.clients FOR SELECT USING (true);

-- Operators table
CREATE TABLE public.operators (
  id text PRIMARY KEY,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  dni text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT '',
  photo text NOT NULL DEFAULT '',
  specialty text NOT NULL DEFAULT 'Fontanería/Agua',
  secondary_specialty text,
  cluster_id text NOT NULL DEFAULT '',
  cluster_ids text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'Activo',
  available boolean NOT NULL DEFAULT true,
  nps_mean numeric NOT NULL DEFAULT 0,
  total_revenue numeric NOT NULL DEFAULT 0,
  completed_services integer NOT NULL DEFAULT 0,
  active_services integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '210 80% 52%',
  hire_date date,
  vehicle_plate text,
  certifications text[] NOT NULL DEFAULT '{}',
  avg_response_time numeric NOT NULL DEFAULT 0,
  last_service_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Gestor can modify operators" ON public.operators FOR ALL USING (is_admin_or_gestor(auth.uid())) WITH CHECK (is_admin_or_gestor(auth.uid()));
CREATE POLICY "Authenticated can read operators" ON public.operators FOR SELECT USING (true);

-- Operator monthly revenue table
CREATE TABLE public.operator_monthly_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id text NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
  month text NOT NULL,
  revenue numeric NOT NULL DEFAULT 0,
  services integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_monthly_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Gestor can modify operator_monthly_revenue" ON public.operator_monthly_revenue FOR ALL USING (is_admin_or_gestor(auth.uid())) WITH CHECK (is_admin_or_gestor(auth.uid()));
CREATE POLICY "Authenticated can read operator_monthly_revenue" ON public.operator_monthly_revenue FOR SELECT USING (true);

-- Triggers for updated_at
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_operators_updated_at BEFORE UPDATE ON public.operators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
