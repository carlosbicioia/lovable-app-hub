import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TaxType {
  id: string;
  name: string;
  rate: number;
  active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export function useTaxTypes() {
  return useQuery({
    queryKey: ["tax_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_types")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as TaxType[];
    },
  });
}

export function useActiveTaxTypes() {
  return useQuery({
    queryKey: ["tax_types", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tax_types")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data as TaxType[];
    },
  });
}

export function useCreateTaxType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; rate: number }) => {
      const { error } = await supabase.from("tax_types").insert({
        name: input.name,
        rate: input.rate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tax_types"] });
      toast.success("Tipo impositivo creado");
    },
    onError: () => toast.error("Error al crear tipo impositivo"),
  });
}

export function useUpdateTaxType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; rate?: number; active?: boolean; is_default?: boolean }) => {
      const { id, ...updates } = input;
      // If setting as default, unset others first
      if (updates.is_default) {
        await supabase.from("tax_types").update({ is_default: false }).neq("id", id);
      }
      const { error } = await supabase.from("tax_types").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tax_types"] });
      toast.success("Tipo impositivo actualizado");
    },
    onError: () => toast.error("Error al actualizar"),
  });
}

export function useDeleteTaxType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tax_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tax_types"] });
      toast.success("Tipo impositivo eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });
}
