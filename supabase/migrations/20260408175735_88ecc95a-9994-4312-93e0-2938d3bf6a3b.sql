
-- 1. Fix protocol_checks: restrict reads
DROP POLICY IF EXISTS "Authenticated can read protocol_checks" ON public.protocol_checks;

CREATE POLICY "Admin/Gestor can read protocol_checks"
ON public.protocol_checks FOR SELECT TO authenticated
USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read assigned protocol_checks"
ON public.protocol_checks FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_operators so
    WHERE so.service_id = protocol_checks.service_id
      AND so.operator_id = get_user_operator_id(auth.uid())
  )
);

-- 2. Fix service_operators: restrict reads
DROP POLICY IF EXISTS "Authenticated can read service_operators" ON public.service_operators;

CREATE POLICY "Admin/Gestor can read service_operators"
ON public.service_operators FOR SELECT TO authenticated
USING (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Operarios can read own service_operators"
ON public.service_operators FOR SELECT TO authenticated
USING (operator_id = get_user_operator_id(auth.uid()));

CREATE POLICY "Collaborators can read own service_operators"
ON public.service_operators FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = service_operators.service_id
      AND s.collaborator_id = get_user_collaborator_id(auth.uid())
  )
);

-- 3. Fix service-media storage read policy
DROP POLICY IF EXISTS "Authenticated can read service-media" ON storage.objects;

CREATE POLICY "Admin/Gestor can read service-media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'service-media'
  AND is_admin_or_gestor(auth.uid())
);

CREATE POLICY "Operarios can read assigned service-media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'service-media'
  AND EXISTS (
    SELECT 1 FROM public.service_media sm
    JOIN public.service_operators so ON so.service_id = sm.service_id
    WHERE sm.file_path = name
      AND so.operator_id = get_user_operator_id(auth.uid())
  )
);

-- 4. Add time_records INSERT/UPDATE for operarios
CREATE POLICY "Operarios can insert own time_records"
ON public.time_records FOR INSERT TO authenticated
WITH CHECK (
  operator_id = get_user_operator_id(auth.uid())
);

CREATE POLICY "Operarios can update own time_records"
ON public.time_records FOR UPDATE TO authenticated
USING (operator_id = get_user_operator_id(auth.uid()))
WITH CHECK (operator_id = get_user_operator_id(auth.uid()));

-- 5. Fix is_conversation_participant to use operator ID correctly
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conversation_id
    AND (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'gestor'))
      OR c.participant_id = get_user_collaborator_id(_user_id)
      OR c.participant_id = get_user_operator_id(_user_id)
    )
  )
$$;
