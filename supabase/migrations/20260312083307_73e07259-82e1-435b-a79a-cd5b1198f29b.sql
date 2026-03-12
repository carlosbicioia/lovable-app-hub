
-- Create service audit log table
CREATE TABLE public.service_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text NOT NULL,
  action text NOT NULL,
  user_id uuid,
  user_email text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can read service_audit_log"
  ON public.service_audit_log FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin/Gestor can modify service_audit_log"
  ON public.service_audit_log FOR ALL TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

-- Allow inserts from triggers (service role)
CREATE POLICY "System can insert audit logs"
  ON public.service_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_audit_log;
