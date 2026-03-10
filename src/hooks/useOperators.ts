import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbOperator {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  dni: string;
  email: string;
  phone: string;
  address: string;
  streetNumber: string;
  floor: string;
  addressExtra: string;
  city: string;
  province: string;
  photo: string;
  specialty: string;
  secondarySpecialty: string | null;
  clusterId: string;
  clusterIds: string[];
  status: string;
  available: boolean;
  npsMean: number;
  totalRevenue: number;
  completedServices: number;
  activeServices: number;
  color: string;
  hireDate: string | null;
  vehiclePlate: string | null;
  certifications: string[];
  avgResponseTime: number;
  lastServiceDate: string | null;
  branchId: string | null;
  monthlyRevenue: { month: string; revenue: number; services: number }[];
}

function mapRow(r: any, monthlyRevenue: any[]): DbOperator {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    name: r.name,
    dni: r.dni,
    email: r.email,
    phone: r.phone,
    address: r.address,
    city: r.city,
    province: r.province,
    photo: r.photo,
    specialty: r.specialty,
    secondarySpecialty: r.secondary_specialty,
    clusterId: r.cluster_id,
    clusterIds: r.cluster_ids ?? [],
    status: r.status,
    available: r.available,
    npsMean: Number(r.nps_mean),
    totalRevenue: Number(r.total_revenue),
    completedServices: r.completed_services,
    activeServices: r.active_services,
    color: r.color,
    hireDate: r.hire_date,
    vehiclePlate: r.vehicle_plate,
    certifications: r.certifications ?? [],
    avgResponseTime: Number(r.avg_response_time),
    lastServiceDate: r.last_service_date,
    branchId: r.branch_id ?? null,
    monthlyRevenue: monthlyRevenue
      .filter((m: any) => m.operator_id === r.id)
      .sort((a: any, b: any) => a.month.localeCompare(b.month))
      .map((m: any) => ({ month: m.month, revenue: Number(m.revenue), services: m.services })),
  };
}

export function useOperators() {
  return useQuery({
    queryKey: ["operators"],
    queryFn: async () => {
      const [{ data: rows, error: e1 }, { data: monthly, error: e2 }] = await Promise.all([
        supabase.from("operators").select("*").order("name"),
        supabase.from("operator_monthly_revenue").select("*"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return (rows ?? []).map((r: any) => mapRow(r, monthly ?? []));
    },
  });
}
