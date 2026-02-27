import { useQuery } from "@tanstack/react-query";
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
