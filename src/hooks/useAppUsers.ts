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
    mutationFn: async (user: { name: string; email: string; role: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke("register-user", {
        body: {
          email: user.email,
          full_name: user.name,
          password: user.password,
          role: user.role,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["app_users"] });
      qc.invalidateQueries({ queryKey: ["system_users"] });
      toast.success(data?.message ?? "Usuario registrado");
      if (data?.warning) toast.warning(data.warning);
    },
    onError: (e: any) => {
      toast.error(e.message || "Error al registrar usuario");
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
