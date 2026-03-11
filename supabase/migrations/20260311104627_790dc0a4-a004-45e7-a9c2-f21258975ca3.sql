ALTER TABLE public.monthly_targets ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

-- Drop existing unique constraint on month and create new one including branch_id
ALTER TABLE public.monthly_targets DROP CONSTRAINT IF EXISTS monthly_targets_month_key;
CREATE UNIQUE INDEX monthly_targets_month_branch_idx ON public.monthly_targets (month, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid));