
-- =============================================
-- 1. STORAGE: Tighten remaining permissive policies
-- =============================================

-- delivery-notes: restrict all ops to admin/gestor
DROP POLICY IF EXISTS "Allow authenticated uploads to delivery-notes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates on delivery-notes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes on delivery-notes" ON storage.objects;
DROP POLICY IF EXISTS "Admin/Gestor can read delivery-notes" ON storage.objects;

CREATE POLICY "Admin/Gestor can read delivery-notes"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'delivery-notes' AND is_admin_or_gestor(auth.uid()));

CREATE POLICY "Admin/Gestor can upload delivery-notes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'delivery-notes' AND is_admin_or_gestor(auth.uid()));

CREATE POLICY "Admin/Gestor can update delivery-notes"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'delivery-notes' AND is_admin_or_gestor(auth.uid()));

CREATE POLICY "Admin/Gestor can delete delivery-notes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'delivery-notes' AND is_admin_or_gestor(auth.uid()));

-- purchase-docs: restrict read and update to admin/gestor
DROP POLICY IF EXISTS "Allow authenticated reads from purchase-docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates on purchase-docs" ON storage.objects;

CREATE POLICY "Admin/Gestor can read purchase-docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'purchase-docs' AND is_admin_or_gestor(auth.uid()));

CREATE POLICY "Admin/Gestor can update purchase-docs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'purchase-docs' AND is_admin_or_gestor(auth.uid()));

-- service-media: restrict write/delete to admin/gestor (keep read for authenticated)
DROP POLICY IF EXISTS "Authenticated can upload service-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete service-media" ON storage.objects;

CREATE POLICY "Admin/Gestor can upload service-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service-media' AND is_admin_or_gestor(auth.uid()));

CREATE POLICY "Admin/Gestor can delete service-media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'service-media' AND is_admin_or_gestor(auth.uid()));

-- =============================================
-- 2. SERVICES: Restrict operarios to assigned services
-- =============================================

DROP POLICY IF EXISTS "Operarios can read services" ON public.services;

CREATE POLICY "Operarios can read assigned services"
ON public.services FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_operators so
    WHERE so.service_id = services.id
      AND so.operator_id = get_user_operator_id(auth.uid())
  )
);

-- =============================================
-- 3. BUDGETS: Restrict operarios to assigned service budgets
-- =============================================

DROP POLICY IF EXISTS "Operarios can read budgets" ON public.budgets;

CREATE POLICY "Operarios can read assigned budgets"
ON public.budgets FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_operators so
    WHERE so.service_id = budgets.service_id
      AND so.operator_id = get_user_operator_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "Operarios can read budget_lines" ON public.budget_lines;

CREATE POLICY "Operarios can read assigned budget_lines"
ON public.budget_lines FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.budgets b
    JOIN public.service_operators so ON so.service_id = b.service_id
    WHERE b.id = budget_lines.budget_id
      AND so.operator_id = get_user_operator_id(auth.uid())
  )
);

-- =============================================
-- 4. OPERATOR_MONTHLY_REVENUE: Restrict to admin/gestor + own
-- =============================================

DROP POLICY IF EXISTS "Authenticated can read operator_monthly_revenue" ON public.operator_monthly_revenue;

CREATE POLICY "Admin/Gestor can read all operator_monthly_revenue"
ON public.operator_monthly_revenue FOR SELECT TO authenticated
USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read own operator_monthly_revenue"
ON public.operator_monthly_revenue FOR SELECT TO authenticated
USING (operator_id = get_user_operator_id(auth.uid()));

-- =============================================
-- 5. SERVICE_TIMELINE_EVENTS: Restrict to admin/gestor + assigned operarios
-- =============================================

DROP POLICY IF EXISTS "Authenticated can read service_timeline_events" ON public.service_timeline_events;

CREATE POLICY "Admin/Gestor can read service_timeline_events"
ON public.service_timeline_events FOR SELECT TO authenticated
USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read assigned service_timeline_events"
ON public.service_timeline_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_operators so
    WHERE so.service_id = service_timeline_events.service_id
      AND so.operator_id = get_user_operator_id(auth.uid())
  )
);

-- =============================================
-- 6. SERVICE_MATERIALS_USED: Restrict to admin/gestor + assigned operarios
-- =============================================

DROP POLICY IF EXISTS "Authenticated can read service_materials_used" ON public.service_materials_used;

CREATE POLICY "Admin/Gestor can read service_materials_used"
ON public.service_materials_used FOR SELECT TO authenticated
USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read assigned service_materials_used"
ON public.service_materials_used FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_operators so
    WHERE so.service_id = service_materials_used.service_id
      AND so.operator_id = get_user_operator_id(auth.uid())
  )
);

-- =============================================
-- 7. OPERATOR_VACATIONS: Restrict to admin/gestor + own
-- =============================================

DROP POLICY IF EXISTS "Authenticated can read operator_vacations" ON public.operator_vacations;

CREATE POLICY "Admin/Gestor can read all operator_vacations"
ON public.operator_vacations FOR SELECT TO authenticated
USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read own operator_vacations"
ON public.operator_vacations FOR SELECT TO authenticated
USING (operator_id = get_user_operator_id(auth.uid()));
