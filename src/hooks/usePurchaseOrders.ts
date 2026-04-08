import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PurchaseOrderStatus = "Borrador" | "Enviada" | "Recogida";

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  articleName: string;
  description: string;
  units: number;
  costPrice: number;
  taxRate: number;
  sortOrder: number;
}

export interface PurchaseOrder {
  id: string;
  serviceId: string;
  supplierId: string | null;
  supplierName: string;
  operatorId: string | null;
  operatorName: string | null;
  status: PurchaseOrderStatus;
  notes: string;
  totalCost: number;
  pdfPath: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lines: PurchaseOrderLine[];
}

function mapRow(row: any, lines: any[]): PurchaseOrder {
  return {
    id: row.id,
    serviceId: row.service_id,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    status: row.status as PurchaseOrderStatus,
    notes: row.notes ?? "",
    totalCost: Number(row.total_cost ?? 0),
    pdfPath: row.pdf_path,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: lines
      .filter((l: any) => l.purchase_order_id === row.id)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((l: any) => ({
        id: l.id,
        purchaseOrderId: l.purchase_order_id,
        articleName: l.article_name ?? "",
        description: l.description ?? "",
        units: Number(l.units),
        costPrice: Number(l.cost_price),
        taxRate: Number(l.tax_rate ?? 21),
        sortOrder: l.sort_order,
      })),
  };
}

export function usePurchaseOrders(serviceId?: string) {
  return useQuery({
    queryKey: ["purchase_orders", serviceId ?? "all"],
    staleTime: 2 * 60_000,
    queryFn: async () => {
      let q = supabase.from("purchase_orders").select("*").order("created_at", { ascending: false });
      if (serviceId) q = q.eq("service_id", serviceId);
      const { data: rows, error: e1 } = await q;
      if (e1) throw e1;

      const ids = (rows ?? []).map((r: any) => r.id);
      let allLines: any[] = [];
      if (ids.length > 0) {
        const { data: lines, error: e2 } = await supabase
          .from("purchase_order_lines")
          .select("*")
          .in("purchase_order_id", ids);
        if (e2) throw e2;
        allLines = lines ?? [];
      }
      return (rows ?? []).map((r: any) => mapRow(r, allLines));
    },
  });
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["purchase_orders", id],
    enabled: !!id,
    queryFn: async () => {
      const [{ data: row, error: e1 }, { data: lines, error: e2 }] = await Promise.all([
        supabase.from("purchase_orders").select("*").eq("id", id!).single(),
        supabase.from("purchase_order_lines").select("*").eq("purchase_order_id", id!),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return mapRow(row, lines ?? []);
    },
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      serviceId: string;
      supplierId?: string | null;
      supplierName: string;
      operatorId?: string | null;
      operatorName?: string | null;
      notes?: string;
      status?: PurchaseOrderStatus;
      lines: { articleName?: string; description?: string; units: number; costPrice: number; taxRate?: number }[];
    }) => {
      const totalCost = input.lines.reduce((sum, l) => sum + l.units * l.costPrice, 0);

      const { error: e1 } = await supabase.from("purchase_orders").insert({
        id: input.id,
        service_id: input.serviceId,
        supplier_id: input.supplierId ?? null,
        supplier_name: input.supplierName,
        operator_id: input.operatorId ?? null,
        operator_name: input.operatorName ?? null,
        notes: input.notes ?? "",
        total_cost: totalCost,
        status: input.status ?? "Borrador",
      });
      if (e1) throw e1;

      if (input.lines.length > 0) {
        const { error: e2 } = await supabase.from("purchase_order_lines").insert(
          input.lines.map((l, i) => ({
            purchase_order_id: input.id,
            article_name: l.articleName ?? "",
            description: l.description ?? "",
            units: l.units,
            cost_price: l.costPrice,
            tax_rate: l.taxRate ?? 21,
            sort_order: i,
          }))
        );
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast({ title: "Orden de compra creada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdatePurchaseOrderStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PurchaseOrderStatus }) => {
      const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast({ title: "Estado actualizado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdatePurchaseOrderPdf() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, pdfPath }: { id: string; pdfPath: string | null }) => {
      const { error } = await supabase.from("purchase_orders").update({ pdf_path: pdfPath }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast({ title: "PDF actualizado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdatePurchaseOrderLines() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ orderId, lines }: {
      orderId: string;
      lines: { articleName: string; description: string; units: number; costPrice: number; taxRate: number }[];
    }) => {
      await supabase.from("purchase_order_lines").delete().eq("purchase_order_id", orderId);
      if (lines.length > 0) {
        const { error } = await supabase.from("purchase_order_lines").insert(
          lines.map((l, i) => ({
            purchase_order_id: orderId,
            article_name: l.articleName,
            description: l.description,
            units: l.units,
            cost_price: l.costPrice,
            tax_rate: l.taxRate,
            sort_order: i,
          }))
        );
        if (error) throw error;
      }
      const totalCost = lines.reduce((s, l) => s + l.units * l.costPrice, 0);
      const { error: e2 } = await supabase.from("purchase_orders").update({ total_cost: totalCost }).eq("id", orderId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast({ title: "Líneas actualizadas" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useNextPurchaseOrderId() {
  return useQuery({
    queryKey: ["purchase_orders", "next_id"],
    queryFn: async () => {
      const [{ data: orders, error }, { data: settings }] = await Promise.all([
        supabase.from("purchase_orders").select("id").order("created_at", { ascending: false }).limit(1),
        supabase.from("company_settings").select("purchase_order_prefix").limit(1).single(),
      ]);
      if (error) throw error;
      const prefix = (settings as any)?.purchase_order_prefix || "OC-";
      if (!orders || orders.length === 0) return `${prefix}001`;
      const lastNum = parseInt(orders[0].id.replace(/\D/g, ""), 10) || 0;
      return `${prefix}${String(lastNum + 1).padStart(3, "0")}`;
    },
  });
}
