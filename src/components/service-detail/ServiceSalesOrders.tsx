import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Send, CheckCircle2, Loader2, Lock } from "lucide-react";
import { useSalesOrders, useUpdateSalesOrder } from "@/hooks/useSalesOrders";
import { useServices } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import PdfUpload from "@/components/shared/PdfUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  serviceId: string;
}

const statusCfg: Record<string, { label: string; cls: string }> = {
  Pendiente: { label: "Pendiente", cls: "bg-warning/15 text-warning border-warning/30" },
  Liquidada: { label: "Liquidada", cls: "bg-success/15 text-success border-success/30" },
};

export default function ServiceSalesOrders({ serviceId }: Props) {
  const { data: orders = [], isLoading } = useSalesOrders(serviceId);
  const updateOrder = useUpdateSalesOrder();
  const { updateService } = useServices();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [confirmLiquidate, setConfirmLiquidate] = useState<string | null>(null);

  const totalPendiente = orders.filter((o) => o.status === "Pendiente").reduce((s, o) => s + o.total, 0);
  const totalLiquidada = orders.filter((o) => o.status === "Liquidada").reduce((s, o) => s + o.total, 0);

  const handleSendToHolded = async (order: typeof orders[0]) => {
    setSendingId(order.id);
    try {
      const { error } = await supabase.functions.invoke("export-holded", {
        body: {
          type: "sales_order",
          salesOrder: order,
        },
      });
      if (error) throw error;

      await updateOrder.mutateAsync({
        id: order.id,
        sent_to_holded: true,
        sent_to_holded_at: new Date().toISOString(),
        status: "Liquidada",
      });

      await updateService(order.serviceId, { status: "Liquidado" });
      toast.success("Orden enviada a Holded — servicio liquidado");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar a Holded");
    } finally {
      setSendingId(null);
    }
  };

  const handleLiquidate = async (orderId: string, svcId: string) => {
    try {
      await updateOrder.mutateAsync({ id: orderId, status: "Liquidada" });
      await updateService(svcId, { status: "Liquidado" });
      toast.success("Orden liquidada y servicio marcado como Liquidado");
    } catch (err: any) {
      toast.error(err.message || "Error al liquidar");
    } finally {
      setConfirmLiquidate(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Órdenes</p>
            <p className="text-2xl font-bold text-foreground">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pendiente</p>
            <p className="text-2xl font-bold text-warning">€{totalPendiente.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Liquidado</p>
            <p className="text-2xl font-bold text-success">€{totalLiquidada.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" /> Órdenes de Venta
            <Badge variant="secondary" className="ml-auto text-xs">{orders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Sin órdenes de venta</p>
              <p className="text-xs text-muted-foreground mt-1">Se generan al finalizar un presupuesto aprobado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const isLiquidada = order.status === "Liquidada";
                const sc = statusCfg[order.status] || statusCfg.Pendiente;
                return (
                  <div
                    key={order.id}
                    className={cn(
                      "border rounded-lg p-4 hover:bg-muted/50 transition-colors",
                      isLiquidada ? "border-success/30 bg-success/5" : "border-border"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-foreground">{order.id}</span>
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", sc.cls)}>
                          {sc.label}
                        </span>
                        {order.sentToHolded && (
                          <Badge variant="outline" className="text-[10px] bg-info/15 text-info border-info/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Enviada
                          </Badge>
                        )}
                      </div>
                      <span className="text-lg font-bold text-foreground">€{order.total.toFixed(2)}</span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span>{order.clientName}</span>
                      <span>Ppto: {order.budgetId}</span>
                      <span>{format(new Date(order.createdAt), "d MMM yyyy", { locale: es })}</span>
                    </div>

                    {/* Holded info */}
                    {order.sentToHolded && order.sentToHoldedAt && (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Enviada a Holded el {format(new Date(order.sentToHoldedAt), "dd MMM yyyy · HH:mm", { locale: es })}
                      </p>
                    )}

                    {/* Lines table */}
                    {order.lines.length > 0 && (
                      <div className="bg-muted/30 rounded-md overflow-hidden mt-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Concepto</th>
                              <th className="text-center px-3 py-2 text-muted-foreground font-medium">Uds.</th>
                              <th className="text-right px-3 py-2 text-muted-foreground font-medium">PVP ud.</th>
                              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.lines.map((l) => {
                              const salePrice = Math.round(l.costPrice * (1 + l.margin / 100) * 100) / 100;
                              const sub = Math.round(salePrice * l.units * 100) / 100;
                              return (
                                <tr key={l.id} className="border-b border-border/50 last:border-0">
                                  <td className="px-3 py-1.5 text-foreground">{l.concept}</td>
                                  <td className="px-3 py-1.5 text-center text-muted-foreground">{l.units}</td>
                                  <td className="px-3 py-1.5 text-right text-muted-foreground">€{salePrice.toFixed(2)}</td>
                                  <td className="px-3 py-1.5 text-right font-medium text-foreground">€{sub.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Actions */}
                    {!isLiquidada && (
                      <div className="flex gap-2 pt-3">
                        {!order.sentToHolded ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendToHolded(order)}
                            disabled={sendingId === order.id}
                          >
                            {sendingId === order.id ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Enviar a Holded
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => setConfirmLiquidate(order.id)}>
                            <Lock className="w-3.5 h-3.5 mr-1.5" />
                            Liquidar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm liquidate dialog */}
      <AlertDialog open={!!confirmLiquidate} onOpenChange={() => setConfirmLiquidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Liquidar orden de venta?</AlertDialogTitle>
            <AlertDialogDescription>
              La orden quedará bloqueada y no se podrá modificar. El servicio pasará automáticamente a estado "Liquidado".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmLiquidate && handleLiquidate(confirmLiquidate, serviceId)}>
              Liquidar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
