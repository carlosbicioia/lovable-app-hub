import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MonthlyTarget {
  id: string;
  month: string;
  branchId: string | null;
  targetRevenue: number;
  targetServices: number;
  targetNps: number;
  targetMargin: number;
  targetMaxCosts: number;
  targetNewClients: number;
  targetAvgResponseHours: number;
  targetOperators: number;
  notes: string;
}

function mapRow(row: any): MonthlyTarget {
  return {
    id: row.id,
    month: row.month,
    branchId: row.branch_id,
    targetRevenue: Number(row.target_revenue),
    targetServices: Number(row.target_services),
    targetNps: Number(row.target_nps),
    targetMargin: Number(row.target_margin),
    targetMaxCosts: Number(row.target_max_costs),
    targetNewClients: Number(row.target_new_clients),
    targetAvgResponseHours: Number(row.target_avg_response_hours),
    targetOperators: Number(row.target_operators),
    notes: row.notes,
  };
}

export function useMonthlyTargets() {
  return useQuery({
    queryKey: ["monthly_targets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_targets")
        .select("*")
        .order("month", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useUpsertMonthlyTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (target: Omit<MonthlyTarget, "id"> & { id?: string }) => {
      const payload: any = {
        month: target.month,
        branch_id: target.branchId,
        target_revenue: target.targetRevenue,
        target_services: target.targetServices,
        target_nps: target.targetNps,
        target_margin: target.targetMargin,
        target_max_costs: target.targetMaxCosts,
        target_new_clients: target.targetNewClients,
        target_avg_response_hours: target.targetAvgResponseHours,
        target_operators: target.targetOperators,
        notes: target.notes,
      };

      if (target.id) {
        const { error } = await supabase
          .from("monthly_targets")
          .update(payload)
          .eq("id", target.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("monthly_targets")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monthly_targets"] });
      toast.success("Objetivo guardado");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar objetivo");
    },
  });
}

export function useDeleteMonthlyTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("monthly_targets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monthly_targets"] });
      toast.success("Objetivo eliminado");
    },
  });
}
