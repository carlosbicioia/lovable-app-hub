CREATE OR REPLACE FUNCTION public.auto_start_scheduled_services()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  affected integer;
BEGIN
  UPDATE services
  SET status = 'En_Curso', updated_at = now()
  WHERE status = 'Agendado'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now()
    AND (
      service_type != 'Presupuesto'
      OR EXISTS (
        SELECT 1 FROM budgets b
        WHERE b.service_id = services.id
          AND b.status = 'Aprobado'
      )
    );
  
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$