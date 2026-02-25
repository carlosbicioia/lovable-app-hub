import type { Article } from "@/types/urbango";

export const articlesData: Article[] = [
  { id: "ART-001", title: "Tubería cobre 22mm", description: "Tubería de cobre para instalaciones de agua, por metro lineal", category: "Material", specialty: "Fontanería/Agua", costPrice: 14.25, hasKnownPvp: true, pvp: 17.95, unit: "m" },
  { id: "ART-002", title: "Codo cobre 22mm 90°", description: "Codo de cobre para unión de tuberías a 90 grados", category: "Material", specialty: "Fontanería/Agua", costPrice: 2.10, hasKnownPvp: false, pvp: null, unit: "ud" },
  { id: "ART-003", title: "Grifo monomando cocina Grohe", description: "Grifo monomando para cocina, modelo Eurosmart", category: "Material", specialty: "Fontanería/Agua", costPrice: 65.00, hasKnownPvp: true, pvp: 89.90, unit: "ud" },
  { id: "ART-004", title: "Grifo lavabo baño Grohe", description: "Grifo monomando para lavabo de baño", category: "Material", specialty: "Fontanería/Agua", costPrice: 52.00, hasKnownPvp: true, pvp: 72.50, unit: "ud" },
  { id: "ART-005", title: "Cuadro eléctrico 40 módulos", description: "Cuadro de distribución eléctrica con espacio para 40 módulos", category: "Material", specialty: "Electricidad/Luz", costPrice: 185.00, hasKnownPvp: true, pvp: 245.00, unit: "ud" },
  { id: "ART-006", title: "Diferencial 40A", description: "Interruptor diferencial 40A 30mA bipolar", category: "Material", specialty: "Electricidad/Luz", costPrice: 42.00, hasKnownPvp: true, pvp: 58.90, unit: "ud" },
  { id: "ART-007", title: "Cable 6mm² (rollo 50m)", description: "Cable eléctrico unipolar 6mm² libre de halógenos", category: "Material", specialty: "Electricidad/Luz", costPrice: 38.00, hasKnownPvp: false, pvp: null, unit: "ud" },
  { id: "ART-008", title: "Mecanismo enchufe Schuko", description: "Base enchufe Schuko empotrable con toma de tierra", category: "Material", specialty: "Electricidad/Luz", costPrice: 4.50, hasKnownPvp: false, pvp: null, unit: "ud" },
  { id: "ART-009", title: "Unidad exterior Daikin 3MXM68N", description: "Unidad exterior multi-split para 3 unidades interiores", category: "Material", specialty: "Clima", costPrice: 1200.00, hasKnownPvp: true, pvp: 1650.00, unit: "ud" },
  { id: "ART-010", title: "Unidad interior Daikin FTXM25R", description: "Unidad interior split de pared 2.5kW", category: "Material", specialty: "Clima", costPrice: 280.00, hasKnownPvp: true, pvp: 390.00, unit: "ud" },
  { id: "ART-011", title: "Hora fontanero", description: "Mano de obra oficial fontanero", category: "Mano_de_Obra", specialty: "Fontanería/Agua", costPrice: 35.00, hasKnownPvp: false, pvp: null, unit: "h" },
  { id: "ART-012", title: "Hora electricista", description: "Mano de obra oficial electricista", category: "Mano_de_Obra", specialty: "Electricidad/Luz", costPrice: 40.00, hasKnownPvp: false, pvp: null, unit: "h" },
  { id: "ART-013", title: "Hora climatización", description: "Mano de obra técnico climatización", category: "Mano_de_Obra", specialty: "Clima", costPrice: 42.00, hasKnownPvp: false, pvp: null, unit: "h" },
];

export function getArticleSalePrice(a: Pick<Article, "costPrice" | "hasKnownPvp" | "pvp">): number {
  return a.hasKnownPvp && a.pvp !== null ? a.pvp : a.costPrice * 1.30;
}

export function getArticleMargin(a: Pick<Article, "costPrice" | "hasKnownPvp" | "pvp">): number {
  const sale = getArticleSalePrice(a);
  if (a.costPrice === 0) return 0;
  return ((sale - a.costPrice) / a.costPrice) * 100;
}
