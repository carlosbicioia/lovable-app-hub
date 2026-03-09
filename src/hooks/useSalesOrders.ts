import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SalesOrderLine {
  id: string;
  concept: string;
  description: string | null;
  units: number;
  costPrice: number;
  margin: number;
  taxRate: number;
  sortOrder: number;
}

export interface SalesOrder {
  id: string;
  budgetId: string;
  serviceId: string;
  clientName: string;
  clientAddress: string;
  collaboratorName: string | null;
  status: "Pendiente" | "Liquidada";
  sentToHolded: boolean;
  sentToHoldedAt: string | null;
  holdedDocId: string | null;
  total: number;
  notes: string;
  createdAt: string;
  lines: SalesOrderLine[];
}

function mapRow(row: any, lines: any[]): SalesOrder {
  return {
    id: row.id,
    budgetId: row.budget_id,
    serviceId: row.service_id,
    clientName: row.client_name,
    clientAddress: row.client_address,
    collaboratorName: row.collaborator_name,
    status: row.status as SalesOrder["status"],
    sentToHolded: row.sent_to_holded,
    sentToHoldedAt: row.sent_to_holded_at,
    holdedDocId: row.holded_doc_id,
    total: Number(row.total),
    notes: row.notes,
    createdAt: row.created_at,
    lines: lines
      .filter((l: any) => l.sales_order_id === row.id)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((l: any) => ({
        id: l.id,
        concept: l.concept,
        description: l.description,
        units: Number(l.units),
        costPrice: Number(l.cost_price),
        margin: Number(l.margin),
        taxRate: Number(l.tax_rate),
        sortOrder: l.sort_order,
      })),
  };
}

export function useSalesOrders(serviceId?: string) {
  return useQuery({
    queryKey: ["sales_orders", serviceId ?? "all"],
    queryFn: async () => {
      let ordersQuery = supabase.from("sales_orders").select("*").order("created_at", { ascending: false });
      if (serviceId) ordersQuery = ordersQuery.eq("service_id", serviceId);
      const [{ data: rows, error: e1 }, { data: lines, error: e2 }] = await Promise.all([
        ordersQuery,
        supabase.from("sales_order_lines").select("*"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return (rows ?? []).map((r: any) => mapRow(r, lines ?? []));
    },
  });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      budgetId: string;
      serviceId: string;
      clientName: string;
      clientAddress: string;
      collaboratorName: string | null;
      total: number;
      lines: { concept: string; description: string | null; units: number; costPrice: number; margin: number; taxRate: number; sortOrder: number }[];
    }) => {
      const { lines, ...order } = payload;
      const { error: e1 } = await supabase.from("sales_orders").insert({
        id: order.id,
        budget_id: order.budgetId,
        service_id: order.serviceId,
        client_name: order.clientName,
        client_address: order.clientAddress,
        collaborator_name: order.collaboratorName,
        total: order.total,
        status: "Pendiente",
      });
      if (e1) throw e1;

      if (lines.length > 0) {
        const { error: e2 } = await supabase.from("sales_order_lines").insert(
          lines.map((l, i) => ({
            sales_order_id: order.id,
            concept: l.concept,
            description: l.description,
            units: l.units,
            cost_price: l.costPrice,
            margin: l.margin,
            tax_rate: l.taxRate,
            sort_order: i,
          }))
        );
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales_orders"] });
    },
  });
}

export function useUpdateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from("sales_orders").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales_orders"] });
    },
  });
}
