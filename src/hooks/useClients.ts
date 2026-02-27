import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DbClient {
  id: string;
  name: string;
  dni: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  clusterId: string;
  collaboratorId: string | null;
  collaboratorName: string | null;
  planType: string;
  lastServiceDate: string | null;
}

function mapRow(r: any): DbClient {
  return {
    id: r.id,
    name: r.name,
    dni: r.dni,
    email: r.email,
    phone: r.phone,
    address: r.address,
    postalCode: r.postal_code,
    city: r.city,
    province: r.province,
    clusterId: r.cluster_id,
    collaboratorId: r.collaborator_id,
    collaboratorName: r.collaborator_name,
    planType: r.plan_type,
    lastServiceDate: r.last_service_date,
  };
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: Omit<DbClient, "id"> & { id?: string }) => {
      // Generate ID if not provided
      let id = input.id;
      if (!id) {
        const { data: last } = await supabase
          .from("clients")
          .select("id")
          .ilike("id", "CLI-%")
          .order("id", { ascending: false })
          .limit(1);
        const lastNum = last?.[0] ? parseInt(last[0].id.replace(/\D/g, ""), 10) || 0 : 0;
        id = `CLI-${String(lastNum + 1).padStart(3, "0")}`;
      }
      const { error } = await supabase.from("clients").insert({
        id,
        name: input.name,
        dni: input.dni,
        email: input.email,
        phone: input.phone,
        address: input.address,
        postal_code: input.postalCode,
        city: input.city,
        province: input.province,
        cluster_id: input.clusterId,
        collaborator_id: input.collaboratorId,
        collaborator_name: input.collaboratorName,
        plan_type: input.planType,
        last_service_date: input.lastServiceDate,
      });
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "Cliente creado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
