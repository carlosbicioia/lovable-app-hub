
CREATE TABLE public.time_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id text NOT NULL,
  service_id text NULL,
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  hours numeric NOT NULL DEFAULT 0,
  location text NOT NULL DEFAULT '',
  latitude numeric NULL,
  longitude numeric NULL,
  notes text NULL,
  source text NOT NULL DEFAULT 'app',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Gestor can modify time_records" ON public.time_records
  FOR ALL USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Authenticated can read time_records" ON public.time_records
  FOR SELECT USING (true);

CREATE INDEX idx_time_records_operator ON public.time_records (operator_id);
CREATE INDEX idx_time_records_date ON public.time_records (record_date);
