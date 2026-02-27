import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Fetch protocol check status for multiple services at once */
export function useBatchProtocolChecks(serviceIds: string[]) {
  const [data, setData] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceIds.length === 0) {
      setData({});
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data: rows } = await supabase
        .from("protocol_checks")
        .select("service_id, check_id, checked")
        .in("service_id", serviceIds);

      const map: Record<string, Set<string>> = {};
      for (const id of serviceIds) map[id] = new Set();
      for (const r of rows ?? []) {
        if (r.checked) {
          if (!map[r.service_id]) map[r.service_id] = new Set();
          map[r.service_id].add(r.check_id);
        }
      }
      setData(map);
      setLoading(false);
    };

    fetch();
  }, [serviceIds.join(",")]);

  const toggle = useCallback(async (serviceId: string, checkId: string) => {
    const current = data[serviceId] ?? new Set();
    const isChecked = current.has(checkId);
    const newChecked = !isChecked;

    // Optimistic update
    setData((prev) => {
      const next = { ...prev };
      const set = new Set(next[serviceId] ?? []);
      if (newChecked) set.add(checkId);
      else set.delete(checkId);
      next[serviceId] = set;
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
  }, [data]);

  return { data, loading, toggle };
}
