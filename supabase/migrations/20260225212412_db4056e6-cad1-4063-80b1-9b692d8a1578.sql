CREATE TABLE public.collaborators (
  id text PRIMARY KEY,
  company_name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Administrador',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  nps_mean numeric NOT NULL DEFAULT 0,
  active_services integer NOT NULL DEFAULT 0,
  total_clients integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to collaborators" ON public.collaborators FOR ALL USING (true) WITH CHECK (true);

-- Seed existing mock data
INSERT INTO public.collaborators (id, company_name, category, email, phone, contact_person, nps_mean, active_services, total_clients) VALUES
  ('COL-001', 'Fincas Reunidas SL', 'Administrador', 'info@fincasreunidas.es', '911234567', 'Antonio Pérez', 8.7, 12, 45),
  ('COL-002', 'InmoGest BCN', 'Administrador', 'contacto@inmogestbcn.es', '932345678', 'Montse Vila', 9.1, 8, 32),
  ('COL-003', 'Correduría Andaluza', 'Corredor', 'info@correduriaandaluza.es', '954567890', 'Francisco Romero', 7.8, 5, 18),
  ('COL-004', 'Gestoría Norte', 'Gestoría', 'gestion@gestorianorte.es', '976789012', 'Isabel Martín', 8.2, 3, 11),
  ('COL-005', 'AdminPro Madrid', 'Administrador', 'admin@adminpro.es', '913456789', 'Luis Gómez', 9.4, 15, 58);