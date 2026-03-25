import { useRouter } from "next/navigation";
import { ShoppingCart, Plus, FileText, Package, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { usePurchaseOrders, useUpdatePurchaseOrderPdf, type PurchaseOrderStatus } from "@/hooks/usePurchaseOrders";
import { useDeliveryNotes, useUpdateDeliveryNotePdf, type DeliveryNoteStatus } from "@/hooks/useDeliveryNotes";
import { usePurchaseInvoices, type InvoiceStatus } from "@/hooks/usePurchaseInvoices";
import { useUpdateInvoicePdf } from "@/hooks/useDeliveryNotes";
import PdfUpload from "@/components/shared/PdfUpload";

const ocStatusCfg: Record<PurchaseOrderStatus, { label: string; cls: string }> = {
  Borrador: { label: "Borrador", cls: "bg-muted text-muted-foreground border-border" },
  Enviada: { label: "Enviada", cls: "bg-info/15 text-info border-info/30" },
  Recogida: { label: "Recogida", cls: "bg-success/15 text-success border-success/30" },
};

const dnStatusCfg: Record<DeliveryNoteStatus, { label: string; cls: string }> = {
  Pendiente: { label: "Pendiente", cls: "bg-warning/15 text-warning border-warning/30" },
  Validado: { label: "Validado", cls: "bg-success/15 text-success border-success/30" },
};

const invStatusCfg: Record<InvoiceStatus, { label: string; cls: string }> = {
  Pendiente: { label: "Pendiente", cls: "bg-warning/15 text-warning border-warning/30" },
  Validada: { label: "Validada", cls: "bg-info/15 text-info border-info/30" },
  Exportada: { label: "Exportada", cls: "bg-success/15 text-success border-success/30" },
};

interface ServicePurchasesProps {
  serviceId: string;
}

export default function ServicePurchases({ serviceId }: ServicePurchasesProps) {
  const router = useRouter();
  const { data: orders = [] } = usePurchaseOrders(serviceId);
  const { data: deliveryNotes = [] } = useDeliveryNotes(serviceId);
  const { data: invoices = [] } = usePurchaseInvoices(serviceId);
  const updateOcPdf = useUpdatePurchaseOrderPdf();
  const updateDnPdf = useUpdateDeliveryNotePdf();
  const updateInvPdf = useUpdateInvoicePdf();

  const totalOC = orders.reduce((s, o) => s + o.totalCost, 0);
  const totalDN = deliveryNotes.reduce((s, d) => s + d.totalCost, 0);
  const totalInv = invoices.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Órdenes</p>
            <p className="text-2xl font-bold text-foreground">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Albaranes</p>
            <p className="text-2xl font-bold text-foreground">{deliveryNotes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Facturas</p>
            <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Coste total</p>
            <p className="text-2xl font-bold text-foreground">€{(totalOC + totalDN).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => router.push(`/compras/nueva?serviceId=${serviceId}`)}>
          <Plus className="w-4 h-4 mr-1" /> Nueva OC
        </Button>
        <Button size="sm" variant="outline" onClick={() => router.push(`/compras/albaran/nuevo?serviceId=${serviceId}`)}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo albarán
        </Button>
        <Button size="sm" variant="outline" onClick={() => router.push(`/compras/factura/nueva?serviceId=${serviceId}`)}>
          <Plus className="w-4 h-4 mr-1" /> Nueva factura
        </Button>
      </div>

      <Tabs defaultValue="oc">
        <TabsList>
          <TabsTrigger value="oc" className="gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" /> OC
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{orders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="albaranes" className="gap-1.5">
            <Truck className="w-3.5 h-3.5" /> Albaranes
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{deliveryNotes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="facturas" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Facturas
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{invoices.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* OC Tab */}
        <TabsContent value="oc">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-muted-foreground" /> Órdenes de compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Sin órdenes de compra</p>
                  <p className="text-xs text-muted-foreground mt-1">Crea una OC para este servicio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => {
                    const sc = ocStatusCfg[o.status];
                    return (
                      <div key={o.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/compras/${o.id}`)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold text-foreground">{o.id}</span>
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", sc.cls)}>{sc.label}</span>
                          </div>
                          <span className="text-lg font-bold text-foreground">€{o.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />{o.supplierName}</span>
                          {o.operatorName && <span>Operario: {o.operatorName}</span>}
                          <span>{format(new Date(o.createdAt), "d MMM yyyy", { locale: es })}</span>
                        </div>
                        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                          <PdfUpload
                            currentPdfUrl={o.pdfPath}
                            folder="orders"
                            onUploaded={(url) => updateOcPdf.mutate({ id: o.id, pdfPath: url })}
                            onRemoved={() => updateOcPdf.mutate({ id: o.id, pdfPath: null })}
                            compact
                          />
                        </div>
                        {o.lines.length > 0 && (
                          <div className="bg-muted/30 rounded-md overflow-hidden mt-3">
                            <table className="w-full text-xs">
                              <thead><tr className="border-b border-border">
                                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Artículo</th>
                                <th className="text-center px-3 py-2 text-muted-foreground font-medium">Uds.</th>
                                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Coste</th>
                                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Total</th>
                              </tr></thead>
                              <tbody>
                                {o.lines.map((l) => (
                                  <tr key={l.id} className="border-b border-border/50 last:border-0">
                                    <td className="px-3 py-1.5 text-foreground">{l.articleName || l.description || "—"}</td>
                                    <td className="px-3 py-1.5 text-center text-muted-foreground">{l.units}</td>
                                    <td className="px-3 py-1.5 text-right text-muted-foreground">€{l.costPrice.toFixed(2)}</td>
                                    <td className="px-3 py-1.5 text-right font-medium text-foreground">€{(l.units * l.costPrice).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Albaranes Tab */}
        <TabsContent value="albaranes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" /> Albaranes / Compras directas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deliveryNotes.length === 0 ? (
                <div className="text-center py-10">
                  <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Sin albaranes</p>
                  <p className="text-xs text-muted-foreground mt-1">Los albaranes se registran desde aquí o desde la app del operario</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveryNotes.map((dn) => {
                    const sc = dnStatusCfg[dn.status];
                    return (
                      <div key={dn.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold text-foreground">{dn.code || dn.id.slice(0, 8)}</span>
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", sc.cls)}>{sc.label}</span>
                          </div>
                          <span className="text-lg font-bold text-foreground">€{dn.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span>{dn.supplierName}</span>
                          {dn.operatorName && <span>Operario: {dn.operatorName}</span>}
                          <span>{format(new Date(dn.createdAt), "d MMM yyyy", { locale: es })}</span>
                        </div>
                        <div className="mt-2">
                          <PdfUpload
                            currentPdfUrl={dn.pdfPath}
                            folder="delivery-notes"
                            onUploaded={(url) => updateDnPdf.mutate({ id: dn.id, pdfPath: url })}
                            onRemoved={() => updateDnPdf.mutate({ id: dn.id, pdfPath: null })}
                            compact
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facturas Tab */}
        <TabsContent value="facturas">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" /> Facturas de compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Sin facturas vinculadas</p>
                  <p className="text-xs text-muted-foreground mt-1">Las facturas se vincularán a las OC o albaranes de este servicio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv) => {
                    const sc = invStatusCfg[inv.status];
                    return (
                      <div key={inv.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold text-foreground">{inv.invoiceNumber || "—"}</span>
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", sc.cls)}>{sc.label}</span>
                          </div>
                          <span className="text-lg font-bold text-foreground">€{inv.total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span>{inv.supplierName}</span>
                          {inv.invoiceDate && <span>{format(new Date(inv.invoiceDate), "d MMM yyyy", { locale: es })}</span>}
                        </div>
                        <div className="mt-2">
                          <PdfUpload
                            currentPdfUrl={inv.pdfPath}
                            folder="invoices"
                            onUploaded={(url) => updateInvPdf.mutate({ id: inv.id, pdfPath: url })}
                            onRemoved={() => updateInvPdf.mutate({ id: inv.id, pdfPath: null })}
                            compact
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
