-- Sales orders table
CREATE TABLE public.sales_orders (
  id text NOT NULL PRIMARY KEY,
  budget_id text NOT NULL,
  service_id text NOT NULL,
  client_name text NOT NULL DEFAULT '',
  client_address text NOT NULL DEFAULT '',
  collaborator_name text,
  status text NOT NULL DEFAULT 'Pendiente',
  sent_to_holded boolean NOT NULL DEFAULT false,
  sent_to_holded_at timestamptz,
  holded_doc_id text,
  total numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sales order lines (copied from budget lines)
CREATE TABLE public.sales_order_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_order_id text NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  concept text NOT NULL DEFAULT '',
  description text,
  units numeric NOT NULL DEFAULT 1,
  cost_price numeric NOT NULL DEFAULT 0,
  margin numeric NOT NULL DEFAULT 30,
  tax_rate integer NOT NULL DEFAULT 21,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_lines ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_orders
CREATE POLICY "Admin/Gestor can modify sales_orders" ON public.sales_orders FOR ALL TO authenticated
  USING (is_admin_or_gestor(auth.uid())) WITH CHECK (is_admin_or_gestor(auth.uid()));
CREATE POLICY "Authenticated can read sales_orders" ON public.sales_orders FOR SELECT TO authenticated
  USING (true);

-- RLS policies for sales_order_lines
CREATE POLICY "Admin/Gestor can modify sales_order_lines" ON public.sales_order_lines FOR ALL TO authenticated
  USING (is_admin_or_gestor(auth.uid())) WITH CHECK (is_admin_or_gestor(auth.uid()));
CREATE POLICY "Authenticated can read sales_order_lines" ON public.sales_order_lines FOR SELECT TO authenticated
  USING (true);

-- Updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();