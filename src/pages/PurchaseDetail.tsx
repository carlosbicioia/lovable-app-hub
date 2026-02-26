import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePurchaseOrder, useUpdatePurchaseOrderStatus, PurchaseOrderStatus } from "@/hooks/usePurchaseOrders";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  Truck,
  ClipboardCheck,
  Send,
  Upload,
  FileImage,
  ExternalLink,
} from "lucide-react";

const statusFlow: { status: PurchaseOrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: "Borrador", label: "Borrador", icon: <ShoppingCart className="w-4 h-4" /> },
  { status: "Pendiente_Aprobación", label: "Pte. Aprobación", icon: <Send className="w-4 h-4" /> },
  { status: "Aprobada", label: "Aprobada", icon: <CheckCircle2 className="w-4 h-4" /> },
  { status: "Recogida", label: "Recogida", icon: <Truck className="w-4 h-4" /> },
  { status: "Conciliada", label: "Conciliada", icon: <ClipboardCheck className="w-4 h-4" /> },
];

const statusColors: Record<PurchaseOrderStatus, string> = {
  Borrador: "bg-muted text-muted-foreground",
  Pendiente_Aprobación: "bg-warning/15 text-warning border-warning/30",
  Aprobada: "bg-info/15 text-info border-info/30",
  Recogida: "bg-primary/15 text-primary border-primary/30",
  Conciliada: "bg-success/15 text-success border-success/30",
};

const typeLabels: Record<string, string> = {
  Servicio: "Servicio",
  Fungible: "Fungible",
  Gasto_General: "Gasto general",
};

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: order, isLoading } = usePurchaseOrder(id);
  const updateStatus = useUpdatePurchaseOrderStatus();

  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentIdx = statusFlow.findIndex((s) => s.status === order.status);
  const nextStatus = currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;

  const handleAdvance = () => {
    if (!nextStatus) return;
    // If advancing to "Recogida", show delivery note upload dialog
    if (nextStatus.status === "Recogida") {
      setShowDeliveryDialog(true);
      return;
    }
    updateStatus.mutate({ id: order.id, status: nextStatus.status });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDeliveryFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDeliverySubmit = async () => {
    setUploading(true);
    try {
      let deliveryNoteUrl: string | null = null;

      if (deliveryFile) {
        const ext = deliveryFile.name.split(".").pop();
        const path = `${order.id}/albaran-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("delivery-notes")
          .upload(path, deliveryFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("delivery-notes")
          .getPublicUrl(path);
        deliveryNoteUrl = urlData.publicUrl;
      }

      updateStatus.mutate({
        id: order.id,
        status: "Recogida",
        extra: deliveryNoteUrl ? { delivery_note_url: deliveryNoteUrl } : undefined,
      });

      setShowDeliveryDialog(false);
      setDeliveryFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      toast({ title: "Error al subir albarán", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const totalCost = order.lines.reduce((sum, l) => sum + l.units * l.costPrice, 0);
  const totalSale = order.lines.reduce((sum, l) => {
    const sale = l.hasKnownPvp && l.pvp ? l.pvp : l.costPrice * 1.3;
    return sum + l.units * sale;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/compras")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              {order.id}
              {order.isEmergency && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" /> Emergencia
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              {typeLabels[order.type]} · Creada {format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
            </p>
          </div>
        </div>

        {nextStatus && (
          <Button onClick={handleAdvance} disabled={updateStatus.isPending}>
            {updateStatus.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : nextStatus.icon}
            <span className="ml-1.5">Avanzar a {nextStatus.label}</span>
          </Button>
        )}
      </div>

      {/* Status timeline */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {statusFlow.map((step, idx) => {
              const isDone = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={step.status} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                    isCurrent ? statusColors[step.status] + " ring-2 ring-offset-1 ring-offset-background" :
                    isDone ? "bg-success/15 text-success border-success/30" :
                    "bg-muted/50 text-muted-foreground border-border"
                  )}>
                    {step.icon}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {idx < statusFlow.length - 1 && (
                    <div className={cn("flex-1 h-0.5 rounded", isDone ? "bg-success/40" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Proveedor</CardTitle></CardHeader>
          <CardContent><p className="font-semibold text-foreground">{order.supplierName || "—"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Operario</CardTitle></CardHeader>
          <CardContent><p className="font-semibold text-foreground">{order.operatorName ?? "Sin asignar"}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Servicio</CardTitle></CardHeader>
          <CardContent>
            {order.serviceId ? (
              <button onClick={() => navigate(`/servicios/${order.serviceId}`)} className="font-semibold text-primary hover:underline">
                {order.serviceId}
              </button>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      {order.notes && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Notas</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-foreground whitespace-pre-wrap">{order.notes}</p></CardContent>
        </Card>
      )}

      {/* Authorization code */}
      {order.authorizationCode && (
        <Card className="border-info/30 bg-info/5">
          <CardContent className="py-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Código de autorización:</span>
            <span className="font-mono font-bold text-lg text-info">{order.authorizationCode}</span>
          </CardContent>
        </Card>
      )}

      {/* Delivery note preview */}
      {order.deliveryNoteUrl && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5" /> Albarán de entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img
                src={order.deliveryNoteUrl}
                alt="Albarán de entrega"
                className="h-32 w-auto rounded-lg border border-border object-cover"
              />
              <a
                href={order.deliveryNoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver imagen completa
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Materiales ({order.lines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Material</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Descripción</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Uds.</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Coste ud.</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">PVP ud.</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Total coste</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Total PVP</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => {
                const pvp = l.hasKnownPvp && l.pvp ? l.pvp : l.costPrice * 1.3;
                return (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium text-foreground">{l.articleName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{l.description || "—"}</td>
                    <td className="px-3 py-2 text-right">{l.units}</td>
                    <td className="px-3 py-2 text-right">€{l.costPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      €{pvp.toFixed(2)}
                      {!l.hasKnownPvp && <span className="text-[10px] text-muted-foreground ml-1">×1.30</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">€{(l.units * l.costPrice).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-medium text-success">€{(l.units * pvp).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-end gap-6 pt-3 mt-3 border-t border-border text-sm">
            <div>
              <span className="text-muted-foreground">Coste total: </span>
              <span className="font-bold">€{totalCost.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">PVP total: </span>
              <span className="font-bold text-success">€{totalSale.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Margen: </span>
              <span className="font-bold text-info">€{(totalSale - totalCost).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader><CardTitle className="text-base">Trazabilidad</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Creada</p>
              <p className="font-medium">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Aprobada</p>
              <p className="font-medium">{order.approvedAt ? format(new Date(order.approvedAt), "dd/MM/yyyy HH:mm", { locale: es }) : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Recogida</p>
              <p className="font-medium">{order.collectedAt ? format(new Date(order.collectedAt), "dd/MM/yyyy HH:mm", { locale: es }) : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Conciliada</p>
              <p className="font-medium">{order.reconciledAt ? format(new Date(order.reconciledAt), "dd/MM/yyyy HH:mm", { locale: es }) : "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery note upload dialog */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Confirmar recogida
            </DialogTitle>
            <DialogDescription>
              Sube una foto del albarán de entrega firmado para confirmar la recogida del material.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview albarán"
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Cambiar foto
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">Pulsa para subir foto del albarán</span>
                <span className="text-xs">JPG, PNG — máx. 10 MB</span>
              </button>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeliveryDialog(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={handleDeliverySubmit} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Truck className="w-4 h-4 mr-2" />}
              {deliveryFile ? "Subir y confirmar" : "Confirmar sin albarán"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
