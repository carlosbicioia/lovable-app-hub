
CREATE OR REPLACE FUNCTION public.auto_create_protocol_checks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.protocol_checks (service_id, check_id, checked)
  SELECT NEW.id, step_id, false
  FROM public.protocol_steps
  WHERE enabled = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_protocol_checks
  AFTER INSERT ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_protocol_checks();
