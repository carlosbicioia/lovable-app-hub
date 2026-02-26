
-- 1. Drop old tables
DROP TABLE IF EXISTS public.purchase_order_lines CASCADE;
DROP TABLE IF EXISTS public.purchase_orders CASCADE;

-- 2. Create purchase_orders (OC - siempre vinculada a servicio)
CREATE TABLE public.purchase_orders (
  id text PRIMARY KEY,
  service_id text NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id),
  supplier_name text NOT NULL DEFAULT '',
  operator_id text,
  operator_name text,
  status text NOT NULL DEFAULT 'Borrador',
  notes text DEFAULT '',
  total_cost numeric DEFAULT 0,
  pdf_path text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create purchase_order_lines
CREATE TABLE public.purchase_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id text NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  article_name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  units numeric NOT NULL DEFAULT 1,
  cost_price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create delivery_notes (albaranes / compras directas)
CREATE TABLE public.delivery_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL DEFAULT '',
  service_id text NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id),
  supplier_name text NOT NULL DEFAULT '',
  operator_id text,
  operator_name text,
  status text NOT NULL DEFAULT 'Pendiente',
  total_cost numeric DEFAULT 0,
  pdf_path text,
  notes text DEFAULT '',
  collected_at timestamptz,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create delivery_note_lines
CREATE TABLE public.delivery_note_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_note_id uuid NOT NULL REFERENCES public.delivery_notes(id) ON DELETE CASCADE,
  article_name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  units numeric NOT NULL DEFAULT 1,
  cost_price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Create purchase_invoices (facturas de compra)
CREATE TABLE public.purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL DEFAULT '',
  supplier_id uuid REFERENCES public.suppliers(id),
  supplier_name text NOT NULL DEFAULT '',
  invoice_date date,
  due_date date,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 21,
  tax_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pendiente',
  pdf_path text,
  notes text DEFAULT '',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Create purchase_invoice_lines (cada línea vinculada a un servicio)
CREATE TABLE public.purchase_invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
  service_id text,
  purchase_order_id text REFERENCES public.purchase_orders(id),
  delivery_note_id uuid REFERENCES public.delivery_notes(id),
  description text NOT NULL DEFAULT '',
  units numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 21,
  total numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. RLS policies
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_note_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to purchase_order_lines" ON public.purchase_order_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to delivery_notes" ON public.delivery_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to delivery_note_lines" ON public.delivery_note_lines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to purchase_invoices" ON public.purchase_invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to purchase_invoice_lines" ON public.purchase_invoice_lines FOR ALL USING (true) WITH CHECK (true);

-- 9. Storage bucket for purchase documents
INSERT INTO storage.buckets (id, name, public) VALUES ('purchase-docs', 'purchase-docs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read purchase-docs" ON storage.objects FOR SELECT USING (bucket_id = 'purchase-docs');
CREATE POLICY "Allow authenticated upload purchase-docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'purchase-docs');
CREATE POLICY "Allow authenticated delete purchase-docs" ON storage.objects FOR DELETE USING (bucket_id = 'purchase-docs');
