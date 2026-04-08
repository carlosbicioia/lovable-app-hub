
-- Helper function: get service_ids assigned to an operator (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_operator_service_ids(_operator_id text)
RETURNS SETOF text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT service_id FROM public.service_operators WHERE operator_id = _operator_id
$$;

-- Helper function: get collaborator_id for a service (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_service_collaborator_id(_service_id text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT collaborator_id FROM public.services WHERE id = _service_id LIMIT 1
$$;

-- Helper function: get client_id for services assigned to an operator
CREATE OR REPLACE FUNCTION public.get_operator_client_ids(_operator_id text)
RETURNS SETOF text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT s.client_id 
  FROM public.services s
  JOIN public.service_operators so ON so.service_id = s.id
  WHERE so.operator_id = _operator_id
$$;

-- Fix services: replace operarios policy to avoid querying service_operators with RLS
DROP POLICY IF EXISTS "Operarios can read assigned services" ON public.services;
CREATE POLICY "Operarios can read assigned services"
ON public.services FOR SELECT
USING (id IN (SELECT get_operator_service_ids(get_user_operator_id(auth.uid()))));

-- Fix service_operators: replace collaborators policy to avoid querying services with RLS
DROP POLICY IF EXISTS "Collaborators can read own service_operators" ON public.service_operators;
CREATE POLICY "Collaborators can read own service_operators"
ON public.service_operators FOR SELECT
USING (get_service_collaborator_id(service_id) = get_user_collaborator_id(auth.uid()));

-- Fix clients: replace operarios policy
DROP POLICY IF EXISTS "Operarios can read assigned clients" ON public.clients;
CREATE POLICY "Operarios can read assigned clients"
ON public.clients FOR SELECT
USING (id IN (SELECT get_operator_client_ids(get_user_operator_id(auth.uid()))));

-- Fix budgets: replace operarios policy
DROP POLICY IF EXISTS "Operarios can read assigned budgets" ON public.budgets;
CREATE POLICY "Operarios can read assigned budgets"
ON public.budgets FOR SELECT
USING (service_id IN (SELECT get_operator_service_ids(get_user_operator_id(auth.uid()))));

-- Fix budget_lines: replace operarios policy
DROP POLICY IF EXISTS "Operarios can read assigned budget_lines" ON public.budget_lines;
CREATE POLICY "Operarios can read assigned budget_lines"
ON public.budget_lines FOR SELECT
USING (budget_id IN (
  SELECT b.id FROM public.budgets b
  WHERE b.service_id IN (SELECT get_operator_service_ids(get_user_operator_id(auth.uid())))
));
