
CREATE TABLE public.protocol_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text NOT NULL,
  check_id text NOT NULL,
  checked boolean NOT NULL DEFAULT false,
  checked_by uuid REFERENCES auth.users(id),
  checked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(service_id, check_id)
);

ALTER TABLE public.protocol_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to protocol_checks"
  ON public.protocol_checks
  FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.protocol_checks;
