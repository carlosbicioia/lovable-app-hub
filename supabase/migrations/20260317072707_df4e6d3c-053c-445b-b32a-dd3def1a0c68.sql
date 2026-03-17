
-- Security definer function to check if user is participant of a conversation
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
      -- Admin/gestor can access all
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'gestor'))
      -- Collaborator matches participant_id
      OR c.participant_id = (SELECT collaborator_id FROM public.user_roles WHERE user_id = _user_id AND role = 'colaborador' LIMIT 1)
      -- Operator matches participant_id (operator id stored in participant_id)
      OR c.participant_id IN (SELECT ur.user_id::text FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'operario')
    )
  )
$$;

-- Fix conversations SELECT: replace permissive "true" with participant check
DROP POLICY IF EXISTS "Authenticated can read conversations" ON public.conversations;

CREATE POLICY "Users can read own conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  is_admin_or_gestor(auth.uid())
  OR participant_id = get_user_collaborator_id(auth.uid())
  OR participant_id = auth.uid()::text
);

-- Fix chat_messages SELECT: only messages from user's conversations
DROP POLICY IF EXISTS "Authenticated can read chat_messages" ON public.chat_messages;

CREATE POLICY "Users can read own chat_messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  is_admin_or_gestor(auth.uid())
  OR is_conversation_participant(auth.uid(), conversation_id)
);

-- Fix chat_messages INSERT: participants can also send messages
DROP POLICY IF EXISTS "Authenticated can insert chat_messages" ON public.chat_messages;

CREATE POLICY "Participants can insert chat_messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_or_gestor(auth.uid())
  OR is_conversation_participant(auth.uid(), conversation_id)
);

-- Fix chat_messages UPDATE (mark as read): participants can update their own conversation messages
DROP POLICY IF EXISTS "Admin/Gestor can update chat_messages" ON public.chat_messages;

CREATE POLICY "Participants can update chat_messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  is_admin_or_gestor(auth.uid())
  OR is_conversation_participant(auth.uid(), conversation_id)
)
WITH CHECK (
  is_admin_or_gestor(auth.uid())
  OR is_conversation_participant(auth.uid(), conversation_id)
);
