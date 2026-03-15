
-- =============================================
-- FIX 1: Change clients SELECT from {public} to {authenticated}
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read clients" ON public.clients;
CREATE POLICY "Authenticated can read clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

-- Also fix the ALL policy from {public} to {authenticated}
DROP POLICY IF EXISTS "Admin/Gestor can modify clients" ON public.clients;
CREATE POLICY "Admin/Gestor can modify clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

-- =============================================
-- FIX 2: Change operators SELECT from {public} to {authenticated}
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read operators" ON public.operators;
CREATE POLICY "Authenticated can read operators"
  ON public.operators FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin/Gestor can modify operators" ON public.operators;
CREATE POLICY "Admin/Gestor can modify operators"
  ON public.operators FOR ALL
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

-- =============================================
-- FIX 3: Change time_records from {public} to {authenticated}
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read time_records" ON public.time_records;
CREATE POLICY "Authenticated can read time_records"
  ON public.time_records FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin/Gestor can modify time_records" ON public.time_records;
CREATE POLICY "Admin/Gestor can modify time_records"
  ON public.time_records FOR ALL
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

-- =============================================
-- FIX 4: Change operator_monthly_revenue from {public} to {authenticated}
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read operator_monthly_revenue" ON public.operator_monthly_revenue;
CREATE POLICY "Authenticated can read operator_monthly_revenue"
  ON public.operator_monthly_revenue FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin/Gestor can modify operator_monthly_revenue" ON public.operator_monthly_revenue;
CREATE POLICY "Admin/Gestor can modify operator_monthly_revenue"
  ON public.operator_monthly_revenue FOR ALL
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

-- =============================================
-- FIX 5: Change operator_vacations from {public} to {authenticated}
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read operator_vacations" ON public.operator_vacations;
CREATE POLICY "Authenticated can read operator_vacations"
  ON public.operator_vacations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin/Gestor can modify operator_vacations" ON public.operator_vacations;
CREATE POLICY "Admin/Gestor can modify operator_vacations"
  ON public.operator_vacations FOR ALL
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

-- =============================================
-- FIX 6: Restrict suppliers to admin/gestor only (IBAN, tax_id, etc.)
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read suppliers" ON public.suppliers;
CREATE POLICY "Admin/Gestor can read suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

-- =============================================
-- FIX 7: Restrict app_users to admin/gestor for full read
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read app_users" ON public.app_users;
CREATE POLICY "Admin/Gestor can read app_users"
  ON public.app_users FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

-- =============================================
-- FIX 8: Restrict chat_messages INSERT to authenticated (not WITH CHECK true broadly)
-- =============================================
DROP POLICY IF EXISTS "Authenticated can insert chat_messages" ON public.chat_messages;
CREATE POLICY "Authenticated can insert chat_messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_gestor(auth.uid()));

-- =============================================
-- FIX 9: Restrict conversations INSERT
-- =============================================
DROP POLICY IF EXISTS "Authenticated can insert conversations" ON public.conversations;
CREATE POLICY "Authenticated can insert conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_gestor(auth.uid()));
