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
}

export function useSystemUsers() {
  return useQuery({
    queryKey: ["system_users"],
    queryFn: async () => {
      // Fetch profiles and user_roles in parallel
      const [{ data: profiles, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, avatar_url, created_at").order("created_at"),
        supabase.from("user_roles").select("user_id, role, collaborator_id"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const roleMap = new Map<string, { role: string; collaborator_id: string | null }>();
      (roles ?? []).forEach((r: any) => {
        roleMap.set(r.user_id, { role: r.role, collaborator_id: r.collaborator_id });
      });

      return (profiles ?? []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name || "",
        email: p.email || "",
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        role: roleMap.get(p.id)?.role ?? null,
        collaborator_id: roleMap.get(p.id)?.collaborator_id ?? null,
      })) as SystemUser[];
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
