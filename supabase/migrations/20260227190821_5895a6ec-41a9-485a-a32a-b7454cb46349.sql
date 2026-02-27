
-- Protocol steps configuration table
CREATE TABLE public.protocol_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.protocol_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read protocol_steps"
  ON public.protocol_steps FOR SELECT
  USING (true);

CREATE POLICY "Admin can modify protocol_steps"
  ON public.protocol_steps FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default steps
INSERT INTO public.protocol_steps (step_id, label, description, sort_order) VALUES
  ('contact', 'Contacto con cliente (SLA 12h)', 'Primer contacto telefónico o por email dentro del SLA establecido', 0),
  ('diagnosis', 'Diagnóstico multimedia', 'Recibir fotos o vídeos del problema reportado', 1),
  ('operator', 'Técnico asignado (por cluster y especialidad)', 'Asignar un técnico del cluster correcto con la especialidad adecuada', 2),
  ('materials', 'Material preparado', 'Confirmar que los materiales necesarios están disponibles', 3),
  ('budget', 'Presupuesto gestionado', 'Solo para servicios con presupuesto: enviar y obtener aprobación', 4),
  ('nps', 'NPS recogido', 'Recoger la encuesta de satisfacción al finalizar', 5);
