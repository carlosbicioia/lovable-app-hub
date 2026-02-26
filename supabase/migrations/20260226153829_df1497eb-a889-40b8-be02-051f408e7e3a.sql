
-- Create tax_types table for configurable tax rates
CREATE TABLE public.tax_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  rate numeric NOT NULL DEFAULT 21,
  active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_types ENABLE ROW LEVEL SECURITY;

-- Allow all access (matches existing pattern)
CREATE POLICY "Allow all access to tax_types" ON public.tax_types FOR ALL USING (true) WITH CHECK (true);

-- Insert default tax types
INSERT INTO public.tax_types (name, rate, is_default, sort_order) VALUES
  ('IVA 21%', 21, true, 0),
  ('IVA 10%', 10, false, 1),
  ('IVA 4%', 4, false, 2),
  ('Exento', 0, false, 3);

-- Add new columns to purchase_order_lines
ALTER TABLE public.purchase_order_lines
  ADD COLUMN supplier_code text NOT NULL DEFAULT '',
  ADD COLUMN discount_percent numeric NOT NULL DEFAULT 0;

-- Add tax_type_id to purchase_orders
ALTER TABLE public.purchase_orders
  ADD COLUMN tax_type_id uuid REFERENCES public.tax_types(id);

-- Set default tax_type_id for existing orders
UPDATE public.purchase_orders
SET tax_type_id = (SELECT id FROM public.tax_types WHERE is_default = true LIMIT 1)
WHERE tax_type_id IS NULL;
