
ALTER TABLE public.purchase_order_lines ADD COLUMN IF NOT EXISTS tax_rate numeric NOT NULL DEFAULT 21;
