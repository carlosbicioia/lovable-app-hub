import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface ServiceOperator {
  id: string;
  serviceId: string;
  operatorId: string;
  operatorName: string;
}

function mapRow(r: any): ServiceOperator {
  return {
    id: r.id,
    serviceId: r.service_id,
    operatorId: r.operator_id,
    operatorName: r.operator_name,
  };
}

export function useServiceOperators() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["service_operators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_operators")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("service-operators-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_operators" }, () => {
        queryClient.invalidateQueries({ queryKey: ["service_operators"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useSetServiceOperators() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, operators }: { serviceId: string; operators: { id: string; name: string }[] }) => {
      // Delete existing
      const { error: delError } = await supabase
        .from("service_operators")
        .delete()
        .eq("service_id", serviceId);
      if (delError) throw delError;

      // Insert new
      if (operators.length > 0) {
        const rows = operators.map((op) => ({
          service_id: serviceId,
          operator_id: op.id,
          operator_name: op.name,
        }));
        const { error: insError } = await supabase
          .from("service_operators")
          .insert(rows);
        if (insError) throw insError;
      }

      // Also update services.operator_id/operator_name for backward compat (first operator)
      const firstOp = operators[0] ?? null;
      await supabase
        .from("services")
        .update({
          operator_id: firstOp?.id ?? null,
          operator_name: firstOp?.name ?? null,
        })
        .eq("id", serviceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_operators"] });
      queryClient.invalidateQueries({ queryKey: ["operators"] });
    },
  });
}

/** Get operators for a specific service */
export function useServiceOperatorsForService(serviceId: string) {
  return useQuery({
    queryKey: ["service_operators", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_operators")
        .select("*")
        .eq("service_id", serviceId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}
