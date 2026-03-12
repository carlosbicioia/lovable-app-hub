
-- Create service_operators many-to-many table
CREATE TABLE public.service_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text NOT NULL,
  operator_id text NOT NULL,
  operator_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, operator_id)
);

-- Enable RLS
ALTER TABLE public.service_operators ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admin/Gestor can modify service_operators"
  ON public.service_operators FOR ALL TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Authenticated can read service_operators"
  ON public.service_operators FOR SELECT TO authenticated
  USING (true);

-- Migrate existing data from services.operator_id
INSERT INTO public.service_operators (service_id, operator_id, operator_name)
SELECT id, operator_id, COALESCE(operator_name, '')
FROM public.services
WHERE operator_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Enable realtime for service_operators
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_operators;
