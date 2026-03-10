
CREATE OR REPLACE FUNCTION public.auto_start_scheduled_services()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE services
  SET status = 'En_Curso', updated_at = now()
  WHERE status = 'Agendado'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= now();
  
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
