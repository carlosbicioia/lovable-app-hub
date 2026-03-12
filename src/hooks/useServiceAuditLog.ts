import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface AuditLogEntry {
  id: string;
  service_id: string;
  action: string;
  user_email: string;
  created_at: string;
}

export function useServiceAuditLog(serviceId: string | undefined) {
  const query = useQuery({
    queryKey: ["service_audit_log", serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_audit_log")
        .select("*")
        .eq("service_id", serviceId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!serviceId) return;
    const channel = supabase
      .channel(`audit-log-${serviceId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "service_audit_log",
        filter: `service_id=eq.${serviceId}`,
      }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [serviceId]);

  return query;
}

/** Insert an audit log entry for a service action */
export async function logServiceAction(serviceId: string, action: string) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("service_audit_log").insert({
    service_id: serviceId,
    action,
    user_id: user?.id ?? null,
    user_email: user?.email ?? "Sistema",
  });
}
