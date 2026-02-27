import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  minMonths: number;
  founderPrice: number | null;
  founderSlots: number | null;
  maxHomes: number | null;
  features: string[];
  color: string;
  active: boolean;
  sortOrder: number;
}

function mapRow(r: any): SubscriptionPlan {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    monthlyPrice: Number(r.monthly_price),
    annualPrice: Number(r.annual_price),
    minMonths: r.min_months,
    founderPrice: r.founder_price != null ? Number(r.founder_price) : null,
    founderSlots: r.founder_slots,
    maxHomes: r.max_homes,
    features: Array.isArray(r.features) ? r.features : [],
    color: r.color,
    active: r.active,
    sortOrder: r.sort_order,
  };
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans" as any)
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useCreateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<SubscriptionPlan, "id">) => {
      const { error } = await supabase.from("subscription_plans" as any).insert({
        name: input.name,
        slug: input.slug,
        description: input.description,
        monthly_price: input.monthlyPrice,
        annual_price: input.annualPrice,
        min_months: input.minMonths,
        founder_price: input.founderPrice,
        founder_slots: input.founderSlots,
        max_homes: input.maxHomes,
        features: input.features,
        color: input.color,
        active: input.active,
        sort_order: input.sortOrder,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subscription_plans"] }); toast.success("Plan creado"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<SubscriptionPlan> & { id: string }) => {
      const update: any = {};
      if (input.name !== undefined) update.name = input.name;
      if (input.slug !== undefined) update.slug = input.slug;
      if (input.description !== undefined) update.description = input.description;
      if (input.monthlyPrice !== undefined) update.monthly_price = input.monthlyPrice;
      if (input.annualPrice !== undefined) update.annual_price = input.annualPrice;
      if (input.minMonths !== undefined) update.min_months = input.minMonths;
      if (input.founderPrice !== undefined) update.founder_price = input.founderPrice;
      if (input.founderSlots !== undefined) update.founder_slots = input.founderSlots;
      if (input.maxHomes !== undefined) update.max_homes = input.maxHomes;
      if (input.features !== undefined) update.features = input.features;
      if (input.color !== undefined) update.color = input.color;
      if (input.active !== undefined) update.active = input.active;
      if (input.sortOrder !== undefined) update.sort_order = input.sortOrder;
      const { error } = await supabase.from("subscription_plans" as any).update(update).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subscription_plans"] }); toast.success("Plan actualizado"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscription_plans" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subscription_plans"] }); toast.success("Plan eliminado"); },
    onError: (e: any) => toast.error(e.message),
  });
}
