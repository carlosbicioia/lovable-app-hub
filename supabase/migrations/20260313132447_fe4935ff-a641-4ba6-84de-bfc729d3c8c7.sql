CREATE TABLE public.service_notes_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id text NOT NULL,
  field text NOT NULL, -- 'internal_notes' or 'collaborator_notes'
  content text NOT NULL DEFAULT '',
  user_email text NOT NULL DEFAULT '',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_notes_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Gestor can modify service_notes_history"
  ON public.service_notes_history FOR ALL TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Authenticated can read service_notes_history"
  ON public.service_notes_history FOR SELECT TO authenticated
  USING (true);

CREATE INDEX idx_notes_history_service ON public.service_notes_history(service_id, field, created_at DESC);