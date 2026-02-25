import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export function useAppUsers() {
  return useQuery({
    queryKey: ["app_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_users")
        .select("id, name, email, role, active")
        .order("created_at");
      if (error) throw error;
      return data as AppUser[];
    },
  });
}

export function useCreateAppUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: { name: string; email: string; role: string }) => {
      const { error } = await supabase.from("app_users").insert(user);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app_users"] });
      toast.success("Usuario creado");
    },
    onError: (e: any) => {
      toast.error(e.message?.includes("duplicate") ? "Email ya existe" : "Error al crear usuario");
    },
  });
}

export function useUpdateAppUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AppUser> & { id: string }) => {
      const { error } = await supabase.from("app_users").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app_users"] });
    },
    onError: () => {
      toast.error("Error al actualizar usuario");
    },
  });
}

export function useDeleteAppUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("app_users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app_users"] });
      toast.success("Usuario eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar usuario");
    },
  });
}
