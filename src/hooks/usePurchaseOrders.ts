import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PurchaseOrderType = "Servicio" | "Fungible" | "Gasto_General";
export type PurchaseOrderStatus = "Borrador" | "Pendiente_Aprobación" | "Aprobada" | "Recogida" | "Conciliada";

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  supplierCode: string;
  description: string;
  units: number;
  costPrice: number;
  discountPercent: number;
  sortOrder: number;
  // Legacy fields kept for backwards compatibility
  articleName: string;
  hasKnownPvp: boolean;
  pvp: number | null;
}

export interface PurchaseOrder {
  id: string;
  type: PurchaseOrderType;
  serviceId: string | null;
  operatorId: string | null;
  operatorName: string | null;
  supplierName: string;
  status: PurchaseOrderStatus;
  isEmergency: boolean;
  authorizationCode: string | null;
  deliveryNoteUrl: string | null;
  notes: string;
  totalCost: number;
  taxTypeId: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  collectedAt: string | null;
  reconciledAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines: PurchaseOrderLine[];
}

function mapRow(row: any, lines: any[]): PurchaseOrder {
  return {
    id: row.id,
    type: row.type as PurchaseOrderType,
    serviceId: row.service_id,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    supplierName: row.supplier_name,
    status: row.status as PurchaseOrderStatus,
    isEmergency: row.is_emergency,
    authorizationCode: row.authorization_code,
    deliveryNoteUrl: row.delivery_note_url,
    notes: row.notes ?? "",
    totalCost: Number(row.total_cost ?? 0),
    taxTypeId: row.tax_type_id ?? null,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    collectedAt: row.collected_at,
    reconciledAt: row.reconciled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: lines
      .filter((l: any) => l.purchase_order_id === row.id)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((l: any) => ({
        id: l.id,
        purchaseOrderId: l.purchase_order_id,
        supplierCode: l.supplier_code ?? "",
        articleName: l.article_name ?? "",
        description: l.description ?? "",
        units: Number(l.units),
        costPrice: Number(l.cost_price),
        discountPercent: Number(l.discount_percent ?? 0),
        hasKnownPvp: l.has_known_pvp ?? false,
        pvp: l.pvp ? Number(l.pvp) : null,
        sortOrder: l.sort_order,
      })),
  };
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async () => {
      const [{ data: rows, error: e1 }, { data: lines, error: e2 }] = await Promise.all([
        supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("purchase_order_lines").select("*"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return (rows ?? []).map((r: any) => mapRow(r, lines ?? []));
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
      type: PurchaseOrderType;
      serviceId?: string | null;
      operatorId?: string | null;
      operatorName?: string | null;
      supplierName: string;
      isEmergency?: boolean;
      notes?: string;
      status?: PurchaseOrderStatus;
      taxTypeId?: string | null;
      lines: {
        supplierCode?: string;
        articleName?: string;
        description?: string;
        units: number;
        costPrice: number;
        discountPercent?: number;
        hasKnownPvp?: boolean;
        pvp?: number | null;
      }[];
    }) => {
      const totalCost = input.lines.reduce((sum, l) => {
        const discount = l.discountPercent ?? 0;
        return sum + l.units * l.costPrice * (1 - discount / 100);
      }, 0);

      const { error: e1 } = await supabase.from("purchase_orders").insert({
        id: input.id,
        type: input.type,
        service_id: input.serviceId ?? null,
        operator_id: input.operatorId ?? null,
        operator_name: input.operatorName ?? null,
        supplier_name: input.supplierName,
        is_emergency: input.isEmergency ?? false,
        notes: input.notes ?? "",
        total_cost: totalCost,
        status: input.status ?? "Borrador",
        tax_type_id: input.taxTypeId ?? null,
        reconciled_at: input.status === "Conciliada" ? new Date().toISOString() : null,
      });
      if (e1) throw e1;

      if (input.lines.length > 0) {
        const { error: e2 } = await supabase.from("purchase_order_lines").insert(
          input.lines.map((l, i) => ({
            purchase_order_id: input.id,
            supplier_code: l.supplierCode ?? "",
            article_name: l.articleName ?? l.supplierCode ?? "",
            description: l.description ?? "",
            units: l.units,
            cost_price: l.costPrice,
            discount_percent: l.discountPercent ?? 0,
            has_known_pvp: l.hasKnownPvp ?? false,
            pvp: l.pvp ?? null,
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
    mutationFn: async ({ id, status, extra }: { id: string; status: PurchaseOrderStatus; extra?: Record<string, any> }) => {
      const updates: Record<string, any> = { status, ...extra };
      if (status === "Aprobada") updates.approved_at = new Date().toISOString();
      if (status === "Recogida") updates.collected_at = new Date().toISOString();
      if (status === "Conciliada") updates.reconciled_at = new Date().toISOString();
      const { error } = await supabase.from("purchase_orders").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast({ title: "Estado actualizado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useNextPurchaseOrderId() {
  return useQuery({
    queryKey: ["purchase_orders", "next_id"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) return "OC-001";
      const lastNum = parseInt(data[0].id.replace(/\D/g, ""), 10) || 0;
      return `OC-${String(lastNum + 1).padStart(3, "0")}`;
    },
  });
}
