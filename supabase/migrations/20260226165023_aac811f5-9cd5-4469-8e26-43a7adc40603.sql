
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS proforma_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proforma_paid_at timestamptz DEFAULT NULL;
