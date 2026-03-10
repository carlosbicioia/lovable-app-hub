
CREATE TABLE public.service_materials_used (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id text NOT NULL,
  material text NOT NULL DEFAULT '',
  supplier_name text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  purchase_date date NULL,
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.service_materials_used ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Gestor can modify service_materials_used"
ON public.service_materials_used
FOR ALL
TO authenticated
USING (is_admin_or_gestor(auth.uid()))
WITH CHECK (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Authenticated can read service_materials_used"
ON public.service_materials_used
FOR SELECT
TO authenticated
USING (true);
