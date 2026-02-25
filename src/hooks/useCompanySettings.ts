import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CompanySettings {
  id: string;
  company_name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string | null;
  sla_first_contact_hours: number;
  sla_resolution_hours: number;
  default_vat: number;
  currency: string;
  budget_prefix: string;
  budget_next_number: number;
  budget_validity_days: number;
  date_format: string;
  legal_conditions: string;
  document_footer: string;
  service_prefix: string;
  invoice_prefix: string;
  theme: string;
  language: string;
  timezone: string;
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as CompanySettings;
    },
  });
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<CompanySettings>) => {
      // Get the existing row id first
      const { data: existing } = await supabase
        .from("company_settings")
        .select("id")
        .limit(1)
        .single();
      if (!existing) throw new Error("No settings found");
      const { error } = await supabase
        .from("company_settings")
        .update(updates)
        .eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company_settings"] });
      toast.success("Configuración guardada correctamente");
    },
    onError: () => {
      toast.error("Error al guardar la configuración");
    },
  });
}
