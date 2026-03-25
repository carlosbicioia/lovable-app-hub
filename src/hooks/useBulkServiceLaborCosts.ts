import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Bulk-fetches labor costs for multiple Reparación Directa services.
 * Returns a map: serviceId → laborCostTotal
 */
export function useBulkServiceLaborCosts(
  services: { id: string; serviceType: string; urgency: string; origin: string }[]
) {
  const directRepairIds = services
    .filter((s) => s.serviceType === "Reparación_Directa")
    .map((s) => s.id);

  return useQuery({
    queryKey: ["bulk_service_labor_costs", directRepairIds.sort().join(",")],
    enabled: directRepairIds.length > 0,
    queryFn: async () => {
      // 1. Fetch all time records for these services
      const { data: timeRecords, error: trErr } = await supabase
        .from("time_records")
        .select("service_id, operator_id, hours")
        .in("service_id", directRepairIds);
      if (trErr) throw trErr;
      if (!timeRecords || timeRecords.length === 0) return {} as Record<string, number>;

      // Group by service → operator → hours
      const serviceOpHours: Record<string, Record<string, number>> = {};
      const allOpIds = new Set<string>();
      for (const tr of timeRecords) {
        if (!serviceOpHours[tr.service_id!]) serviceOpHours[tr.service_id!] = {};
        serviceOpHours[tr.service_id!][tr.operator_id] =
          (serviceOpHours[tr.service_id!][tr.operator_id] || 0) + Number(tr.hours);
        allOpIds.add(tr.operator_id);
      }

      // 2. Fetch operators
      const { data: operators } = await supabase
        .from("operators")
        .select("id, article_standard_hour_id, article_app_hour_id, article_urgency_hour_id")
        .in("id", Array.from(allOpIds));

      // 3. Collect article IDs
      const articleIds = new Set<string>();
      const serviceMap = Object.fromEntries(services.map((s) => [s.id, s]));
      for (const op of operators ?? []) {
        for (const svcId of Object.keys(serviceOpHours)) {
          if (!serviceOpHours[svcId][op.id]) continue;
          const svc = serviceMap[svcId];
          const artId = pickArticle(op, svc?.urgency, svc?.origin);
          if (artId) articleIds.add(artId);
        }
      }

      // 4. Fetch articles
      let articlesMap: Record<string, { cost_price: number; margin: number; category: string }> = {};
      if (articleIds.size > 0) {
        const { data: articles } = await supabase
          .from("articles")
          .select("id, cost_price, margin, category")
          .in("id", Array.from(articleIds));
        for (const a of articles ?? []) {
          articlesMap[a.id] = { cost_price: Number(a.cost_price), margin: Number(a.margin), category: a.category };
        }
      }

      // 5. Calculate per service
      const result: Record<string, number> = {};
      for (const [svcId, opMap] of Object.entries(serviceOpHours)) {
        let total = 0;
        const svc = serviceMap[svcId];
        for (const [opId, hours] of Object.entries(opMap)) {
          const op = (operators ?? []).find((o) => o.id === opId);
          const artId = op ? pickArticle(op, svc?.urgency, svc?.origin) : null;
          const article = artId ? articlesMap[artId] : null;
          let rate = 0;
          if (article) {
            rate = article.category === "Mano_de_Obra"
              ? article.cost_price * (1 + article.margin / 100)
              : article.cost_price;
          }
          total += hours * rate;
        }
        result[svcId] = Math.round(total * 100) / 100;
      }
      return result;
    },
  });
}

function pickArticle(
  op: { article_standard_hour_id: string | null; article_app_hour_id: string | null; article_urgency_hour_id: string | null },
  urgency?: string,
  origin?: string
): string | null {
  let artId: string | null = null;
  if (urgency === "Inmediato" || urgency === "24h") artId = op.article_urgency_hour_id;
  else if (origin === "App") artId = op.article_app_hour_id;
  else artId = op.article_standard_hour_id;
  return artId || op.article_standard_hour_id;
}
