
-- Table: notification event settings (admin configures which channels are active per event)
CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  event_label text NOT NULL DEFAULT '',
  event_description text NOT NULL DEFAULT '',
  app_enabled boolean NOT NULL DEFAULT true,
  slack_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can modify notification_settings"
  ON public.notification_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read notification_settings"
  ON public.notification_settings FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default notification events
INSERT INTO public.notification_settings (event_key, event_label, event_description, app_enabled, slack_enabled) VALUES
  ('new_service', 'Nuevo servicio recibido', 'Alerta al gestor del cluster correspondiente', true, false),
  ('sla_warning', 'SLA próximo a vencer', 'Aviso cuando quedan menos de 4h para el SLA', true, false),
  ('budget_decision', 'Presupuesto aprobado / rechazado', 'Notificación al creador del presupuesto', true, false),
  ('low_nps', 'NPS inferior al estándar', 'Alerta al gestor cuando NPS < 7', true, false),
  ('collaborator_comment', 'Nuevo comentario del colaborador', 'Notificación al equipo interno', true, false),
  ('service_status_change', 'Cambio de estado de servicio', 'Alerta cuando un servicio cambia de estado', true, false),
  ('new_purchase_order', 'Nueva orden de compra', 'Notificación cuando se crea una orden de compra', true, false),
  ('operator_time_record', 'Fichaje de operario', 'Registro de entrada/salida de operarios', false, false),
  ('urgent_service', 'Servicio urgente asignado', 'Alerta inmediata para servicios urgentes', true, false),
  ('service_no_operator', 'Servicio sin técnico asignado', 'Aviso cuando un servicio lleva tiempo sin operario', true, false);

-- Table: Slack channel per user/operator
CREATE TABLE public.user_slack_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  operator_id text,
  slack_channel_id text NOT NULL DEFAULT '',
  slack_channel_name text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_or_operator CHECK (user_id IS NOT NULL OR operator_id IS NOT NULL)
);

ALTER TABLE public.user_slack_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can modify user_slack_channels"
  ON public.user_slack_channels FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin/Gestor can read user_slack_channels"
  ON public.user_slack_channels FOR SELECT TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

CREATE TRIGGER update_user_slack_channels_updated_at
  BEFORE UPDATE ON public.user_slack_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
