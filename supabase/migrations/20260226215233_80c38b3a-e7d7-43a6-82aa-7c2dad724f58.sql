
-- ============================================================
-- Replace permissive "Allow all" RLS policies with:
--   SELECT: any authenticated user
--   INSERT/UPDATE/DELETE: admin or gestor only
-- Tables: app_users, budget_lines, budgets, certifications,
--         chat_messages, collaborators, company_settings,
--         conversations, delivery_note_lines, delivery_notes,
--         protocol_checks, purchase_invoice_lines, purchase_invoices,
--         purchase_order_lines, purchase_orders, service_media,
--         services, specialties, suppliers, tax_types
-- ============================================================

-- Helper: create a function to check admin or gestor
CREATE OR REPLACE FUNCTION public.is_admin_or_gestor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'gestor')
  )
$$;

-- ─── app_users ───
DROP POLICY IF EXISTS "Allow all access to app_users" ON public.app_users;
CREATE POLICY "Authenticated can read app_users" ON public.app_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify app_users" ON public.app_users FOR ALL TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));

-- ─── budget_lines ───
DROP POLICY IF EXISTS "Allow all access to budget_lines" ON public.budget_lines;
CREATE POLICY "Authenticated can read budget_lines" ON public.budget_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify budget_lines" ON public.budget_lines FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update budget_lines" ON public.budget_lines FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete budget_lines" ON public.budget_lines FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── budgets ───
DROP POLICY IF EXISTS "Allow all access to budgets" ON public.budgets;
CREATE POLICY "Authenticated can read budgets" ON public.budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify budgets" ON public.budgets FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update budgets" ON public.budgets FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete budgets" ON public.budgets FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── certifications ───
DROP POLICY IF EXISTS "Allow all access to certifications" ON public.certifications;
CREATE POLICY "Authenticated can read certifications" ON public.certifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify certifications" ON public.certifications FOR ALL TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));

-- ─── chat_messages ───
DROP POLICY IF EXISTS "Allow all access to chat_messages" ON public.chat_messages;
CREATE POLICY "Authenticated can read chat_messages" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert chat_messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin/Gestor can update chat_messages" ON public.chat_messages FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete chat_messages" ON public.chat_messages FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── collaborators ───
DROP POLICY IF EXISTS "Allow all access to collaborators" ON public.collaborators;
CREATE POLICY "Authenticated can read collaborators" ON public.collaborators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify collaborators" ON public.collaborators FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update collaborators" ON public.collaborators FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete collaborators" ON public.collaborators FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── company_settings ───
DROP POLICY IF EXISTS "Allow all access to company_settings" ON public.company_settings;
CREATE POLICY "Authenticated can read company_settings" ON public.company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can modify company_settings" ON public.company_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ─── conversations ───
DROP POLICY IF EXISTS "Allow all access to conversations" ON public.conversations;
CREATE POLICY "Authenticated can read conversations" ON public.conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin/Gestor can update conversations" ON public.conversations FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete conversations" ON public.conversations FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── delivery_note_lines ───
DROP POLICY IF EXISTS "Allow all access to delivery_note_lines" ON public.delivery_note_lines;
CREATE POLICY "Authenticated can read delivery_note_lines" ON public.delivery_note_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify delivery_note_lines" ON public.delivery_note_lines FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update delivery_note_lines" ON public.delivery_note_lines FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete delivery_note_lines" ON public.delivery_note_lines FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── delivery_notes ───
DROP POLICY IF EXISTS "Allow all access to delivery_notes" ON public.delivery_notes;
CREATE POLICY "Authenticated can read delivery_notes" ON public.delivery_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify delivery_notes" ON public.delivery_notes FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update delivery_notes" ON public.delivery_notes FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete delivery_notes" ON public.delivery_notes FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── protocol_checks ───
DROP POLICY IF EXISTS "Allow all access to protocol_checks" ON public.protocol_checks;
CREATE POLICY "Authenticated can read protocol_checks" ON public.protocol_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify protocol_checks" ON public.protocol_checks FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update protocol_checks" ON public.protocol_checks FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete protocol_checks" ON public.protocol_checks FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── purchase_invoice_lines ───
DROP POLICY IF EXISTS "Allow all access to purchase_invoice_lines" ON public.purchase_invoice_lines;
CREATE POLICY "Authenticated can read purchase_invoice_lines" ON public.purchase_invoice_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify purchase_invoice_lines" ON public.purchase_invoice_lines FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update purchase_invoice_lines" ON public.purchase_invoice_lines FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete purchase_invoice_lines" ON public.purchase_invoice_lines FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── purchase_invoices ───
DROP POLICY IF EXISTS "Allow all access to purchase_invoices" ON public.purchase_invoices;
CREATE POLICY "Authenticated can read purchase_invoices" ON public.purchase_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify purchase_invoices" ON public.purchase_invoices FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update purchase_invoices" ON public.purchase_invoices FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete purchase_invoices" ON public.purchase_invoices FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── purchase_order_lines ───
DROP POLICY IF EXISTS "Allow all access to purchase_order_lines" ON public.purchase_order_lines;
CREATE POLICY "Authenticated can read purchase_order_lines" ON public.purchase_order_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify purchase_order_lines" ON public.purchase_order_lines FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update purchase_order_lines" ON public.purchase_order_lines FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete purchase_order_lines" ON public.purchase_order_lines FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── purchase_orders ───
DROP POLICY IF EXISTS "Allow all access to purchase_orders" ON public.purchase_orders;
CREATE POLICY "Authenticated can read purchase_orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify purchase_orders" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update purchase_orders" ON public.purchase_orders FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete purchase_orders" ON public.purchase_orders FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── service_media ───
DROP POLICY IF EXISTS "Allow all access to service_media" ON public.service_media;
CREATE POLICY "Authenticated can read service_media" ON public.service_media FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify service_media" ON public.service_media FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update service_media" ON public.service_media FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete service_media" ON public.service_media FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── services ───
DROP POLICY IF EXISTS "Allow all access to services" ON public.services;
CREATE POLICY "Authenticated can read services" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify services" ON public.services FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update services" ON public.services FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete services" ON public.services FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── specialties ───
DROP POLICY IF EXISTS "Allow all access to specialties" ON public.specialties;
CREATE POLICY "Authenticated can read specialties" ON public.specialties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can modify specialties" ON public.specialties FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ─── suppliers ───
DROP POLICY IF EXISTS "Allow all access to suppliers" ON public.suppliers;
CREATE POLICY "Authenticated can read suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Gestor can modify suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (public.is_admin_or_gestor(auth.uid())) WITH CHECK (public.is_admin_or_gestor(auth.uid()));
CREATE POLICY "Admin/Gestor can delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (public.is_admin_or_gestor(auth.uid()));

-- ─── tax_types ───
DROP POLICY IF EXISTS "Allow all access to tax_types" ON public.tax_types;
CREATE POLICY "Authenticated can read tax_types" ON public.tax_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can modify tax_types" ON public.tax_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
