import { useParams, useNavigate } from "react-router-dom";
import { usePurchaseOrder, useUpdatePurchaseOrderStatus, useUpdatePurchaseOrderPdf, PurchaseOrderStatus } from "@/hooks/usePurchaseOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Loader2, ShoppingCart, Send, CheckCircle2, Package } from "lucide-react";
import PdfUpload from "@/components/shared/PdfUpload";

const statusFlow: { status: PurchaseOrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: "Borrador", label: "Borrador", icon: <ShoppingCart className="w-4 h-4" /> },
  { status: "Enviada", label: "Enviada", icon: <Send className="w-4 h-4" /> },
  { status: "Recogida", label: "Recogida", icon: <CheckCircle2 className="w-4 h-4" /> },
];

const statusColors: Record<PurchaseOrderStatus, string> = {
  Borrador: "bg-muted text-muted-foreground",
  Enviada: "bg-info/15 text-info border-info/30",
  Recogida: "bg-success/15 text-success border-success/30",
};

const nextStatusMap: Partial<Record<PurchaseOrderStatus, PurchaseOrderStatus>> = {
  Borrador: "Enviada",
  Enviada: "Recogida",
};

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = usePurchaseOrder(id);
  const updateStatus = useUpdatePurchaseOrderStatus();
  const updatePdf = useUpdatePurchaseOrderPdf();

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!order) {
    return <div className="text-center py-20 text-muted-foreground">Orden no encontrada</div>;
  }

  const total = order.lines.reduce((s, l) => s + l.units * l.costPrice, 0);
  const currentIdx = statusFlow.findIndex((s) => s.status === order.status);
  const nextStatus = nextStatusMap[order.status];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/compras")}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" /> {order.id}
          </h1>
          <p className="text-sm text-muted-foreground">Servicio: {order.serviceId}</p>
        </div>
        {nextStatus && (
          <Button onClick={() => updateStatus.mutate({ id: order.id, status: nextStatus })} disabled={updateStatus.isPending}>
            Avanzar a {nextStatus}
          </Button>
        )}
      </div>

      {/* Status flow */}
      <div className="flex items-center gap-2">
        {statusFlow.map((s, i) => (
          <div key={s.status} className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
            i <= currentIdx ? statusColors[s.status] : "bg-muted/30 text-muted-foreground border-border"
          )}>
            {s.icon} {s.label}
          </div>
        ))}
      </div>

      {/* Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Información</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Proveedor</p>
              <p className="font-medium text-foreground">{order.supplierName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Operario</p>
              <p className="font-medium text-foreground">{order.operatorName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha</p>
              <p className="font-medium text-foreground">{format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: es })}</p>
            </div>
          </div>
          {order.notes && <p className="mt-3 text-sm text-muted-foreground italic">📝 {order.notes}</p>}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Documento adjunto</p>
            <PdfUpload
              currentPdfUrl={order.pdfPath}
              folder="orders"
              onUploaded={(url) => updatePdf.mutate({ id: order.id, pdfPath: url })}
              onRemoved={() => updatePdf.mutate({ id: order.id, pdfPath: null })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /> Líneas</CardTitle></CardHeader>
        <CardContent>
          {order.lines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin líneas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Artículo</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Descripción</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">Uds.</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Coste</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((l) => (
                    <tr key={l.id} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2 text-foreground">{l.articleName || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{l.description || "—"}</td>
                      <td className="px-3 py-2 text-center">{l.units}</td>
                      <td className="px-3 py-2 text-right">€{l.costPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-medium">€{(l.units * l.costPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border">
                    <td colSpan={4} className="px-3 py-2 text-right font-semibold text-foreground">Total</td>
                    <td className="px-3 py-2 text-right font-bold text-foreground">€{total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
