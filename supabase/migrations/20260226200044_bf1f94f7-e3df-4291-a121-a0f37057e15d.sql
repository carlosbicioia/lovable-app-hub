
CREATE TABLE public.notification_dismissals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_id text NOT NULL,
  dismissed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

ALTER TABLE public.notification_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals"
  ON public.notification_dismissals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dismissals"
  ON public.notification_dismissals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dismissals"
  ON public.notification_dismissals
  FOR DELETE
  USING (auth.uid() = user_id);
