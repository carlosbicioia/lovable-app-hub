
-- Auto-sync protocol checks based on service changes
-- Handles: operator (step 4), budget (step 5), servicio_realizado (step 7)
CREATE OR REPLACE FUNCTION public.auto_sync_protocol_from_service()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Step 4: "operator" — auto-check when operator assigned, uncheck when removed
  IF NEW.operator_id IS DISTINCT FROM OLD.operator_id THEN
    IF NEW.operator_id IS NOT NULL THEN
      UPDATE public.protocol_checks
      SET checked = true, checked_at = now(), updated_at = now()
      WHERE service_id = NEW.id AND check_id = 'operator' AND checked = false;
    ELSE
      UPDATE public.protocol_checks
      SET checked = false, checked_at = NULL, updated_at = now()
      WHERE service_id = NEW.id AND check_id = 'operator' AND checked = true;
    END IF;
  END IF;

  -- Step 5: "budget" — auto-check for Reparación_Directa services
  IF NEW.service_type = 'Reparación_Directa' AND OLD.service_type IS DISTINCT FROM 'Reparación_Directa' THEN
    UPDATE public.protocol_checks
    SET checked = true, checked_at = now(), updated_at = now()
    WHERE service_id = NEW.id AND check_id = 'budget' AND checked = false;
  END IF;

  -- Step 7: "servicio_realizado" — auto-check when status becomes Finalizado or Liquidado
  IF NEW.status IN ('Finalizado', 'Liquidado') AND OLD.status NOT IN ('Finalizado', 'Liquidado') THEN
    UPDATE public.protocol_checks
    SET checked = true, checked_at = now(), updated_at = now()
    WHERE service_id = NEW.id AND check_id = 'servicio_realizado' AND checked = false;
  END IF;

  -- Step 7 reverse: uncheck if reverted from Finalizado
  IF NEW.status NOT IN ('Finalizado', 'Liquidado') AND OLD.status IN ('Finalizado', 'Liquidado') THEN
    UPDATE public.protocol_checks
    SET checked = false, checked_at = NULL, updated_at = now()
    WHERE service_id = NEW.id AND check_id = 'servicio_realizado' AND checked = true;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_auto_sync_protocol_from_service ON public.services;
CREATE TRIGGER trg_auto_sync_protocol_from_service
  AFTER UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_sync_protocol_from_service();

-- Auto-check "budget" protocol step when a budget is created for a service
CREATE OR REPLACE FUNCTION public.auto_check_budget_protocol()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.protocol_checks
    SET checked = true, checked_at = now(), updated_at = now()
    WHERE service_id = NEW.service_id AND check_id = 'budget' AND checked = false;
  END IF;

  -- On delete, uncheck if no more budgets exist for this service
  IF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM public.budgets WHERE service_id = OLD.service_id AND id != OLD.id) THEN
      -- Only uncheck if service is not Reparación_Directa
      IF NOT EXISTS (SELECT 1 FROM public.services WHERE id = OLD.service_id AND service_type = 'Reparación_Directa') THEN
        UPDATE public.protocol_checks
        SET checked = false, checked_at = NULL, updated_at = now()
        WHERE service_id = OLD.service_id AND check_id = 'budget' AND checked = true;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_auto_check_budget_protocol ON public.budgets;
CREATE TRIGGER trg_auto_check_budget_protocol
  AFTER INSERT OR DELETE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_check_budget_protocol();

-- Also auto-check budget for existing Reparación_Directa services on creation
-- Update auto_create_protocol_checks to pre-check budget for Reparación_Directa
CREATE OR REPLACE FUNCTION public.auto_create_protocol_checks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.protocol_checks (service_id, check_id, checked, checked_at)
  SELECT NEW.id, step_id,
    CASE 
      WHEN step_id = 'budget' AND NEW.service_type = 'Reparación_Directa' THEN true
      ELSE false
    END,
    CASE 
      WHEN step_id = 'budget' AND NEW.service_type = 'Reparación_Directa' THEN now()
      ELSE NULL
    END
  FROM public.protocol_steps
  WHERE enabled = true;
  RETURN NEW;
END;
$function$;
