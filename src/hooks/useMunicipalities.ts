import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Municipality {
  id: string;
  province: string;
  name: string;
}

export function useMunicipalities(province: string) {
  return useQuery({
    queryKey: ["municipalities", province],
    queryFn: async () => {
      if (!province) return [];
      const { data, error } = await supabase
        .from("municipalities")
        .select("id, province, name")
        .eq("province", province)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Municipality[];
    },
    enabled: !!province,
  });
}
