import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type InvoiceStatus = "Pendiente" | "Validada" | "Exportada";

export interface PurchaseInvoiceLine {
  id: string;
  invoiceId: string;
  serviceId: string | null;
  purchaseOrderId: string | null;
  deliveryNoteId: string | null;
  description: string;
  units: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  sortOrder: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber: string;
  supplierId: string | null;
  supplierName: string;
  invoiceDate: string | null;
  dueDate: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  pdfPath: string | null;
  notes: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines: PurchaseInvoiceLine[];
}

function mapRow(row: any, lines: any[]): PurchaseInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number ?? "",
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    subtotal: Number(row.subtotal ?? 0),
    taxRate: Number(row.tax_rate ?? 21),
    taxAmount: Number(row.tax_amount ?? 0),
    total: Number(row.total ?? 0),
    status: row.status as InvoiceStatus,
    pdfPath: row.pdf_path,
    notes: row.notes ?? "",
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: lines
      .filter((l: any) => l.invoice_id === row.id)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((l: any) => ({
        id: l.id,
        invoiceId: l.invoice_id,
        serviceId: l.service_id,
        purchaseOrderId: l.purchase_order_id,
        deliveryNoteId: l.delivery_note_id,
        description: l.description ?? "",
        units: Number(l.units),
        unitPrice: Number(l.unit_price),
        taxRate: Number(l.tax_rate),
        total: Number(l.total),
        sortOrder: l.sort_order,
      })),
  };
}

export function usePurchaseInvoices(serviceId?: string) {
  return useQuery({
    queryKey: ["purchase_invoices", serviceId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("purchase_invoices").select("*").order("created_at", { ascending: false });
      const { data: rows, error: e1 } = await q;
      if (e1) throw e1;

      const ids = (rows ?? []).map((r: any) => r.id);
      let allLines: any[] = [];
      if (ids.length > 0) {
        const { data: lines, error: e2 } = await supabase.from("purchase_invoice_lines").select("*").in("invoice_id", ids);
        if (e2) throw e2;
        allLines = lines ?? [];
      }

      let invoices = (rows ?? []).map((r: any) => mapRow(r, allLines));

      // Filter by service if needed (check lines)
      if (serviceId) {
        invoices = invoices.filter(
          (inv) => inv.lines.some((l) => l.serviceId === serviceId)
        );
      }

      return invoices;
    },
  });
}

export function useCreatePurchaseInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      invoiceNumber: string;
      supplierId?: string | null;
      supplierName: string;
      invoiceDate?: string | null;
      dueDate?: string | null;
      subtotal: number;
      taxRate: number;
      taxAmount: number;
      total: number;
      pdfPath?: string | null;
      notes?: string;
      lines: {
        serviceId?: string | null;
        purchaseOrderId?: string | null;
        deliveryNoteId?: string | null;
        description: string;
        units: number;
        unitPrice: number;
        taxRate: number;
        total: number;
      }[];
    }) => {
      const { data: row, error: e1 } = await supabase.from("purchase_invoices").insert({
        invoice_number: input.invoiceNumber,
        supplier_id: input.supplierId ?? null,
        supplier_name: input.supplierName,
        invoice_date: input.invoiceDate ?? null,
        due_date: input.dueDate ?? null,
        subtotal: input.subtotal,
        tax_rate: input.taxRate,
        tax_amount: input.taxAmount,
        total: input.total,
        pdf_path: input.pdfPath ?? null,
        notes: input.notes ?? "",
      }).select().single();
      if (e1) throw e1;

      if (input.lines.length > 0) {
        const { error: e2 } = await supabase.from("purchase_invoice_lines").insert(
          input.lines.map((l, i) => ({
            invoice_id: row.id,
            service_id: l.serviceId ?? null,
            purchase_order_id: l.purchaseOrderId ?? null,
            delivery_note_id: l.deliveryNoteId ?? null,
            description: l.description,
            units: l.units,
            unit_price: l.unitPrice,
            tax_rate: l.taxRate,
            total: l.total,
            sort_order: i,
          }))
        );
        if (e2) throw e2;
      }

      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_invoices"] });
      toast({ title: "Factura registrada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const { error } = await supabase.from("purchase_invoices").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_invoices"] });
      toast({ title: "Estado de factura actualizado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
