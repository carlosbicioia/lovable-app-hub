import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationSetting {
  id: string;
  event_key: string;
  event_label: string;
  event_description: string;
  app_enabled: boolean;
  slack_enabled: boolean;
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ["notification_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("id, event_key, event_label, event_description, app_enabled, slack_enabled")
        .order("created_at");
      if (error) throw error;
      return data as NotificationSetting[];
    },
  });
}

export function useUpdateNotificationSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; app_enabled?: boolean; slack_enabled?: boolean }) => {
      const { error } = await supabase
        .from("notification_settings")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification_settings"] });
    },
    onError: () => {
      toast.error("Error al actualizar la configuración");
    },
  });
}
