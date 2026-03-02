
CREATE OR REPLACE FUNCTION public.auto_schedule_on_date_set()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- When scheduled_at is set on a Pendiente_Contacto or Pte_Asignacion service, move to Agendado
  IF NEW.scheduled_at IS NOT NULL 
     AND OLD.scheduled_at IS NULL 
     AND NEW.status IN ('Pendiente_Contacto', 'Pte_Asignacion') THEN
    NEW.status := 'Agendado';
    NEW.contacted_at := COALESCE(NEW.contacted_at, now());
  END IF;

  -- When scheduled_at is removed from an Agendado service, revert to Pte_Asignacion
  IF NEW.scheduled_at IS NULL 
     AND OLD.scheduled_at IS NOT NULL 
     AND OLD.status = 'Agendado' 
     AND NEW.status = 'Agendado' THEN
    NEW.status := 'Pte_Asignacion';
  END IF;

  RETURN NEW;
END;
$function$;
