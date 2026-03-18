
CREATE TABLE public.articles (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Material',
  specialty text NOT NULL DEFAULT '',
  cost_price numeric NOT NULL DEFAULT 0,
  has_known_pvp boolean NOT NULL DEFAULT false,
  pvp numeric,
  unit text NOT NULL DEFAULT 'ud',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Gestor can modify articles" ON public.articles
  FOR ALL TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Authenticated can read articles" ON public.articles
  FOR SELECT TO authenticated
  USING (true);

-- Seed the existing hardcoded articles
INSERT INTO public.articles (id, title, description, category, specialty, cost_price, has_known_pvp, pvp, unit, sort_order) VALUES
  ('ART-001', 'Tubería cobre 22mm', 'Tubería de cobre para instalaciones de agua, por metro lineal', 'Material', 'Fontanería/Agua', 14.25, true, 17.95, 'm', 1),
  ('ART-002', 'Codo cobre 22mm 90°', 'Codo de cobre para unión de tuberías a 90 grados', 'Material', 'Fontanería/Agua', 2.10, false, null, 'ud', 2),
  ('ART-003', 'Grifo monomando cocina Grohe', 'Grifo monomando para cocina, modelo Eurosmart', 'Material', 'Fontanería/Agua', 65.00, true, 89.90, 'ud', 3),
  ('ART-004', 'Grifo lavabo baño Grohe', 'Grifo monomando para lavabo de baño', 'Material', 'Fontanería/Agua', 52.00, true, 72.50, 'ud', 4),
  ('ART-005', 'Cuadro eléctrico 40 módulos', 'Cuadro de distribución eléctrica con espacio para 40 módulos', 'Material', 'Electricidad/Luz', 185.00, true, 245.00, 'ud', 5),
  ('ART-006', 'Diferencial 40A', 'Interruptor diferencial 40A 30mA bipolar', 'Material', 'Electricidad/Luz', 42.00, true, 58.90, 'ud', 6),
  ('ART-007', 'Cable 6mm² (rollo 50m)', 'Cable eléctrico unipolar 6mm² libre de halógenos', 'Material', 'Electricidad/Luz', 38.00, false, null, 'ud', 7),
  ('ART-008', 'Mecanismo enchufe Schuko', 'Base enchufe Schuko empotrable con toma de tierra', 'Material', 'Electricidad/Luz', 4.50, false, null, 'ud', 8),
  ('ART-009', 'Unidad exterior Daikin 3MXM68N', 'Unidad exterior multi-split para 3 unidades interiores', 'Material', 'Clima', 1200.00, true, 1650.00, 'ud', 9),
  ('ART-010', 'Unidad interior Daikin FTXM25R', 'Unidad interior split de pared 2.5kW', 'Material', 'Clima', 280.00, true, 390.00, 'ud', 10),
  ('ART-011', 'Hora fontanero', 'Mano de obra oficial fontanero', 'Mano_de_Obra', 'Fontanería/Agua', 35.00, false, null, 'h', 11),
  ('ART-012', 'Hora electricista', 'Mano de obra oficial electricista', 'Mano_de_Obra', 'Electricidad/Luz', 40.00, false, null, 'h', 12),
  ('ART-013', 'Hora climatización', 'Mano de obra técnico climatización', 'Mano_de_Obra', 'Clima', 42.00, false, null, 'h', 13);
