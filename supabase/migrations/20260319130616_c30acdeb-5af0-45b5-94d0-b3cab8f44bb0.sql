
-- Replace the trigger function so "budget" protocol check is only marked
-- when the budget status becomes Enviado or later (not on INSERT alone).
CREATE OR REPLACE FUNCTION public.auto_check_budget_protocol()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- On INSERT: only auto-check if budget is already in a sent/approved state
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('Enviado', 'Aprobado', 'Finalizado', 'Pte_Facturación') THEN
      UPDATE public.protocol_checks
      SET checked = true, checked_at = now(), updated_at = now()
      WHERE service_id = NEW.service_id AND check_id = 'budget' AND checked = false;
    END IF;
  END IF;

  -- On UPDATE: check when budget transitions to Enviado or later
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('Enviado', 'Aprobado', 'Finalizado', 'Pte_Facturación')
       AND OLD.status NOT IN ('Enviado', 'Aprobado', 'Finalizado', 'Pte_Facturación') THEN
      UPDATE public.protocol_checks
      SET checked = true, checked_at = now(), updated_at = now()
      WHERE service_id = NEW.service_id AND check_id = 'budget' AND checked = false;
    END IF;

    -- If budget reverts to Borrador, uncheck (unless service is Reparación_Directa)
    IF NEW.status = 'Borrador' AND OLD.status IN ('Enviado', 'Aprobado', 'Finalizado', 'Pte_Facturación') THEN
      IF NOT EXISTS (SELECT 1 FROM public.services WHERE id = NEW.service_id AND service_type = 'Reparación_Directa') THEN
        UPDATE public.protocol_checks
        SET checked = false, checked_at = NULL, updated_at = now()
        WHERE service_id = NEW.service_id AND check_id = 'budget' AND checked = true;
      END IF;
    END IF;
  END IF;

  -- On DELETE: uncheck if no more budgets exist (unless Reparación_Directa)
  IF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM public.budgets WHERE service_id = OLD.service_id AND id != OLD.id) THEN
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

-- Make sure trigger fires on INSERT, UPDATE, and DELETE (not just INSERT/DELETE)
DROP TRIGGER IF EXISTS auto_check_budget_protocol_trigger ON public.budgets;
CREATE TRIGGER auto_check_budget_protocol_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.auto_check_budget_protocol();

-- Fix any existing services with type Presupuesto that have budget check=true
-- but their budget is still in Borrador
UPDATE public.protocol_checks pc
SET checked = false, checked_at = NULL, updated_at = now()
WHERE pc.check_id = 'budget'
  AND pc.checked = true
  AND EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = pc.service_id
      AND s.service_type = 'Presupuesto'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.budgets b
    WHERE b.service_id = pc.service_id
      AND b.status IN ('Enviado', 'Aprobado', 'Finalizado', 'Pte_Facturación')
  );
