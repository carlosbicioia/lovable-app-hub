import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ServiceOriginRow {
  id: string;
  name: string;
  show_collaborator: boolean;
  is_assistance: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export function useServiceOrigins() {
  return useQuery({
    queryKey: ["service_origins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_origins")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as ServiceOriginRow[];
    },
  });
}

export function useCreateServiceOrigin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Pick<ServiceOriginRow, "name" | "show_collaborator" | "sort_order">) => {
      const { error } = await supabase.from("service_origins").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service_origins"] }); toast.success("Origen creado"); },
    onError: () => toast.error("Error al crear origen"),
  });
}

export function useUpdateServiceOrigin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceOriginRow> & { id: string }) => {
      const { error } = await supabase.from("service_origins").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service_origins"] }); toast.success("Origen actualizado"); },
    onError: () => toast.error("Error al actualizar origen"),
  });
}

export function useDeleteServiceOrigin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_origins").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["service_origins"] }); toast.success("Origen eliminado"); },
    onError: () => toast.error("Error al eliminar origen"),
  });
}
