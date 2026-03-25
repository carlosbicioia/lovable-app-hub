import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Calculates the labor cost for a service based on time records and operator article rates.
 * For Reparación Directa services, the "importe" = sum(operator_hours × operator_article_sale_price).
 * The article used depends on the service urgency/origin:
 *  - Urgency "Inmediato" or "24h" → article_urgency_hour_id
 *  - Origin "App" → article_app_hour_id
 *  - Default → article_standard_hour_id
 */
export function useServiceLaborCost(
  serviceId: string | undefined,
  opts?: { urgency?: string; origin?: string; enabled?: boolean }
) {
  return useQuery({
    queryKey: ["service_labor_cost", serviceId],
    enabled: (opts?.enabled ?? true) && !!serviceId,
    queryFn: async () => {
      // 1. Get time records grouped by operator
      const { data: timeRecords, error: trErr } = await supabase
        .from("time_records")
        .select("operator_id, hours")
        .eq("service_id", serviceId!);
      if (trErr) throw trErr;
      if (!timeRecords || timeRecords.length === 0) return { total: 0, breakdown: [] };

      // Group hours by operator
      const opHours: Record<string, number> = {};
      for (const tr of timeRecords) {
        opHours[tr.operator_id] = (opHours[tr.operator_id] || 0) + Number(tr.hours);
      }

      // 2. Get operator details with article IDs
      const opIds = Object.keys(opHours);
      const { data: operators, error: opErr } = await supabase
        .from("operators")
        .select("id, name, article_standard_hour_id, article_app_hour_id, article_urgency_hour_id")
        .in("id", opIds);
      if (opErr) throw opErr;

      // 3. Collect all article IDs needed
      const articleIds = new Set<string>();
      for (const op of operators ?? []) {
        const artId = pickArticleId(op, opts?.urgency, opts?.origin);
        if (artId) articleIds.add(artId);
      }

      // 4. Fetch articles
      let articlesMap: Record<string, { cost_price: number; margin: number; category: string }> = {};
      if (articleIds.size > 0) {
        const { data: articles, error: artErr } = await supabase
          .from("articles")
          .select("id, cost_price, margin, category")
          .in("id", Array.from(articleIds));
        if (artErr) throw artErr;
        for (const a of articles ?? []) {
          articlesMap[a.id] = { cost_price: Number(a.cost_price), margin: Number(a.margin), category: a.category };
        }
      }

      // 5. Calculate cost per operator
      const breakdown: { operatorId: string; operatorName: string; hours: number; rate: number; total: number }[] = [];
      let grandTotal = 0;

      for (const [opId, hours] of Object.entries(opHours)) {
        const op = (operators ?? []).find((o) => o.id === opId);
        const artId = op ? pickArticleId(op, opts?.urgency, opts?.origin) : null;
        const article = artId ? articlesMap[artId] : null;

        // Sale price: for labor articles, costPrice * (1 + margin/100)
        let rate = 0;
        if (article) {
          if (article.category === "Mano_de_Obra") {
            rate = article.cost_price * (1 + article.margin / 100);
          } else {
            rate = article.cost_price;
          }
        }

        const lineTotal = Math.round(hours * rate * 100) / 100;
        grandTotal += lineTotal;
        breakdown.push({
          operatorId: opId,
          operatorName: op?.name || opId,
          hours,
          rate,
          total: lineTotal,
        });
      }

      return { total: Math.round(grandTotal * 100) / 100, breakdown };
    },
  });
}

function pickArticleId(
  op: { article_standard_hour_id: string | null; article_app_hour_id: string | null; article_urgency_hour_id: string | null },
  urgency?: string,
  origin?: string
): string | null {
  let artId: string | null = null;
  if (urgency === "Inmediato" || urgency === "24h") {
    artId = op.article_urgency_hour_id;
  } else if (origin === "App") {
    artId = op.article_app_hour_id;
  } else {
    artId = op.article_standard_hour_id;
  }
  return artId || op.article_standard_hour_id;
}
