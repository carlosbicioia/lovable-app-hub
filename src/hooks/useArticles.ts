import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Article } from "@/types/urbango";

function mapRow(r: any): Article {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    specialty: r.specialty,
    costPrice: Number(r.cost_price),
    hasKnownPvp: r.has_known_pvp,
    pvp: r.pvp !== null ? Number(r.pvp) : null,
    unit: r.unit,
    margin: Number(r.margin ?? 0),
  };
}

export function useArticles() {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (article: Omit<Article, "id"> & { id?: string }) => {
      // Generate next ID
      let id = article.id;
      if (!id) {
        const { data: existing } = await supabase
          .from("articles")
          .select("id")
          .order("id", { ascending: false })
          .limit(1);
        const lastNum = existing?.[0]?.id
          ? parseInt(existing[0].id.replace("ART-", ""), 10)
          : 0;
        id = `ART-${String(lastNum + 1).padStart(3, "0")}`;
      }
      const { error } = await supabase.from("articles").insert({
        id,
        title: article.title,
        description: article.description,
        category: article.category,
        specialty: article.specialty,
        cost_price: article.costPrice,
        has_known_pvp: article.hasKnownPvp,
        pvp: article.pvp,
        unit: article.unit,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (article: Article) => {
      const { error } = await supabase
        .from("articles")
        .update({
          title: article.title,
          description: article.description,
          category: article.category,
          specialty: article.specialty,
          cost_price: article.costPrice,
          has_known_pvp: article.hasKnownPvp,
          pvp: article.pvp,
          unit: article.unit,
        })
        .eq("id", article.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("articles")
        .update({ active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["articles"] }),
  });
}

export function getArticleSalePrice(a: Pick<Article, "costPrice" | "hasKnownPvp" | "pvp"> & { category?: string }): number {
  // Labor articles: costPrice IS the sale price (no margin applied)
  if (a.category === "Mano_de_Obra") return a.costPrice;
  return a.hasKnownPvp && a.pvp !== null ? a.pvp : a.costPrice * 1.30;
}

export function getArticleMargin(a: Pick<Article, "costPrice" | "hasKnownPvp" | "pvp"> & { category?: string }): number {
  // Labor articles have no margin (costPrice = sale price)
  if (a.category === "Mano_de_Obra") return 0;
  const sale = getArticleSalePrice(a);
  if (a.costPrice === 0) return 0;
  return ((sale - a.costPrice) / a.costPrice) * 100;
}
