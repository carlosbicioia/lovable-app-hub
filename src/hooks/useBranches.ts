import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
  email: string;
  manager_name: string;
  cluster_ids: string[];
  logo_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Branch[];
    },
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (branch: Omit<Branch, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("branches").insert(branch);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Sede creada correctamente");
    },
    onError: () => toast.error("Error al crear la sede"),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Branch> & { id: string }) => {
      const { error } = await supabase.from("branches").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Sede actualizada");
    },
    onError: () => toast.error("Error al actualizar la sede"),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Sede eliminada");
    },
    onError: () => toast.error("Error al eliminar la sede. Puede tener registros vinculados."),
  });
}
