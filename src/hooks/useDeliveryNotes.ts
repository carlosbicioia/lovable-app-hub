import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type DeliveryNoteStatus = "Pendiente" | "Validado";

export interface DeliveryNoteLine {
  id: string;
  deliveryNoteId: string;
  articleName: string;
  description: string;
  units: number;
  costPrice: number;
  sortOrder: number;
}

export interface DeliveryNote {
  id: string;
  code: string;
  serviceId: string;
  supplierId: string | null;
  supplierName: string;
  operatorId: string | null;
  operatorName: string | null;
  status: DeliveryNoteStatus;
  totalCost: number;
  pdfPath: string | null;
  notes: string;
  collectedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines: DeliveryNoteLine[];
}

function mapRow(row: any, lines: any[]): DeliveryNote {
  return {
    id: row.id,
    code: row.code ?? "",
    serviceId: row.service_id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    status: row.status as DeliveryNoteStatus,
    totalCost: Number(row.total_cost ?? 0),
    pdfPath: row.pdf_path,
    notes: row.notes ?? "",
    collectedAt: row.collected_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: lines
      .filter((l: any) => l.delivery_note_id === row.id)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((l: any) => ({
        id: l.id,
        deliveryNoteId: l.delivery_note_id,
        articleName: l.article_name ?? "",
        description: l.description ?? "",
        units: Number(l.units),
        costPrice: Number(l.cost_price),
        sortOrder: l.sort_order,
      })),
  };
}

export function useDeliveryNotes(serviceId?: string) {
  return useQuery({
    queryKey: ["delivery_notes", serviceId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("delivery_notes").select("*").order("created_at", { ascending: false });
      if (serviceId) q = q.eq("service_id", serviceId);
      const { data: rows, error: e1 } = await q;
      if (e1) throw e1;
      const ids = (rows ?? []).map((r: any) => r.id);
      let allLines: any[] = [];
      if (ids.length > 0) {
        const { data: lines, error: e2 } = await supabase.from("delivery_note_lines").select("*").in("delivery_note_id", ids);
        if (e2) throw e2;
        allLines = lines ?? [];
      }
      return (rows ?? []).map((r: any) => mapRow(r, allLines));
    },
  });
}

export function useUpdateDeliveryNotePdf() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, pdfPath }: { id: string; pdfPath: string | null }) => {
      const { error } = await supabase.from("delivery_notes").update({ pdf_path: pdfPath }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery_notes"] });
      toast({ title: "PDF actualizado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateInvoicePdf() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, pdfPath }: { id: string; pdfPath: string | null }) => {
      const { error } = await supabase.from("purchase_invoices").update({ pdf_path: pdfPath }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_invoices"] });
      toast({ title: "PDF actualizado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useCreateDeliveryNote() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      serviceId: string;
      code?: string;
      supplierId?: string | null;
      supplierName: string;
      operatorId?: string | null;
      operatorName?: string | null;
      notes?: string;
      pdfPath?: string | null;
      lines: { articleName?: string; description?: string; units: number; costPrice: number }[];
    }) => {
      const totalCost = input.lines.reduce((sum, l) => sum + l.units * l.costPrice, 0);
      const { data: row, error: e1 } = await supabase.from("delivery_notes").insert({
        service_id: input.serviceId,
        code: input.code ?? "",
        supplier_id: input.supplierId ?? null,
        supplier_name: input.supplierName,
        operator_id: input.operatorId ?? null,
        operator_name: input.operatorName ?? null,
        notes: input.notes ?? "",
        total_cost: totalCost,
        pdf_path: input.pdfPath ?? null,
        collected_at: new Date().toISOString(),
      }).select().single();
      if (e1) throw e1;

      if (input.lines.length > 0) {
        const { error: e2 } = await supabase.from("delivery_note_lines").insert(
          input.lines.map((l, i) => ({
            delivery_note_id: row.id,
            article_name: l.articleName ?? "",
            description: l.description ?? "",
            units: l.units,
            cost_price: l.costPrice,
            sort_order: i,
          }))
        );
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["delivery_notes"] });
      toast({ title: "Albarán registrado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
