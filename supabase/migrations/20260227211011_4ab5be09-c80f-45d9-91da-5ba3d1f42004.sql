
-- Cascade delete all linked documents when a service is deleted
CREATE OR REPLACE FUNCTION public.cascade_delete_service_documents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete protocol checks
  DELETE FROM public.protocol_checks WHERE service_id = OLD.id;

  -- Delete service media
  DELETE FROM public.service_media WHERE service_id = OLD.id;

  -- Delete delivery note lines, then delivery notes
  DELETE FROM public.delivery_note_lines WHERE delivery_note_id IN (
    SELECT id FROM public.delivery_notes WHERE service_id = OLD.id
  );
  DELETE FROM public.delivery_notes WHERE service_id = OLD.id;

  -- Delete purchase order lines, then purchase orders
  DELETE FROM public.purchase_order_lines WHERE purchase_order_id IN (
    SELECT id FROM public.purchase_orders WHERE service_id = OLD.id
  );
  DELETE FROM public.purchase_orders WHERE service_id = OLD.id;

  -- Delete purchase invoice lines linked to service
  DELETE FROM public.purchase_invoice_lines WHERE service_id = OLD.id;

  -- Delete budget lines, then budgets
  DELETE FROM public.budget_lines WHERE budget_id IN (
    SELECT id FROM public.budgets WHERE service_id = OLD.id
  );
  DELETE FROM public.budgets WHERE service_id = OLD.id;

  -- Delete time records
  DELETE FROM public.time_records WHERE service_id = OLD.id;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_cascade_delete_service_documents
  BEFORE DELETE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_delete_service_documents();
