
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS proforma_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proforma_sent_at timestamptz DEFAULT NULL;
