-- Drop old index and create one that handles NULLs
DROP INDEX IF EXISTS monthly_targets_month_branch_idx;
CREATE UNIQUE INDEX monthly_targets_month_branch_idx ON public.monthly_targets (month, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'));