
CREATE OR REPLACE FUNCTION public.auto_schedule_on_date_set()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- When scheduled_at is set on a Pendiente_Contacto service, move to Agendado
  IF NEW.scheduled_at IS NOT NULL 
     AND OLD.scheduled_at IS NULL 
     AND NEW.status = 'Pendiente_Contacto' THEN
    NEW.status := 'Agendado';
    NEW.contacted_at := COALESCE(NEW.contacted_at, now());
  END IF;

  -- When scheduled_at is removed from an Agendado service, revert to Pendiente_Contacto
  IF NEW.scheduled_at IS NULL 
     AND OLD.scheduled_at IS NOT NULL 
     AND OLD.status = 'Agendado' 
     AND NEW.status = 'Agendado' THEN
    NEW.status := 'Pendiente_Contacto';
  END IF;

  RETURN NEW;
END;
$function$;
