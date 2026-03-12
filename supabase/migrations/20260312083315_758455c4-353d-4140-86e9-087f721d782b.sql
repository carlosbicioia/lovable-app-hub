
-- Remove overly permissive INSERT policy (the ALL policy already covers admin/gestor)
DROP POLICY "System can insert audit logs" ON public.service_audit_log;
