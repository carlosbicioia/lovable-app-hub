
-- Update sync_operator_stats to also sync based on service_operators table
CREATE OR REPLACE FUNCTION public.sync_operator_stats_from_service_operators()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _op_id text;
BEGIN
  -- Handle old operator (DELETE or changed)
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    _op_id := OLD.operator_id;
    IF _op_id IS NOT NULL THEN
      UPDATE public.operators SET
        completed_services = (
          SELECT count(DISTINCT so2.service_id) FROM public.service_operators so2
          JOIN public.services s ON s.id = so2.service_id
          WHERE so2.operator_id = _op_id AND s.status IN ('Finalizado', 'Liquidado')
        ),
        active_services = (
          SELECT count(DISTINCT so2.service_id) FROM public.service_operators so2
          JOIN public.services s ON s.id = so2.service_id
          WHERE so2.operator_id = _op_id AND s.status IN ('Asignado', 'Agendado', 'En_Curso')
        ),
        total_revenue = COALESCE((
          SELECT sum(bl.units * bl.cost_price * (1 + bl.margin / 100.0) * (1 + bl.tax_rate / 100.0))
          FROM public.budget_lines bl
          JOIN public.budgets b ON b.id = bl.budget_id
          JOIN public.services s ON s.id = b.service_id
          JOIN public.service_operators so2 ON so2.service_id = s.id
          WHERE so2.operator_id = _op_id
            AND s.status IN ('Finalizado', 'Liquidado')
            AND b.status IN ('Aprobado', 'Finalizado', 'Pte_Facturación')
        ), 0),
        last_service_date = (
          SELECT max(s.scheduled_at::date) FROM public.services s
          JOIN public.service_operators so2 ON so2.service_id = s.id
          WHERE so2.operator_id = _op_id AND s.status IN ('Finalizado', 'Liquidado')
        )
      WHERE id = _op_id;
    END IF;
  END IF;

  -- Handle new operator (INSERT or UPDATE)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    _op_id := NEW.operator_id;
    IF _op_id IS NOT NULL THEN
      UPDATE public.operators SET
        completed_services = (
          SELECT count(DISTINCT so2.service_id) FROM public.service_operators so2
          JOIN public.services s ON s.id = so2.service_id
          WHERE so2.operator_id = _op_id AND s.status IN ('Finalizado', 'Liquidado')
        ),
        active_services = (
          SELECT count(DISTINCT so2.service_id) FROM public.service_operators so2
          JOIN public.services s ON s.id = so2.service_id
          WHERE so2.operator_id = _op_id AND s.status IN ('Asignado', 'Agendado', 'En_Curso')
        ),
        total_revenue = COALESCE((
          SELECT sum(bl.units * bl.cost_price * (1 + bl.margin / 100.0) * (1 + bl.tax_rate / 100.0))
          FROM public.budget_lines bl
          JOIN public.budgets b ON b.id = bl.budget_id
          JOIN public.services s ON s.id = b.service_id
          JOIN public.service_operators so2 ON so2.service_id = s.id
          WHERE so2.operator_id = _op_id
            AND s.status IN ('Finalizado', 'Liquidado')
            AND b.status IN ('Aprobado', 'Finalizado', 'Pte_Facturación')
        ), 0),
        last_service_date = (
          SELECT max(s.scheduled_at::date) FROM public.services s
          JOIN public.service_operators so2 ON so2.service_id = s.id
          WHERE so2.operator_id = _op_id AND s.status IN ('Finalizado', 'Liquidado')
        )
      WHERE id = _op_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger on service_operators
DROP TRIGGER IF EXISTS trg_sync_operator_stats_from_service_operators ON public.service_operators;
CREATE TRIGGER trg_sync_operator_stats_from_service_operators
  AFTER INSERT OR UPDATE OR DELETE ON public.service_operators
  FOR EACH ROW EXECUTE FUNCTION public.sync_operator_stats_from_service_operators();
