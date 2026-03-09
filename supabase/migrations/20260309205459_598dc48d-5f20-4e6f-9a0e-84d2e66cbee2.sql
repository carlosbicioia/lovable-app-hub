
CREATE OR REPLACE FUNCTION public.sync_collaborator_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _collab_id text;
BEGIN
  -- Handle old collaborator (DELETE or collaborator changed)
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.collaborator_id IS DISTINCT FROM NEW.collaborator_id) THEN
    _collab_id := OLD.collaborator_id;
    IF _collab_id IS NOT NULL THEN
      UPDATE public.collaborators SET
        active_services = (
          SELECT count(*) FROM public.services
          WHERE collaborator_id = _collab_id AND status NOT IN ('Finalizado', 'Liquidado')
        ),
        total_clients = (
          SELECT count(DISTINCT client_id) FROM public.services
          WHERE collaborator_id = _collab_id
        )
      WHERE id = _collab_id;
    END IF;
  END IF;

  -- Handle new/current collaborator (INSERT or UPDATE)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    _collab_id := NEW.collaborator_id;
    IF _collab_id IS NOT NULL THEN
      UPDATE public.collaborators SET
        active_services = (
          SELECT count(*) FROM public.services
          WHERE collaborator_id = _collab_id AND status NOT IN ('Finalizado', 'Liquidado')
        ),
        total_clients = (
          SELECT count(DISTINCT client_id) FROM public.services
          WHERE collaborator_id = _collab_id
        )
      WHERE id = _collab_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_collaborator_stats
AFTER INSERT OR UPDATE OR DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.sync_collaborator_stats();
