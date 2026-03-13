-- Allow collaborators to insert services (service requests)
CREATE POLICY "Collaborator can insert services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'colaborador'
  )
);

-- Allow collaborators to read services assigned to them
CREATE POLICY "Collaborator can read own services"
ON public.services
FOR SELECT
TO authenticated
USING (
  collaborator_id = (
    SELECT collaborator_id FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'colaborador'
    LIMIT 1
  )
);