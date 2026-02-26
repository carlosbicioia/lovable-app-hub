
-- Purchase Orders
CREATE TABLE public.purchase_orders (
  id text NOT NULL PRIMARY KEY,
  type text NOT NULL DEFAULT 'Servicio',         -- 'Servicio' | 'Fungible' | 'Gasto_General'
  service_id text,                                -- nullable, linked when type=Servicio
  operator_id text,
  operator_name text,
  supplier_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Borrador',        -- Borrador | Pendiente_Aprobación | Aprobada | Recogida | Conciliada
  is_emergency boolean NOT NULL DEFAULT false,
  authorization_code text,
  delivery_note_url text,
  notes text DEFAULT '',
  total_cost numeric DEFAULT 0,
  approved_by text,
  approved_at timestamp with time zone,
  collected_at timestamp with time zone,
  reconciled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Purchase Order Lines
CREATE TABLE public.purchase_order_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id text NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  article_name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  units numeric NOT NULL DEFAULT 1,
  cost_price numeric NOT NULL DEFAULT 0,
  has_known_pvp boolean NOT NULL DEFAULT false,
  pvp numeric,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to purchase_order_lines" ON public.purchase_order_lines FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
