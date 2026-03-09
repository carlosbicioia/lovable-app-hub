
CREATE TABLE public.service_origins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  show_collaborator boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_origins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Gestor can modify service_origins" ON public.service_origins
  FOR ALL TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Authenticated can read service_origins" ON public.service_origins
  FOR SELECT TO authenticated
  USING (true);

-- Seed default origins
INSERT INTO public.service_origins (name, show_collaborator, sort_order) VALUES
  ('Directo', false, 0),
  ('B2B', true, 1),
  ('App', false, 2),
  ('API_Externa', false, 3);
