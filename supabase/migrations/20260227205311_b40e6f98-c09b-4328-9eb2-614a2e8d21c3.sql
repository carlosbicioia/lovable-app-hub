
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  monthly_price numeric NOT NULL DEFAULT 0,
  annual_price numeric NOT NULL DEFAULT 0,
  min_months integer NOT NULL DEFAULT 12,
  founder_price numeric NULL,
  founder_slots integer NULL,
  max_homes integer NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  color text NOT NULL DEFAULT 'bg-primary/15 text-primary border-primary/30',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Gestor can modify subscription_plans" ON public.subscription_plans
  FOR ALL USING (is_admin_or_gestor(auth.uid()))
  WITH CHECK (is_admin_or_gestor(auth.uid()));

CREATE POLICY "Authenticated can read subscription_plans" ON public.subscription_plans
  FOR SELECT USING (true);
