
CREATE OR REPLACE FUNCTION public.finalize_budget_on_service_complete()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'Finalizado' AND (OLD.status IS DISTINCT FROM 'Finalizado') THEN
    UPDATE public.budgets
    SET status = 'Finalizado', updated_at = now()
    WHERE service_id = NEW.id
      AND status NOT IN ('Rechazado');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_finalize_budget_on_service_complete
  AFTER UPDATE OF status ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.finalize_budget_on_service_complete();
