CREATE TABLE public.monthly_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  target_revenue numeric NOT NULL DEFAULT 0,
  target_services integer NOT NULL DEFAULT 0,
  target_nps numeric NOT NULL DEFAULT 8,
  target_margin numeric NOT NULL DEFAULT 30,
  target_max_costs numeric NOT NULL DEFAULT 0,
  target_new_clients integer NOT NULL DEFAULT 0,
  target_avg_response_hours numeric NOT NULL DEFAULT 12,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month)
);

ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can modify monthly_targets"
  ON public.monthly_targets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read monthly_targets"
  ON public.monthly_targets FOR SELECT
  TO authenticated
  USING (true);