
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  year integer,
  color text NOT NULL DEFAULT '',
  fuel_type text NOT NULL DEFAULT 'Diésel',
  vin text NOT NULL DEFAULT '',
  insurance_company text NOT NULL DEFAULT '',
  insurance_policy text NOT NULL DEFAULT '',
  insurance_expiry date,
  itv_expiry date,
  next_maintenance_date date,
  last_maintenance_date date,
  mileage integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Activo',
  operator_id text,
  branch_id uuid REFERENCES public.branches(id),
  photo text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Gestor can modify vehicles" ON public.vehicles
  FOR ALL TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Authenticated can read vehicles" ON public.vehicles
  FOR SELECT TO authenticated
  USING (true);
