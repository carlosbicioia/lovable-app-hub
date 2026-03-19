import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useProtocolChecks(serviceId: string) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChecks = async () => {
      const { data } = await supabase
        .from("protocol_checks")
        .select("check_id, checked")
        .eq("service_id", serviceId);

      if (data) {
        setCheckedItems(new Set(data.filter((r) => r.checked).map((r) => r.check_id)));
      }
      setLoading(false);
    };

    fetchChecks();

    const channel = supabase
      .channel(`protocol-${serviceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "protocol_checks", filter: `service_id=eq.${serviceId}` },
        (payload: any) => {
          const row = payload.new as { check_id: string; checked: boolean } | undefined;
          if (!row) return;
          setCheckedItems((prev) => {
            const next = new Set(prev);
            if (row.checked) next.add(row.check_id);
            else next.delete(row.check_id);
            return next;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [serviceId]);

  const toggleItem = useCallback(async (checkId: string) => {
    const isCurrentlyChecked = checkedItems.has(checkId);
    const newChecked = !isCurrentlyChecked;

    // Optimistic update
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (newChecked) next.add(checkId);
      else next.delete(checkId);
      return next;
    });

    await supabase.from("protocol_checks").upsert(
      {
        service_id: serviceId,
        check_id: checkId,
        checked: newChecked,
        checked_at: newChecked ? new Date().toISOString() : null,
      },
      { onConflict: "service_id,check_id" }
    );
  }, [serviceId, checkedItems]);

  /** Set a check to a specific value (not toggle). Avoids race conditions in auto-sync. */
  const setItem = useCallback(async (checkId: string, checked: boolean) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (checked) next.add(checkId);
      else next.delete(checkId);
      return next;
    });

    await supabase.from("protocol_checks").upsert(
      {
        service_id: serviceId,
        check_id: checkId,
        checked,
        checked_at: checked ? new Date().toISOString() : null,
      },
      { onConflict: "service_id,check_id" }
    );
  }, [serviceId]);

  return { checkedItems, toggleItem, setItem, loading };
}
