import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Service, ServiceStatus, ServiceOrigin, UrgencyLevel, Specialty, ServiceType, ClaimStatus, ServiceOperatorRef } from "@/types/urbango";

function mapDbToService(row: any, operatorsMap: Map<string, ServiceOperatorRef[]>): Service {
  const ops = operatorsMap.get(row.id) ?? [];
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    operators: ops,
    collaboratorId: row.collaborator_id,
    collaboratorName: row.collaborator_name,
    clusterId: row.cluster_id,
    branchId: row.branch_id ?? null,
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
    streetNumber: row.street_number ?? "",
    floor: row.floor ?? "",
    addressExtra: row.address_extra ?? "",
    contactName: row.contact_name ?? "",
    contactPhone: row.contact_phone ?? "",
    postalCode: row.postal_code ?? "",
    realHours: row.real_hours ? Number(row.real_hours) : null,
    signatureUrl: row.signature_url ?? null,
    signedAt: row.signed_at ?? null,
    signedBy: row.signed_by ?? null,
    internalNotes: row.internal_notes ?? "",
    collaboratorNotes: row.collaborator_notes ?? "",
    media: [],
    internalComments: [],
    managerComments: [],
    timelineEvents: [],
    materials: [],
  };
}

interface ServiceContextValue {
  services: Service[];
  loading: boolean;
  getService: (id: string) => Service | undefined;
  updateService: (id: string, updates: Record<string, any>) => Promise<{ error: any }>;
  refetch: () => Promise<void>;
}

const ServiceContext = createContext<ServiceContextValue | null>(null);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    try {
      // Auto-start scheduled services that have reached their scheduled time
      await supabase.rpc("auto_start_scheduled_services");

      const [{ data, error }, { data: soData, error: soError }] = await Promise.all([
        supabase.from("services").select("*").order("received_at", { ascending: false }),
        supabase.from("service_operators").select("*").order("created_at"),
      ]);
      if (error) {
        console.error("Error fetching services:", error);
        setLoading(false);
        return;
      }

      // Build operators map
      const opsMap = new Map<string, ServiceOperatorRef[]>();
      if (soData) {
        for (const row of soData) {
          const arr = opsMap.get(row.service_id) ?? [];
          arr.push({ id: row.operator_id, name: row.operator_name });
          opsMap.set(row.service_id, arr);
        }
      }

      if (data) setServices(data.map((r) => mapDbToService(r, opsMap)));
    } catch (err) {
      console.error("Unexpected error fetching services:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();

    const channel = supabase
      .channel("services-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => {
        fetchServices();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "service_operators" }, () => {
        fetchServices();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchServices]);

  const getService = useCallback(
    (id: string) => services.find((s) => s.id === id),
    [services]
  );

  const updateService = useCallback(async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id);
    if (!error) await fetchServices();
    return { error };
  }, [fetchServices]);

  return (
    <ServiceContext.Provider value={{ services, loading, getService, updateService, refetch: fetchServices }}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error("useServices must be used within ServiceProvider");
  return ctx;
}
