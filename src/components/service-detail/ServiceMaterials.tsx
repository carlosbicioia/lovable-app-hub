import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import type { Service } from "@/types/urbango";

interface Props {
  service: Service;
}

export default function ServiceMaterials({ service }: Props) {
  const materials = service.materials ?? [];

  if (materials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" /> Materiales y compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">Sin materiales registrados para este servicio.</p>
        </CardContent>
      </Card>
    );
  }

  const totalCost = materials.reduce((s, m) => {
    const price = m.hasKnownPvp && m.pvp !== null ? m.pvp : m.costPrice * 1.30;
    return s + price * m.units;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" /> Materiales y compras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-muted-foreground font-medium">Material</th>
              <th className="text-center py-2 text-muted-foreground font-medium">Uds.</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Coste</th>
              <th className="text-right py-2 text-muted-foreground font-medium">PVP</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => {
              const price = m.hasKnownPvp && m.pvp !== null ? m.pvp : m.costPrice * 1.30;
              return (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="py-2 text-card-foreground">
                    {m.name}
                    {!m.hasKnownPvp && (
                      <span className="ml-1 text-[10px] text-muted-foreground">(+30%)</span>
                    )}
                  </td>
                  <td className="py-2 text-center text-muted-foreground">{m.units}</td>
                  <td className="py-2 text-right text-muted-foreground">{m.costPrice.toFixed(2)} €</td>
                  <td className="py-2 text-right text-card-foreground">{price.toFixed(2)} €</td>
                  <td className="py-2 text-right font-medium text-card-foreground">{(price * m.units).toFixed(2)} €</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-foreground">
              <td colSpan={4} className="py-2 font-bold text-card-foreground text-right">Total materiales:</td>
              <td className="py-2 text-right font-bold text-card-foreground">{totalCost.toFixed(2)} €</td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}
