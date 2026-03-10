import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ServiceMaterialUsed {
  id: string;
  service_id: string;
  material: string;
  supplier_name: string;
  brand: string;
  model: string;
  purchase_date: string | null;
  notes: string;
  sort_order: number;
  created_at: string;
}

export function useServiceMaterialsUsed(serviceId?: string) {
  return useQuery({
    queryKey: ["service_materials_used", serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("service_materials_used")
        .select("*")
        .eq("service_id", serviceId)
        .order("sort_order");
      if (error) throw error;
      return data as ServiceMaterialUsed[];
    },
  });
}

export function useCreateServiceMaterial() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      service_id: string;
      material: string;
      supplier_name?: string;
      brand?: string;
      model?: string;
      purchase_date?: string | null;
      notes?: string;
    }) => {
      const { data: existing } = await (supabase as any)
        .from("service_materials_used")
        .select("sort_order")
        .eq("service_id", input.service_id)
        .order("sort_order", { ascending: false })
        .limit(1);
      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;
      const { error } = await (supabase as any)
        .from("service_materials_used")
        .insert({ ...input, sort_order: nextOrder });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["service_materials_used", vars.service_id] });
      toast({ title: "Material añadido" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateServiceMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, service_id, ...updates }: Partial<ServiceMaterialUsed> & { id: string; service_id: string }) => {
      const { error } = await (supabase as any)
        .from("service_materials_used")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return service_id;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["service_materials_used", vars.service_id] });
    },
  });
}

export function useDeleteServiceMaterial() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, service_id }: { id: string; service_id: string }) => {
      const { error } = await (supabase as any)
        .from("service_materials_used")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return service_id;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["service_materials_used", vars.service_id] });
      toast({ title: "Material eliminado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
