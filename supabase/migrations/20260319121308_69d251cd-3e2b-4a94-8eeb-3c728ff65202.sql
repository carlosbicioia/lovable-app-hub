
-- 1. Update auto_service_status_lifecycle: remove Pte_Asignacion references
CREATE OR REPLACE FUNCTION public.auto_service_status_lifecycle()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- === FORWARD TRANSITIONS ===

  -- 1. Operator assigned on early-stage service → Asignado
  IF NEW.operator_id IS NOT NULL 
     AND (OLD.operator_id IS NULL OR OLD.operator_id IS DISTINCT FROM NEW.operator_id)
     AND NEW.status IN ('Pendiente_Contacto') THEN
    NEW.status := 'Asignado';
    NEW.contacted_at := COALESCE(NEW.contacted_at, now());
  END IF;

  -- 2. Date set on pre-scheduled service → Agendado
  IF NEW.scheduled_at IS NOT NULL 
     AND OLD.scheduled_at IS NULL 
     AND NEW.status IN ('Pendiente_Contacto', 'Asignado') THEN
    NEW.status := 'Agendado';
    NEW.contacted_at := COALESCE(NEW.contacted_at, now());
  END IF;

  -- === BACKWARD TRANSITIONS ===

  -- 3. Date removed from Agendado → Asignado (if has operator) or Pendiente_Contacto
  IF NEW.scheduled_at IS NULL 
     AND OLD.scheduled_at IS NOT NULL 
     AND OLD.status = 'Agendado' 
     AND NEW.status = 'Agendado' THEN
    IF NEW.operator_id IS NOT NULL THEN
      NEW.status := 'Asignado';
    ELSE
      NEW.status := 'Pendiente_Contacto';
    END IF;
  END IF;

  -- 4. Operator removed from Asignado (no date) → Pendiente_Contacto
  IF NEW.operator_id IS NULL 
     AND OLD.operator_id IS NOT NULL 
     AND OLD.status = 'Asignado'
     AND NEW.status = 'Asignado'
     AND NEW.scheduled_at IS NULL THEN
    NEW.status := 'Pendiente_Contacto';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Create trigger on protocol_checks to auto-advance service status
-- When 'servicio_aceptado' is checked → Pte_Aceptacion → Pendiente_Contacto
-- When 'contact' is checked → ensure contacted_at is set
CREATE OR REPLACE FUNCTION public.auto_advance_status_on_protocol()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only act when a check is being marked as checked (false → true)
  IF NEW.checked = true AND (OLD.checked IS DISTINCT FROM true) THEN

    -- Protocol step "servicio_aceptado" checked → advance from Pte_Aceptacion to Pendiente_Contacto
    IF NEW.check_id = 'servicio_aceptado' THEN
      UPDATE public.services
      SET status = 'Pendiente_Contacto', updated_at = now()
      WHERE id = NEW.service_id
        AND status = 'Pte_Aceptacion';
    END IF;

    -- Protocol step "contact" (SLA) checked → set contacted_at if not already set
    IF NEW.check_id = 'contact' THEN
      UPDATE public.services
      SET contacted_at = COALESCE(contacted_at, now()), updated_at = now()
      WHERE id = NEW.service_id
        AND contacted_at IS NULL;
    END IF;

  END IF;

  -- Reverse: if unchecking servicio_aceptado, revert to Pte_Aceptacion
  IF NEW.checked = false AND OLD.checked = true AND NEW.check_id = 'servicio_aceptado' THEN
    UPDATE public.services
    SET status = 'Pte_Aceptacion', updated_at = now()
    WHERE id = NEW.service_id
      AND status = 'Pendiente_Contacto'
      -- Only revert if no further progress (no operator, no date)
      AND operator_id IS NULL
      AND scheduled_at IS NULL;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_protocol_status_advance ON public.protocol_checks;
CREATE TRIGGER trg_protocol_status_advance
  AFTER UPDATE ON public.protocol_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_advance_status_on_protocol();

-- Also update default status for new services to Pte_Aceptacion
ALTER TABLE public.services ALTER COLUMN status SET DEFAULT 'Pte_Aceptacion';
