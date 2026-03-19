
CREATE OR REPLACE FUNCTION public.cascade_delete_service_documents()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete protocol checks
  DELETE FROM public.protocol_checks WHERE service_id = OLD.id;

  -- Delete service media
  DELETE FROM public.service_media WHERE service_id = OLD.id;

  -- Delete service operators
  DELETE FROM public.service_operators WHERE service_id = OLD.id;

  -- Delete service audit log
  DELETE FROM public.service_audit_log WHERE service_id = OLD.id;

  -- Delete service timeline events
  DELETE FROM public.service_timeline_events WHERE service_id = OLD.id;

  -- Delete service notes history
  DELETE FROM public.service_notes_history WHERE service_id = OLD.id;

  -- Delete service materials used
  DELETE FROM public.service_materials_used WHERE service_id = OLD.id;

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

  -- Delete sales order lines, then sales orders
  DELETE FROM public.sales_order_lines WHERE sales_order_id IN (
    SELECT id FROM public.sales_orders WHERE service_id = OLD.id
  );
  DELETE FROM public.sales_orders WHERE service_id = OLD.id;

  -- Delete budget lines, then budgets
  DELETE FROM public.budget_lines WHERE budget_id IN (
    SELECT id FROM public.budgets WHERE service_id = OLD.id
  );
  DELETE FROM public.budgets WHERE service_id = OLD.id;

  -- Delete time records
  DELETE FROM public.time_records WHERE service_id = OLD.id;

  RETURN OLD;
END;
$function$;
