
-- 1. Prevent users from updating their own email in profiles
-- Replace the self-update policy with one that excludes email changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (no email change)"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()));

-- 2. Fix service_media table read policy
DROP POLICY IF EXISTS "Authenticated can read service_media" ON public.service_media;

CREATE POLICY "Admin/Gestor can read service_media"
ON public.service_media FOR SELECT TO authenticated
USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read assigned service_media"
ON public.service_media FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_operators so
    WHERE so.service_id = service_media.service_id
      AND so.operator_id = get_user_operator_id(auth.uid())
  )
);

CREATE POLICY "Collaborators can read own service_media"
ON public.service_media FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = service_media.service_id
      AND s.collaborator_id = get_user_collaborator_id(auth.uid())
  )
);

-- 3. Fix collaborator insert services - add collaborator_id scope
DROP POLICY IF EXISTS "Collaborator can insert services" ON public.services;

CREATE POLICY "Collaborator can insert own services"
ON public.services FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'colaborador')
  AND collaborator_id = get_user_collaborator_id(auth.uid())
);

-- 4. Prevent operator_id changes on time_records after creation
CREATE OR REPLACE FUNCTION public.prevent_operator_id_change_time_records()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.operator_id IS DISTINCT FROM NEW.operator_id THEN
    RAISE EXCEPTION 'Cannot change operator_id on existing time records';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_operator_id_change
BEFORE UPDATE ON public.time_records
FOR EACH ROW
EXECUTE FUNCTION public.prevent_operator_id_change_time_records();
