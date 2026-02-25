import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Collaborator, CollaboratorCategory } from "@/types/urbango";

function mapRow(row: any): Collaborator {
  return {
    id: row.id,
    companyName: row.company_name,
    category: row.category as CollaboratorCategory,
    email: row.email,
    phone: row.phone,
    contactPerson: row.contact_person,
    npsMean: Number(row.nps_mean),
    activeServices: row.active_services,
    totalClients: row.total_clients,
  };
}

export type CollaboratorInput = {
  companyName: string;
  category: CollaboratorCategory;
  email: string;
  phone: string;
  contactPerson: string;
};

export function useCollaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("collaborators" as any)
      .select("*")
      .order("company_name");
    if (error) {
      console.error("Error fetching collaborators:", error);
      setLoading(false);
      return;
    }
    if (data) setCollaborators((data as any[]).map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (input: CollaboratorInput) => {
    // Generate next ID
    const maxNum = collaborators.reduce((max, c) => {
      const n = parseInt(c.id.replace("COL-", ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newId = `COL-${String(maxNum + 1).padStart(3, "0")}`;

    const { error } = await supabase.from("collaborators" as any).insert({
      id: newId,
      company_name: input.companyName,
      category: input.category,
      email: input.email,
      phone: input.phone,
      contact_person: input.contactPerson,
    } as any);
    if (!error) await fetch();
    return { error };
  }, [collaborators, fetch]);

  const update = useCallback(async (id: string, input: CollaboratorInput) => {
    const { error } = await supabase
      .from("collaborators" as any)
      .update({
        company_name: input.companyName,
        category: input.category,
        email: input.email,
        phone: input.phone,
        contact_person: input.contactPerson,
      } as any)
      .eq("id", id);
    if (!error) await fetch();
    return { error };
  }, [fetch]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("collaborators" as any)
      .delete()
      .eq("id", id);
    if (!error) await fetch();
    return { error };
  }, [fetch]);

  return { collaborators, loading, create, update, remove, refetch: fetch };
}
