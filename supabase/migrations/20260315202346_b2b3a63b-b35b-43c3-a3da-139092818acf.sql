
-- =============================================
-- FIX: Scope clients read - collaborators only see their own clients
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read clients" ON public.clients;
CREATE POLICY "Admin/Gestor can read all clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'operario')
  );

CREATE POLICY "Collaborators can read own clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (
    collaborator_id IS NOT NULL 
    AND collaborator_id = public.get_user_collaborator_id(auth.uid())
  );

-- =============================================
-- FIX: Scope operators read - only admin/gestor/operario
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read operators" ON public.operators;
CREATE POLICY "Admin/Gestor/Operario can read operators"
  ON public.operators FOR SELECT
  TO authenticated
  USING (
    is_admin_or_gestor(auth.uid()) 
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'operario')
  );

-- =============================================
-- FIX: Scope services read - collaborators see only their own
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read services" ON public.services;
CREATE POLICY "Admin/Gestor can read all services"
  ON public.services FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read services"
  ON public.services FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'operario')
  );

-- Keep existing collaborator policy (already scoped)

-- =============================================
-- FIX: Restrict collaborators table to admin/gestor
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read collaborators" ON public.collaborators;
CREATE POLICY "Admin/Gestor can read collaborators"
  ON public.collaborators FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Collaborator can read own record"
  ON public.collaborators FOR SELECT
  TO authenticated
  USING (id = public.get_user_collaborator_id(auth.uid()));

-- =============================================
-- FIX: Restrict time_records to admin/gestor/operario
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read time_records" ON public.time_records;
CREATE POLICY "Admin/Gestor can read all time_records"
  ON public.time_records FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read time_records"
  ON public.time_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'operario')
  );

-- =============================================
-- FIX: Restrict financial tables to admin/gestor
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read budgets" ON public.budgets;
CREATE POLICY "Admin/Gestor can read budgets"
  ON public.budgets FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read budgets"
  ON public.budgets FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'operario')
  );

DROP POLICY IF EXISTS "Authenticated can read budget_lines" ON public.budget_lines;
CREATE POLICY "Admin/Gestor can read budget_lines"
  ON public.budget_lines FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read budget_lines"
  ON public.budget_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'operario')
  );

DROP POLICY IF EXISTS "Authenticated can read sales_orders" ON public.sales_orders;
CREATE POLICY "Admin/Gestor can read sales_orders"
  ON public.sales_orders FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read sales_order_lines" ON public.sales_order_lines;
CREATE POLICY "Admin/Gestor can read sales_order_lines"
  ON public.sales_order_lines FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read purchase_orders" ON public.purchase_orders;
CREATE POLICY "Admin/Gestor can read purchase_orders"
  ON public.purchase_orders FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read purchase_order_lines" ON public.purchase_order_lines;
CREATE POLICY "Admin/Gestor can read purchase_order_lines"
  ON public.purchase_order_lines FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read purchase_invoices" ON public.purchase_invoices;
CREATE POLICY "Admin/Gestor can read purchase_invoices"
  ON public.purchase_invoices FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read purchase_invoice_lines" ON public.purchase_invoice_lines;
CREATE POLICY "Admin/Gestor can read purchase_invoice_lines"
  ON public.purchase_invoice_lines FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read delivery_notes" ON public.delivery_notes;
CREATE POLICY "Admin/Gestor can read delivery_notes"
  ON public.delivery_notes FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read delivery_note_lines" ON public.delivery_note_lines;
CREATE POLICY "Admin/Gestor can read delivery_note_lines"
  ON public.delivery_note_lines FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

-- =============================================
-- FIX: Restrict audit/notes history to admin/gestor
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read service_audit_log" ON public.service_audit_log;
CREATE POLICY "Admin/Gestor can read service_audit_log"
  ON public.service_audit_log FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can read service_notes_history" ON public.service_notes_history;
CREATE POLICY "Admin/Gestor can read service_notes_history"
  ON public.service_notes_history FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

-- =============================================
-- FIX: Restrict company_settings to admin/gestor for read
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read company_settings" ON public.company_settings;
CREATE POLICY "Admin/Gestor can read company_settings"
  ON public.company_settings FOR SELECT
  TO authenticated
  USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read company_settings"
  ON public.company_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'operario')
  );

-- =============================================
-- FIX: protocol_steps and subscription_plans from public to authenticated
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read protocol_steps" ON public.protocol_steps;
DROP POLICY IF EXISTS "Anyone can read protocol_steps" ON public.protocol_steps;
CREATE POLICY "Authenticated can read protocol_steps"
  ON public.protocol_steps FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can modify protocol_steps" ON public.protocol_steps;
CREATE POLICY "Admin can modify protocol_steps"
  ON public.protocol_steps FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
