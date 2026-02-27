import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProtocolStepRow {
  id: string;
  stepId: string;
  label: string;
  description: string;
  enabled: boolean;
  sortOrder: number;
}

function mapRow(r: any): ProtocolStepRow {
  return {
    id: r.id,
    stepId: r.step_id,
    label: r.label,
    description: r.description,
    enabled: r.enabled,
    sortOrder: r.sort_order,
  };
}

export function useProtocolSteps() {
  return useQuery({
    queryKey: ["protocol_steps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocol_steps")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useEnabledProtocolSteps() {
  const query = useProtocolSteps();
  return {
    ...query,
    data: (query.data ?? []).filter((s) => s.enabled),
  };
}

export function useUpdateProtocolStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<ProtocolStepRow> & { id: string }) => {
      const updates: Record<string, any> = {};
      if (fields.label !== undefined) updates.label = fields.label;
      if (fields.description !== undefined) updates.description = fields.description;
      if (fields.enabled !== undefined) updates.enabled = fields.enabled;
      if (fields.sortOrder !== undefined) updates.sort_order = fields.sortOrder;
      const { error } = await supabase.from("protocol_steps").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protocol_steps"] }),
  });
}

export function useCreateProtocolStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { stepId: string; label: string; description: string; sortOrder: number }) => {
      const { error } = await supabase.from("protocol_steps").insert({
        step_id: input.stepId,
        label: input.label,
        description: input.description,
        sort_order: input.sortOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protocol_steps"] }),
  });
}

export function useDeleteProtocolStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("protocol_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protocol_steps"] }),
  });
}
