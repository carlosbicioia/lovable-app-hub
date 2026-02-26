
CREATE OR REPLACE FUNCTION public.auto_schedule_on_date_set()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.scheduled_at IS NOT NULL 
     AND OLD.scheduled_at IS NULL 
     AND NEW.status = 'Pendiente_Contacto' THEN
    NEW.status := 'Agendado';
    NEW.contacted_at := COALESCE(NEW.contacted_at, now());
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_auto_schedule_on_date_set
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_schedule_on_date_set();
