import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Service, ServiceStatus, ServiceOrigin, UrgencyLevel, Specialty, ServiceType, ClaimStatus, BudgetStatus } from "@/types/urbango";

function mapDbToService(row: any): Service {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    collaboratorId: row.collaborator_id,
    collaboratorName: row.collaborator_name,
    clusterId: row.cluster_id,
    origin: row.origin as ServiceOrigin,
    status: row.status as ServiceStatus,
    urgency: row.urgency as UrgencyLevel,
    specialty: row.specialty as Specialty,
    serviceType: row.service_type as ServiceType,
    serviceCategory: row.service_category as "Correctivo" | "Plan_Preventivo",
    claimStatus: row.claim_status as ClaimStatus,
    receivedAt: row.received_at,
    contactedAt: row.contacted_at,
    scheduledAt: row.scheduled_at,
    scheduledEndAt: row.scheduled_end_at,
    diagnosisComplete: row.diagnosis_complete,
    nps: row.nps,
    budgetTotal: row.budget_total ? Number(row.budget_total) : null,
    budgetStatus: (row.budget_status as Service["budgetStatus"]) ?? null,
    description: row.description ?? "",
    address: row.address ?? "",
    realHours: row.real_hours ? Number(row.real_hours) : null,
    // These are not stored in DB yet, so defaults:
    media: [],
    internalComments: [],
    managerComments: [],
    timelineEvents: [],
    materials: [],
  };
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .order("received_at", { ascending: false });
    if (data) setServices(data.map(mapDbToService));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();

    const channel = supabase
      .channel("services-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => {
        fetchServices();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchServices]);

  const getService = useCallback(
    (id: string) => services.find((s) => s.id === id),
    [services]
  );

  const updateService = useCallback(async (id: string, updates: Partial<{
    client_id: string;
    client_name: string;
    operator_id: string | null;
    operator_name: string | null;
    collaborator_id: string | null;
    collaborator_name: string | null;
    cluster_id: string;
    origin: string;
    status: string;
    urgency: string;
    specialty: string;
    service_type: string;
    service_category: string;
    claim_status: string;
    contacted_at: string | null;
    scheduled_at: string | null;
    scheduled_end_at: string | null;
    diagnosis_complete: boolean;
    nps: number | null;
    budget_total: number | null;
    budget_status: string | null;
    description: string;
    address: string;
    real_hours: number | null;
  }>) => {
    const { error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id);
    if (!error) await fetchServices();
    return { error };
  }, [fetchServices]);

  return { services, loading, getService, updateService, refetch: fetchServices };
}
