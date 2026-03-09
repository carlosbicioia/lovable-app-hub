-- Create branches table
CREATE TABLE public.branches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  manager_name text NOT NULL DEFAULT '',
  cluster_ids text[] NOT NULL DEFAULT '{}',
  logo_url text DEFAULT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read branches"
  ON public.branches FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin/Gestor can modify branches"
  ON public.branches FOR ALL TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

-- Add branch_id to services, operators, collaborators
ALTER TABLE public.services ADD COLUMN branch_id uuid REFERENCES public.branches(id) DEFAULT NULL;
ALTER TABLE public.operators ADD COLUMN branch_id uuid REFERENCES public.branches(id) DEFAULT NULL;
ALTER TABLE public.collaborators ADD COLUMN branch_id uuid REFERENCES public.branches(id) DEFAULT NULL;

-- Updated_at trigger for branches
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();