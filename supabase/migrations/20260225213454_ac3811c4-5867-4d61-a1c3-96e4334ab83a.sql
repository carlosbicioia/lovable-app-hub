
-- Specialties table
CREATE TABLE public.specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT 'Wrench',
  color text NOT NULL DEFAULT 'bg-muted text-muted-foreground border-border',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to specialties" ON public.specialties FOR ALL USING (true) WITH CHECK (true);

-- Certifications table
CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to certifications" ON public.certifications FOR ALL USING (true) WITH CHECK (true);

-- Seed specialties with current hardcoded values
INSERT INTO public.specialties (name, icon, color, sort_order) VALUES
  ('Fontanería/Agua', 'Droplets', 'bg-info/15 text-info border-info/30', 1),
  ('Electricidad/Luz', 'Zap', 'bg-warning/15 text-warning border-warning/30', 2),
  ('Clima', 'Wind', 'bg-success/15 text-success border-success/30', 3);

-- Seed certifications with current mock values
INSERT INTO public.certifications (name, sort_order) VALUES
  ('RITE', 1),
  ('Carnet Instalador Gas', 2),
  ('PRL 60h', 3),
  ('Carnet Instalador Eléctrico', 4),
  ('Certificado F-Gas', 5),
  ('PRL 20h', 6);
