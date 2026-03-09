
CREATE OR REPLACE FUNCTION public.sync_operator_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _op_id text;
BEGIN
  -- Collect affected operator IDs (old and new)
  -- Update stats for the OLD operator (if changed or removed)
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.operator_id IS DISTINCT FROM NEW.operator_id) THEN
    _op_id := OLD.operator_id;
    IF _op_id IS NOT NULL THEN
      UPDATE public.operators SET
        completed_services = (
          SELECT count(*) FROM public.services
          WHERE operator_id = _op_id AND status IN ('Finalizado', 'Liquidado')
        ),
        active_services = (
          SELECT count(*) FROM public.services
          WHERE operator_id = _op_id AND status IN ('Asignado', 'Agendado', 'En_Curso')
        ),
        total_revenue = COALESCE((
          SELECT sum(b.total_amount) FROM public.budgets b
          JOIN public.services s ON s.id = b.service_id
          WHERE s.operator_id = _op_id
            AND s.status IN ('Finalizado', 'Liquidado')
            AND b.status IN ('Aprobado', 'Finalizado', 'Pte_Facturación')
        ), 0),
        last_service_date = (
          SELECT max(s.scheduled_at::date) FROM public.services s
          WHERE s.operator_id = _op_id AND s.status IN ('Finalizado', 'Liquidado')
        )
      WHERE id = _op_id;
    END IF;
  END IF;

  -- Update stats for the NEW/current operator
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    _op_id := NEW.operator_id;
    IF _op_id IS NOT NULL THEN
      UPDATE public.operators SET
        completed_services = (
          SELECT count(*) FROM public.services
          WHERE operator_id = _op_id AND status IN ('Finalizado', 'Liquidado')
        ),
        active_services = (
          SELECT count(*) FROM public.services
          WHERE operator_id = _op_id AND status IN ('Asignado', 'Agendado', 'En_Curso')
        ),
        total_revenue = COALESCE((
          SELECT sum(b.total_amount) FROM public.budgets b
          JOIN public.services s ON s.id = b.service_id
          WHERE s.operator_id = _op_id
            AND s.status IN ('Finalizado', 'Liquidado')
            AND b.status IN ('Aprobado', 'Finalizado', 'Pte_Facturación')
        ), 0),
        last_service_date = (
          SELECT max(s.scheduled_at::date) FROM public.services s
          WHERE s.operator_id = _op_id AND s.status IN ('Finalizado', 'Liquidado')
        )
      WHERE id = _op_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_operator_stats
AFTER INSERT OR UPDATE OF status, operator_id OR DELETE
ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.sync_operator_stats();
