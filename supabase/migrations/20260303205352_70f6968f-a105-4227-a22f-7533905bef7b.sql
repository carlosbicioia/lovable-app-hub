
-- Trigger to sync claim_status when service status changes
CREATE OR REPLACE FUNCTION public.sync_claim_status_with_service_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- When service is finalized or settled, close the claim
  IF NEW.status IN ('Finalizado', 'Liquidado') AND OLD.status NOT IN ('Finalizado', 'Liquidado') THEN
    NEW.claim_status := 'Cerrado';
  END IF;

  -- When service goes back to active states from finalized, reopen the claim
  IF NEW.status NOT IN ('Finalizado', 'Liquidado') AND OLD.status IN ('Finalizado', 'Liquidado') THEN
    NEW.claim_status := 'Abierto';
  END IF;

  -- When claim is closed, finalize the service if not already
  IF NEW.claim_status = 'Cerrado' AND OLD.claim_status != 'Cerrado' AND NEW.status NOT IN ('Finalizado', 'Liquidado') THEN
    NEW.status := 'Finalizado';
  END IF;

  -- When claim is reopened, revert service if it was auto-finalized
  IF NEW.claim_status != 'Cerrado' AND OLD.claim_status = 'Cerrado' AND NEW.status IN ('Finalizado', 'Liquidado') THEN
    NEW.status := 'En_Curso';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_claim_and_service_status
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_claim_status_with_service_status();
