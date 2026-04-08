import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Service, ServiceStatus, ServiceOrigin, UrgencyLevel, Specialty, ServiceType, ClaimStatus, ServiceOperatorRef } from "@/types/urbango";
import { logServiceAction } from "@/hooks/useServiceAuditLog";
import { useEffect } from "react";

/* ── Fetch helpers (paginated) ─────────────────────────── */

async function fetchAllServices(pageSize = 1000) {
  const all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("received_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function fetchAllServiceOperators(pageSize = 1000) {
  const all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("service_operators")
      .select("*")
      .order("created_at")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/* ── Mapper ────────────────────────────────────────────── */

function mapDbToService(row: any, opsMap: Map<string, ServiceOperatorRef[]>): Service {
  const ops = opsMap.get(row.id) ?? [];
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
    assistanceServiceNumber: row.assistance_service_number ?? "",
    noMediaAvailable: row.no_media_available ?? false,
    internalNotes: row.internal_notes ?? "",
    collaboratorNotes: row.collaborator_notes ?? "",
    media: [],
    internalComments: [],
    managerComments: [],
    timelineEvents: [],
    materials: [],
    createdByEmail: row.created_by_email ?? "",
    createdByName: row.created_by_name ?? "",
    managedByEmail: row.managed_by_email ?? "",
    managedByName: row.managed_by_name ?? "",
  };
}

/* ── Combined fetcher ─────────────────────────────────── */

async function fetchServicesWithOperators(): Promise<Service[]> {
  // Fire auto-start in background — don't block the main fetch
  Promise.resolve(supabase.rpc("auto_start_scheduled_services")).catch(() => {});

  const [data, soData] = await Promise.all([
    fetchAllServices(),
    fetchAllServiceOperators(),
  ]);

  const opsMap = new Map<string, ServiceOperatorRef[]>();
  for (const row of soData) {
    const arr = opsMap.get(row.service_id) ?? [];
    arr.push({ id: row.operator_id, name: row.operator_name });
    opsMap.set(row.service_id, arr);
  }

  return data.map((r) => mapDbToService(r, opsMap));
}

/* ── Query key ────────────────────────────────────────── */

const SERVICES_KEY = ["services"] as const;

/* ── Hook ──────────────────────────────────────────────── */

export function useServices() {
  const queryClient = useQueryClient();

  const { data: services = [], isLoading: loading } = useQuery({
    queryKey: SERVICES_KEY,
    queryFn: fetchServicesWithOperators,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Realtime subscription for auto-invalidation
  useEffect(() => {
    const channel = supabase
      .channel("services-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => {
        queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "service_operators" }, () => {
        queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const getService = (id: string) => services.find((s) => s.id === id);

  const refetch = () => queryClient.invalidateQueries({ queryKey: SERVICES_KEY });

  // Wrapped updateService that invalidates cache after success
  const wrappedUpdateService = async (id: string, updates: Record<string, any>) => {
    const result = await updateService(id, updates);
    if (!result.error) {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
    }
    return result;
  };

  return { services, loading, getService, updateService: wrappedUpdateService, refetch };
}

/* ── Mutation helper (used directly, not from context) ── */

export async function updateService(id: string, updates: Record<string, any>): Promise<{ error: any }> {
  const { error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", id);

  if (!error) {
    const fieldLabels: Record<string, string> = {
      status: "Estado", operator_id: "Operario", operator_name: "Operario",
      scheduled_at: "Fecha programada", scheduled_end_at: "Fin programado",
      contacted_at: "Fecha contacto", description: "Descripción",
      internal_notes: "Notas internas", collaborator_notes: "Notas colaborador",
      claim_status: "Estado reclamación", urgency: "Urgencia",
      specialty: "Especialidad", service_type: "Tipo servicio",
      budget_status: "Estado presupuesto", budget_total: "Importe presupuesto",
      nps: "NPS", real_hours: "Horas reales", diagnosis_complete: "Diagnóstico completo",
      address: "Dirección", contact_name: "Contacto", contact_phone: "Teléfono contacto",
      origin: "Origen", service_category: "Categoría",
      collaborator_id: "Colaborador", client_name: "Cliente",
      skip_sales_order_reason: "Motivo sin orden de venta",
      assistance_service_number: "Nº Servicio Asistencia",
    };
    const fields = Object.keys(updates)
      .filter(k => k !== "updated_at")
      .map(k => fieldLabels[k] || k);
    if (fields.length > 0) {
      logServiceAction(id, `Modificado: ${fields.join(", ")}`);
    }

    // Fire-and-forget Slack notification on status change
    if (updates.status) {
      supabase.functions.invoke("send-slack-notification", {
        body: {
          channel: "servicios",
          text: `🔄 Servicio *${id}* cambió de estado a *${updates.status}*`,
          event_key: "service_status_change",
        },
      }).catch(() => {});
    }
  }

  return { error };
}

/* ── Mutation hook for components that need invalidation ── */

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await updateService(id, updates);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
    },
  });
}
