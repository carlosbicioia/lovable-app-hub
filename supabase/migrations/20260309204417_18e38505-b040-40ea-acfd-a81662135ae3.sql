
CREATE TABLE public.municipalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  province text NOT NULL,
  name text NOT NULL,
  UNIQUE(province, name)
);

ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read municipalities"
  ON public.municipalities FOR SELECT
  TO public
  USING (true);

CREATE INDEX idx_municipalities_province ON public.municipalities(province);
