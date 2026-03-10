import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Supplier {
  id: string;
  name: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  streetNumber: string;
  floor: string;
  addressExtra: string;
  city: string;
  province: string;
  contactPerson: string;
  notes: string;
  iban: string;
  paymentTerms: string;
  dueDays: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: any): Supplier {
  return {
    id: row.id,
    name: row.name,
    taxId: row.tax_id,
    phone: row.phone,
    email: row.email,
    address: row.address,
    streetNumber: row.street_number ?? "",
    floor: row.floor ?? "",
    addressExtra: row.address_extra ?? "",
    city: row.city,
    province: row.province,
    contactPerson: row.contact_person,
    notes: row.notes,
    iban: row.iban,
    paymentTerms: row.payment_terms,
    dueDays: row.due_days,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => {
      const { error } = await supabase.from("suppliers").insert({
        name: input.name,
        tax_id: input.taxId,
        phone: input.phone,
        email: input.email,
        address: input.address,
        street_number: input.streetNumber,
        floor: input.floor,
        address_extra: input.addressExtra,
        city: input.city,
        province: input.province,
        contact_person: input.contactPerson,
        notes: input.notes,
        iban: input.iban,
        payment_terms: input.paymentTerms,
        due_days: input.dueDays,
        active: input.active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Proveedor creado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Supplier> & { id: string }) => {
      const updates: Record<string, any> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.taxId !== undefined) updates.tax_id = input.taxId;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.email !== undefined) updates.email = input.email;
      if (input.address !== undefined) updates.address = input.address;
      if (input.streetNumber !== undefined) updates.street_number = input.streetNumber;
      if (input.floor !== undefined) updates.floor = input.floor;
      if (input.addressExtra !== undefined) updates.address_extra = input.addressExtra;
      if (input.city !== undefined) updates.city = input.city;
      if (input.province !== undefined) updates.province = input.province;
      if (input.contactPerson !== undefined) updates.contact_person = input.contactPerson;
      if (input.notes !== undefined) updates.notes = input.notes;
      if (input.iban !== undefined) updates.iban = input.iban;
      if (input.paymentTerms !== undefined) updates.payment_terms = input.paymentTerms;
      if (input.dueDays !== undefined) updates.due_days = input.dueDays;
      if (input.active !== undefined) updates.active = input.active;
      const { error } = await supabase.from("suppliers").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Proveedor actualizado" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
