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

function calcLineTotal(l: { units: number; costPrice: number; margin: number; taxRate: number }) {
  const salePrice = Math.round(l.costPrice * (1 + l.margin / 100) * 100) / 100;
  const sub = Math.round(salePrice * l.units * 100) / 100;
  const tax = Math.round(sub * (l.taxRate / 100) * 100) / 100;
  return sub + tax;
}

export default function ServiceSalesOrders({ serviceId }: Props) {
  const { data: orders = [], isLoading } = useSalesOrders(serviceId);
  const updateOrder = useUpdateSalesOrder();
  const { updateService } = useServices();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [confirmLiquidate, setConfirmLiquidate] = useState<string | null>(null);

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
      });

      toast.success("Orden de venta enviada a Holded");
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

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" /> Órdenes de Venta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sin órdenes de venta</p>
            <p className="text-xs text-muted-foreground mt-1">
              Se generan al finalizar un presupuesto aprobado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" /> Órdenes de Venta
            <Badge variant="secondary" className="ml-auto text-xs">{orders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.map((order) => {
            const isLiquidada = order.status === "Liquidada";
            return (
              <div
                key={order.id}
                className={cn(
                  "rounded-lg border p-4 space-y-3",
                  isLiquidada ? "border-success/30 bg-success/5" : "border-border"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-card-foreground">{order.id}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        isLiquidada
                          ? "bg-success/15 text-success border-success/30"
                          : "bg-warning/15 text-warning border-warning/30"
                      )}
                    >
                      {isLiquidada ? "Liquidada" : "Pendiente"}
                    </Badge>
                    {order.sentToHolded && (
                      <Badge variant="outline" className="text-[10px] bg-info/15 text-info border-info/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Enviada
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(order.createdAt), "dd MMM yyyy", { locale: es })}
                  </span>
                </div>

                {/* Lines summary */}
                <div className="text-sm space-y-1">
                  {order.lines.map((l) => {
                    const salePrice = Math.round(l.costPrice * (1 + l.margin / 100) * 100) / 100;
                    const sub = Math.round(salePrice * l.units * 100) / 100;
                    return (
                      <div key={l.id} className="flex justify-between text-muted-foreground">
                        <span>{l.concept} × {l.units}</span>
                        <span>{sub.toFixed(2)} €</span>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center border-t border-border pt-2">
                  <span className="text-sm font-semibold text-card-foreground">Total</span>
                  <span className="text-sm font-bold text-card-foreground">{order.total.toFixed(2)} €</span>
                </div>

                {/* Holded info */}
                {order.sentToHolded && order.sentToHoldedAt && (
                  <p className="text-[11px] text-muted-foreground">
                    Enviada a Holded el {format(new Date(order.sentToHoldedAt), "dd MMM yyyy · HH:mm", { locale: es })}
                  </p>
                )}

                {/* Actions */}
                {!isLiquidada && (
                  <div className="flex gap-2 pt-1">
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
                      <Button
                        size="sm"
                        onClick={() => setConfirmLiquidate(order.id)}
                      >
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        Liquidar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
    </>
  );
}
