import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimeRecord {
  id: string;
  operatorId: string;
  serviceId: string | null;
  recordDate: string;
  hours: number;
  location: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  source: string;
  createdAt: string;
}

export interface TimeRecordInput {
  operatorId: string;
  serviceId: string | null;
  recordDate: string;
  hours: number;
  location: string;
  notes: string | null;
}

export function useTimeRecords(operatorId: string) {
  return useQuery({
    queryKey: ["time_records", operatorId],
    enabled: !!operatorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_records" as any)
        .select("*")
        .eq("operator_id", operatorId)
        .order("record_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any): TimeRecord => ({
        id: r.id,
        operatorId: r.operator_id,
        serviceId: r.service_id,
        recordDate: r.record_date,
        hours: Number(r.hours),
        location: r.location,
        latitude: r.latitude != null ? Number(r.latitude) : null,
        longitude: r.longitude != null ? Number(r.longitude) : null,
        notes: r.notes,
        source: r.source,
        createdAt: r.created_at,
      }));
    },
  });
}

export function useCreateTimeRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TimeRecordInput) => {
      const { error } = await supabase.from("time_records" as any).insert({
        operator_id: input.operatorId,
        service_id: input.serviceId || null,
        record_date: input.recordDate,
        hours: input.hours,
        location: input.location,
        notes: input.notes || null,
        source: "backoffice",
      } as any);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["time_records", variables.operatorId] });
    },
  });
}

export function useDeleteTimeRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, operatorId }: { id: string; operatorId: string }) => {
      const { error } = await supabase
        .from("time_records" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return operatorId;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["time_records", variables.operatorId] });
    },
  });
}
