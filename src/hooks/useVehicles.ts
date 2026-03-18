import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  color: string;
  fuelType: string;
  vin: string;
  insuranceCompany: string;
  insurancePolicy: string;
  insuranceExpiry: string | null;
  itvExpiry: string | null;
  nextMaintenanceDate: string | null;
  lastMaintenanceDate: string | null;
  mileage: number;
  status: string;
  operatorId: string | null;
  branchId: string | null;
  photo: string;
  notes: string;
}

function mapRow(r: any): Vehicle {
  return {
    id: r.id,
    plate: r.plate,
    brand: r.brand,
    model: r.model,
    year: r.year,
    color: r.color,
    fuelType: r.fuel_type,
    vin: r.vin,
    insuranceCompany: r.insurance_company,
    insurancePolicy: r.insurance_policy,
    insuranceExpiry: r.insurance_expiry,
    itvExpiry: r.itv_expiry,
    nextMaintenanceDate: r.next_maintenance_date,
    lastMaintenanceDate: r.last_maintenance_date,
    mileage: r.mileage,
    status: r.status,
    operatorId: r.operator_id,
    branchId: r.branch_id,
    photo: r.photo,
    notes: r.notes,
  };
}

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("active", true)
        .order("plate");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: Omit<Vehicle, "id">) => {
      const { error } = await supabase.from("vehicles").insert({
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        year: v.year,
        color: v.color,
        fuel_type: v.fuelType,
        vin: v.vin,
        insurance_company: v.insuranceCompany,
        insurance_policy: v.insurancePolicy,
        insurance_expiry: v.insuranceExpiry || null,
        itv_expiry: v.itvExpiry || null,
        next_maintenance_date: v.nextMaintenanceDate || null,
        last_maintenance_date: v.lastMaintenanceDate || null,
        mileage: v.mileage,
        status: v.status,
        operator_id: v.operatorId || null,
        branch_id: v.branchId || null,
        photo: v.photo,
        notes: v.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: Vehicle) => {
      const { error } = await supabase
        .from("vehicles")
        .update({
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          year: v.year,
          color: v.color,
          fuel_type: v.fuelType,
          vin: v.vin,
          insurance_company: v.insuranceCompany,
          insurance_policy: v.insurancePolicy,
          insurance_expiry: v.insuranceExpiry || null,
          itv_expiry: v.itvExpiry || null,
          next_maintenance_date: v.nextMaintenanceDate || null,
          last_maintenance_date: v.lastMaintenanceDate || null,
          mileage: v.mileage,
          status: v.status,
          operator_id: v.operatorId || null,
          branch_id: v.branchId || null,
          photo: v.photo,
          notes: v.notes,
        })
        .eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vehicles")
        .update({ active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}
