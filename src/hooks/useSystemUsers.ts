import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SystemUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  role: string | null;
  collaborator_id: string | null;
  banned: boolean;
  /** The auth user id (from profiles) if the user has logged in */
  auth_user_id: string | null;
}

export function useSystemUsers() {
  return useQuery({
    queryKey: ["system_users"],
    queryFn: async () => {
      const [{ data: appUsers, error: e1 }, { data: profiles, error: e2 }, { data: roles, error: e3 }] = await Promise.all([
        supabase.from("app_users").select("id, name, email, role, active, created_at").order("created_at"),
        supabase.from("profiles").select("id, full_name, email, avatar_url"),
        supabase.from("user_roles").select("user_id, role, collaborator_id"),
      ]);
      if (e1) throw e1;

      // Map profiles by email for cross-reference
      const profileByEmail = new Map<string, { id: string; avatar_url: string | null }>();
      (profiles ?? []).forEach((p: any) => {
        profileByEmail.set(p.email, { id: p.id, avatar_url: p.avatar_url });
      });

      // Map roles by auth user id
      const roleMap = new Map<string, { role: string; collaborator_id: string | null }>();
      (roles ?? []).forEach((r: any) => {
        roleMap.set(r.user_id, { role: r.role, collaborator_id: r.collaborator_id });
      });

      return (appUsers ?? []).map((u: any) => {
        const profile = profileByEmail.get(u.email);
        const authRole = profile ? roleMap.get(profile.id) : null;
        return {
          id: u.id,
          full_name: u.name || "",
          email: u.email || "",
          avatar_url: profile?.avatar_url ?? null,
          created_at: u.created_at,
          role: authRole?.role ?? u.role ?? null,
          collaborator_id: authRole?.collaborator_id ?? null,
          banned: u.active === false,
          auth_user_id: profile?.id ?? null,
        };
      }) as SystemUser[];
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Check if user already has a role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role } as any)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system_users"] });
      toast.success("Rol actualizado");
    },
    onError: (e: any) => {
      toast.error(e.message || "Error al actualizar rol");
    },
  });
}

export function useManageUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, action, new_password }: { userId: string; action: "ban" | "unban" | "delete" | "reset_password"; new_password?: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-user", {
        body: { user_id: userId, action, ...(new_password ? { new_password } : {}) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["system_users"] });
      qc.invalidateQueries({ queryKey: ["app_users"] });
      toast.success(data?.message ?? "Operación completada");
    },
    onError: (e: any) => {
      toast.error(e.message || "Error al gestionar usuario");
    },
  });
}
