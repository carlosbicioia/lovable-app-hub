import { useNavigate } from "react-router-dom";
import { ShoppingCart, AlertTriangle, Plus, Package, Euro, TrendingUp, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { PurchaseOrder } from "@/hooks/usePurchaseOrders";

const statusCfg: Record<string, { label: string; cls: string }> = {
  Borrador: { label: "Borrador", cls: "bg-muted text-muted-foreground border-border" },
  Pendiente_Aprobación: { label: "Pte. Aprobación", cls: "bg-warning/15 text-warning border-warning/30" },
  Aprobada: { label: "Aprobada", cls: "bg-info/15 text-info border-info/30" },
  Recogida: { label: "Recogida", cls: "bg-primary/15 text-primary border-primary/30" },
  Conciliada: { label: "Conciliada", cls: "bg-success/15 text-success border-success/30" },
};

const typeCfg: Record<string, string> = {
  Servicio: "Servicio",
  Fungible: "Fungible",
  Gasto_General: "Gasto General",
};

interface ServicePurchasesProps {
  serviceId: string;
  linkedOrders: PurchaseOrder[];
}

export default function ServicePurchases({ serviceId, linkedOrders }: ServicePurchasesProps) {
  const navigate = useNavigate();

  const totalCost = linkedOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalLines = linkedOrders.reduce((sum, o) => sum + o.lines.length, 0);
  const conciliadas = linkedOrders.filter((o) => o.status === "Conciliada").length;
  const pendientes = linkedOrders.filter((o) => o.status !== "Conciliada").length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Órdenes</p>
            <p className="text-2xl font-bold text-foreground">{linkedOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Coste total</p>
            <p className="text-2xl font-bold text-foreground">€{totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Conciliadas</p>
            <p className="text-2xl font-bold text-success">{conciliadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-warning">{pendientes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders list */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            Órdenes de compra
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate(`/compras/nueva?serviceId=${serviceId}&direct=true`)}>
              <CreditCard className="w-4 h-4 mr-1" /> Compra directa
            </Button>
            <Button size="sm" onClick={() => navigate(`/compras/nueva?serviceId=${serviceId}`)}>
              <Plus className="w-4 h-4 mr-1" /> Nueva OC
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {linkedOrders.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Sin órdenes de compra</p>
              <p className="text-xs text-muted-foreground mt-1">Crea una orden de compra para este servicio</p>
              <Button className="mt-4" variant="outline" onClick={() => navigate(`/compras/nueva?serviceId=${serviceId}`)}>
                <Plus className="w-4 h-4 mr-2" /> Crear orden de compra
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedOrders.map((o) => {
                const sc = statusCfg[o.status] ?? statusCfg.Borrador;
                const lineCost = o.lines.reduce((sum, l) => {
                  const disc = l.discountPercent ?? 0;
                  return sum + l.units * l.costPrice * (1 - disc / 100);
                }, 0);

                return (
                  <div
                    key={o.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/compras/${o.id}`)}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-foreground">{o.id}</span>
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", sc.cls)}>
                          {sc.label}
                        </span>
                        {o.isEmergency && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/15 text-destructive border border-destructive/30">
                            <AlertTriangle className="w-3 h-3" /> Emergencia
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                          {typeCfg[o.type] ?? o.type}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-foreground">€{o.totalCost.toFixed(2)}</span>
                    </div>

                    {/* Info row */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        {o.supplierName}
                      </span>
                      {o.operatorName && (
                        <span>Operario: {o.operatorName}</span>
                      )}
                      <span>
                        {(() => {
                          try {
                            return format(parseISO(o.createdAt), "d MMM yyyy", { locale: es });
                          } catch {
                            return "";
                          }
                        })()}
                      </span>
                    </div>

                    {/* Lines detail */}
                    {o.lines.length > 0 && (
                      <div className="bg-muted/30 rounded-md overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Código</th>
                              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Descripción</th>
                              <th className="text-center px-3 py-2 text-muted-foreground font-medium">Uds.</th>
                              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Coste</th>
                              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Dto.</th>
                              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {o.lines.map((l) => {
                              const lineTotal = l.units * l.costPrice * (1 - (l.discountPercent ?? 0) / 100);
                              return (
                                <tr key={l.id} className="border-b border-border/50 last:border-0">
                                  <td className="px-3 py-1.5 font-mono text-muted-foreground">{l.supplierCode || "—"}</td>
                                  <td className="px-3 py-1.5 text-foreground">{l.description || l.articleName || "—"}</td>
                                  <td className="px-3 py-1.5 text-center text-muted-foreground">{l.units}</td>
                                  <td className="px-3 py-1.5 text-right text-muted-foreground">€{l.costPrice.toFixed(2)}</td>
                                  <td className="px-3 py-1.5 text-right text-muted-foreground">
                                    {l.discountPercent > 0 ? `${l.discountPercent}%` : "—"}
                                  </td>
                                  <td className="px-3 py-1.5 text-right font-medium text-foreground">€{lineTotal.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Notes */}
                    {o.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">📝 {o.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
