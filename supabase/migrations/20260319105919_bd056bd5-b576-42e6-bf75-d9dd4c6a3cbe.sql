
-- Create table for service timeline events
CREATE TABLE public.service_timeline_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id text NOT NULL,
  event_date timestamp with time zone NOT NULL,
  comment text NOT NULL DEFAULT '',
  author_email text NOT NULL DEFAULT '',
  author_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_timeline_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin/Gestor can modify service_timeline_events"
  ON public.service_timeline_events FOR ALL
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Authenticated can read service_timeline_events"
  ON public.service_timeline_events FOR SELECT
  TO authenticated
  USING (true);

-- Index for fast lookup
CREATE INDEX idx_service_timeline_events_service_id ON public.service_timeline_events (service_id);
