
-- Budgets table
CREATE TABLE public.budgets (
  id text PRIMARY KEY,
  service_id text NOT NULL,
  service_name text NOT NULL DEFAULT '',
  client_name text NOT NULL DEFAULT '',
  client_address text NOT NULL DEFAULT '',
  collaborator_name text,
  status text NOT NULL DEFAULT 'Borrador',
  terms_and_conditions text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to budgets"
  ON public.budgets FOR ALL
  USING (true) WITH CHECK (true);

-- Budget lines table
CREATE TABLE public.budget_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id text NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  concept text NOT NULL DEFAULT '',
  description text,
  units numeric NOT NULL DEFAULT 1,
  cost_price numeric NOT NULL DEFAULT 0,
  margin numeric NOT NULL DEFAULT 30,
  tax_rate integer NOT NULL DEFAULT 21,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to budget_lines"
  ON public.budget_lines FOR ALL
  USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
