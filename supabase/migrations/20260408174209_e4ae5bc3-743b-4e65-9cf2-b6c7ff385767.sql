
-- =============================================
-- 1. STORAGE: Drop public-role policies and recreate as authenticated
-- =============================================

-- Drop public-role WRITE policies
DROP POLICY IF EXISTS "Allow authenticated delete purchase-docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete service-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload purchase-docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload service-media" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth update company-assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload company-assets" ON storage.objects;

-- Drop public-role READ policies
DROP POLICY IF EXISTS "Allow public read purchase-docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read service-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads on delivery-notes" ON storage.objects;
DROP POLICY IF EXISTS "Public read company-assets" ON storage.objects;

-- Recreate as authenticated-only policies

-- service-media
CREATE POLICY "Authenticated can read service-media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'service-media');

CREATE POLICY "Authenticated can upload service-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service-media');

CREATE POLICY "Authenticated can delete service-media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'service-media');

-- purchase-docs (admin/gestor only for writes, already has authenticated read)
CREATE POLICY "Admin/Gestor can upload purchase-docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'purchase-docs' AND is_admin_or_gestor(auth.uid()));

CREATE POLICY "Admin/Gestor can delete purchase-docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'purchase-docs' AND is_admin_or_gestor(auth.uid()));

-- delivery-notes read (admin/gestor only)
CREATE POLICY "Admin/Gestor can read delivery-notes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'delivery-notes' AND is_admin_or_gestor(auth.uid()));

-- company-assets
CREATE POLICY "Authenticated can read company-assets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'company-assets');

CREATE POLICY "Admin can upload company-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update company-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete company-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-assets' AND has_role(auth.uid(), 'admin'));

-- Make sensitive buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('purchase-docs', 'delivery-notes', 'service-media');

-- Remove duplicate authenticated policies that already exist
DROP POLICY IF EXISTS "Allow authenticated deletes from purchase-docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to purchase-docs" ON storage.objects;

-- =============================================
-- 2. OPERATORS: Create helper function and restrict policy
-- =============================================

-- Function to get operator_id from auth user (via email match)
CREATE OR REPLACE FUNCTION public.get_user_operator_id(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id FROM public.operators o
  JOIN public.profiles p ON p.email = o.email
  WHERE p.id = _user_id
  LIMIT 1
$$;

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Admin/Gestor/Operario can read operators" ON public.operators;

-- Admin/Gestor can read all operators
CREATE POLICY "Admin/Gestor can read all operators"
ON public.operators FOR SELECT TO authenticated
USING (is_admin_or_gestor(auth.uid()));

-- Operarios can only read their own record
CREATE POLICY "Operarios can read own operator record"
ON public.operators FOR SELECT TO authenticated
USING (id = get_user_operator_id(auth.uid()));

-- =============================================
-- 3. CLIENTS: Restrict operarios to assigned services' clients
-- =============================================

DROP POLICY IF EXISTS "Operarios can read clients" ON public.clients;

CREATE POLICY "Operarios can read assigned clients"
ON public.clients FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_operators so
    JOIN public.services s ON s.id = so.service_id
    WHERE so.operator_id = get_user_operator_id(auth.uid())
      AND s.client_id = clients.id
  )
);

-- =============================================
-- 4. VEHICLES: Restrict to admin/gestor only
-- =============================================

DROP POLICY IF EXISTS "Authenticated can read vehicles" ON public.vehicles;

CREATE POLICY "Admin/Gestor can read vehicles"
ON public.vehicles FOR SELECT TO authenticated
USING (is_admin_or_gestor(auth.uid()));

-- =============================================
-- 5. TIME_RECORDS: Restrict operarios to own records
-- =============================================

DROP POLICY IF EXISTS "Operarios can read time_records" ON public.time_records;

CREATE POLICY "Operarios can read own time_records"
ON public.time_records FOR SELECT TO authenticated
USING (operator_id = get_user_operator_id(auth.uid()));

-- =============================================
-- 6. BRANCHES: Restrict collaborators to own branch
-- =============================================

DROP POLICY IF EXISTS "Authenticated can read branches" ON public.branches;

CREATE POLICY "Admin/Gestor can read all branches"
ON public.branches FOR SELECT TO authenticated
USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read branches"
ON public.branches FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'operario'
  )
);

CREATE POLICY "Collaborators can read own branch"
ON public.branches FOR SELECT TO authenticated
USING (
  id = (
    SELECT c.branch_id FROM public.collaborators c
    WHERE c.id = get_user_collaborator_id(auth.uid())
  )
);
