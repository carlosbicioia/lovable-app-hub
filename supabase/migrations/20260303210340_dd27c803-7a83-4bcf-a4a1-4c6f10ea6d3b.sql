
-- Drop old trigger and function with CASCADE
DROP TRIGGER IF EXISTS trg_auto_schedule_on_date_set ON public.services;
DROP FUNCTION IF EXISTS public.auto_schedule_on_date_set() CASCADE;

-- Create comprehensive status lifecycle trigger
CREATE OR REPLACE FUNCTION public.auto_service_status_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- === FORWARD TRANSITIONS ===

  -- 1. Operator assigned on early-stage service → Asignado
  IF NEW.operator_id IS NOT NULL 
     AND (OLD.operator_id IS NULL OR OLD.operator_id IS DISTINCT FROM NEW.operator_id)
     AND NEW.status IN ('Pendiente_Contacto', 'Pte_Asignacion') THEN
    NEW.status := 'Asignado';
    NEW.contacted_at := COALESCE(NEW.contacted_at, now());
  END IF;

  -- 2. Date set on pre-scheduled service → Agendado
  IF NEW.scheduled_at IS NOT NULL 
     AND OLD.scheduled_at IS NULL 
     AND NEW.status IN ('Pendiente_Contacto', 'Pte_Asignacion', 'Asignado') THEN
    NEW.status := 'Agendado';
    NEW.contacted_at := COALESCE(NEW.contacted_at, now());
  END IF;

  -- === BACKWARD TRANSITIONS ===

  -- 3. Date removed from Agendado → Asignado (if has operator) or Pte_Asignacion
  IF NEW.scheduled_at IS NULL 
     AND OLD.scheduled_at IS NOT NULL 
     AND OLD.status = 'Agendado' 
     AND NEW.status = 'Agendado' THEN
    IF NEW.operator_id IS NOT NULL THEN
      NEW.status := 'Asignado';
    ELSE
      NEW.status := 'Pte_Asignacion';
    END IF;
  END IF;

  -- 4. Operator removed from Asignado (no date) → Pte_Asignacion
  IF NEW.operator_id IS NULL 
     AND OLD.operator_id IS NOT NULL 
     AND OLD.status = 'Asignado'
     AND NEW.status = 'Asignado'
     AND NEW.scheduled_at IS NULL THEN
    NEW.status := 'Pte_Asignacion';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER auto_service_status_lifecycle
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_service_status_lifecycle();
