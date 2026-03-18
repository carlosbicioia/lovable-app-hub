import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SpecialtyRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  active: boolean;
  sort_order: number;
}

export interface CertificationRow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  sort_order: number;
}

// ─── Specialties ───────────────────────────────────────────

export function useSpecialties() {
  return useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as SpecialtyRow[];
    },
  });
}

export function useCreateSpecialty() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { name: string; icon: string; color: string }) => {
      const { data: existing } = await supabase.from("specialties").select("sort_order").order("sort_order", { ascending: false }).limit(1);
      const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;
      const { error } = await supabase.from("specialties").insert({ ...input, sort_order: nextOrder });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specialties"] });
      toast({ title: "Especialidad creada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateSpecialty() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SpecialtyRow> & { id: string }) => {
      const { error } = await supabase.from("specialties").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["specialties"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteSpecialty() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("specialties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specialties"] });
      toast({ title: "Especialidad eliminada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ─── Certifications ────────────────────────────────────────

export function useCertifications() {
  return useQuery({
    queryKey: ["certifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as CertificationRow[];
    },
  });
}

export function useCreateCertification() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data: existing } = await supabase.from("certifications").select("sort_order").order("sort_order", { ascending: false }).limit(1);
      const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;
      const { error } = await supabase.from("certifications").insert({ ...input, sort_order: nextOrder });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certifications"] });
      toast({ title: "Certificación creada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateCertification() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CertificationRow> & { id: string }) => {
      const { error } = await supabase.from("certifications").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certifications"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteCertification() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certifications"] });
      toast({ title: "Certificación eliminada" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
