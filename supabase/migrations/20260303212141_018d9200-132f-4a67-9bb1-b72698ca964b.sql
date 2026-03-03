
-- Create operator vacations table
CREATE TABLE public.operator_vacations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL DEFAULT 1,
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operator_vacations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin/Gestor can modify operator_vacations"
ON public.operator_vacations FOR ALL
USING (is_admin_or_gestor(auth.uid()))
WITH CHECK (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Authenticated can read operator_vacations"
ON public.operator_vacations FOR SELECT
USING (true);

-- Index for fast lookups
CREATE INDEX idx_operator_vacations_operator_id ON public.operator_vacations (operator_id);
