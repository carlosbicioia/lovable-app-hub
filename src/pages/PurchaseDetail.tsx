import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  usePurchaseOrder,
  useUpdatePurchaseOrderStatus,
  useUpdatePurchaseOrderPdf,
  useUpdatePurchaseOrderLines,
  PurchaseOrderStatus,
} from "@/hooks/usePurchaseOrders";
import { useServices } from "@/hooks/useServices";
import { useActiveTaxTypes } from "@/hooks/useTaxTypes";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Loader2, ShoppingCart, Send, CheckCircle2, Package,
  Plus, Trash2, Pencil, Save, X, Download, FileText, Wrench,
} from "lucide-react";

const statusFlow: { status: PurchaseOrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: "Borrador", label: "Borrador", icon: <ShoppingCart className="w-4 h-4" /> },
  { status: "Enviada", label: "Enviada", icon: <Send className="w-4 h-4" /> },
  { status: "Recogida", label: "Recogida", icon: <CheckCircle2 className="w-4 h-4" /> },
];

const statusColors: Record<PurchaseOrderStatus, string> = {
  Borrador: "bg-muted text-muted-foreground border-border",
  Enviada: "bg-info/15 text-info border-info/30",
  Recogida: "bg-success/15 text-success border-success/30",
};

interface EditLine {
  articleName: string;
  description: string;
  units: number;
  costPrice: number;
  taxRate: number;
}

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: order, isLoading } = usePurchaseOrder(id);
  const { getService } = useServices();
  const { data: taxTypes = [] } = useActiveTaxTypes();
  const { data: settings } = useCompanySettings();
  const updateStatus = useUpdatePurchaseOrderStatus();
  const updatePdf = useUpdatePurchaseOrderPdf();
  const updateLines = useUpdatePurchaseOrderLines();

  const [editing, setEditing] = useState(false);
  const [editLines, setEditLines] = useState<EditLine[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const service = order ? getService(order.serviceId) : undefined;

  const startEdit = useCallback(() => {
    if (!order) return;
    setEditLines(
      order.lines.map((l) => ({
        articleName: l.articleName,
        description: l.description,
        units: l.units,
        costPrice: l.costPrice,
        taxRate: l.taxRate,
      }))
    );
    setEditing(true);
  }, [order]);

  const cancelEdit = () => setEditing(false);

  const saveLines = () => {
    if (!order) return;
    updateLines.mutate(
      { orderId: order.id, lines: editLines },
      { onSuccess: () => setEditing(false) }
    );
  };

  const updateEditLine = (idx: number, patch: Partial<EditLine>) => {
    setEditLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addEditLine = () =>
    setEditLines((prev) => [...prev, { articleName: "", description: "", units: 1, costPrice: 0, taxRate: 21 }]);

  const removeEditLine = (idx: number) =>
    setEditLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  // Compute totals with tax
  const computeTotals = useCallback((lines: { units: number; costPrice: number; taxRate: number }[]) => {
    const subtotal = lines.reduce((s, l) => s + l.units * l.costPrice, 0);
    const taxByRate: Record<number, number> = {};
    lines.forEach((l) => {
      const base = l.units * l.costPrice;
      taxByRate[l.taxRate] = (taxByRate[l.taxRate] || 0) + base * (l.taxRate / 100);
    });
    const totalTax = Object.values(taxByRate).reduce((s, v) => s + v, 0);
    return { subtotal, taxByRate, totalTax, total: subtotal + totalTax };
  }, []);

  const displayLines = editing ? editLines : (order?.lines ?? []);
  const totals = computeTotals(displayLines);

  // Generate PDF as HTML→blob download
  const generatePdf = useCallback(async () => {
    if (!order || !settings) return;
    setGeneratingPdf(true);
    try {
      const t = computeTotals(order.lines);
      const linesHtml = order.lines
        .map(
          (l, i) =>
            `<tr>
              <td style="padding:6px 8px;border-bottom:1px solid #eee">${i + 1}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #eee">${l.articleName || "—"}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #eee">${l.description || "—"}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${l.units}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">€${l.costPrice.toFixed(2)}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${l.taxRate}%</td>
              <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">€${(l.units * l.costPrice).toFixed(2)}</td>
            </tr>`
        )
        .join("");

      const taxRows = Object.entries(t.taxByRate)
        .map(([rate, amount]) => `<tr><td colspan="6" style="text-align:right;padding:4px 8px">IVA ${rate}%:</td><td style="text-align:right;padding:4px 8px;font-weight:600">€${(amount as number).toFixed(2)}</td></tr>`)
        .join("");

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>OC ${order.id}</title>
        <style>body{font-family:Arial,sans-serif;margin:40px;color:#222}
        h1{font-size:20px;margin:0}h2{font-size:14px;margin:0;color:#666}
        table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
        th{background:#f5f5f5;padding:8px;text-align:left;border-bottom:2px solid #ddd;font-weight:600}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
        .info{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;margin-bottom:20px}
        .info dt{color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
        .info dd{margin:0;font-weight:500}
        .totals{margin-top:12px;text-align:right;font-size:13px}
        .grand-total{font-size:16px;font-weight:700;border-top:2px solid #222;padding-top:8px;margin-top:4px}
        </style></head><body>
        <div class="header">
          <div><h1>${(settings as any)?.company_name || "UrbanGO"}</h1><h2>Orden de Compra</h2></div>
          <div style="text-align:right"><h1>${order.id}</h1><h2>${format(new Date(order.createdAt), "dd/MM/yyyy")}</h2></div>
        </div>
        <div class="info">
          <div><dt>Proveedor</dt><dd>${order.supplierName}</dd></div>
          <div><dt>Servicio</dt><dd>${order.serviceId}</dd></div>
          <div><dt>Operario</dt><dd>${order.operatorName || "—"}</dd></div>
          <div><dt>Estado</dt><dd>${order.status}</dd></div>
        </div>
        ${order.notes ? `<p style="font-size:13px;color:#555;margin-bottom:16px">📝 ${order.notes}</p>` : ""}
        <table>
          <thead><tr>
            <th>#</th><th>Artículo</th><th>Descripción</th><th style="text-align:center">Uds.</th>
            <th style="text-align:right">Precio</th><th style="text-align:center">IVA</th><th style="text-align:right">Total</th>
          </tr></thead>
          <tbody>${linesHtml}</tbody>
          <tfoot>
            <tr><td colspan="6" style="text-align:right;padding:8px;font-weight:600">Base imponible:</td>
            <td style="text-align:right;padding:8px;font-weight:600">€${t.subtotal.toFixed(2)}</td></tr>
            ${taxRows}
            <tr class="grand-total"><td colspan="6" style="text-align:right;padding:8px">TOTAL:</td>
            <td style="text-align:right;padding:8px">€${t.total.toFixed(2)}</td></tr>
          </tfoot>
        </table>
        ${(settings as any)?.document_footer ? `<p style="margin-top:32px;font-size:11px;color:#999">${(settings as any).document_footer}</p>` : ""}
        </body></html>`;

      // Open print dialog for PDF generation
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }

      toast({ title: "PDF generado", description: "Usa 'Guardar como PDF' en el diálogo de impresión." });
    } catch (e: any) {
      toast({ title: "Error generando PDF", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingPdf(false);
    }
  }, [order, settings, computeTotals, toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!order) {
    return <div className="text-center py-20 text-muted-foreground">Orden no encontrada</div>;
  }

  const currentIdx = statusFlow.findIndex((s) => s.status === order.status);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/compras")}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" /> {order.id}
          </h1>
          <p className="text-sm text-muted-foreground">Servicio: {order.serviceId}</p>
        </div>
        <Button variant="outline" onClick={generatePdf} disabled={generatingPdf}>
          {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
          Generar PDF
        </Button>
      </div>

      {/* Status breadcrumb — clickable */}
      <div className="flex items-center gap-0">
        {statusFlow.map((s, i) => {
          const isActive = i <= currentIdx;
          const isCurrent = s.status === order.status;
          return (
            <button
              key={s.status}
              onClick={() => {
                if (s.status !== order.status) {
                  updateStatus.mutate({ id: order.id, status: s.status });
                }
              }}
              disabled={updateStatus.isPending}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border transition-colors relative",
                i === 0 && "rounded-l-lg",
                i === statusFlow.length - 1 && "rounded-r-lg",
                isCurrent
                  ? statusColors[s.status] + " ring-2 ring-primary/30 z-10"
                  : isActive
                    ? "bg-muted text-foreground border-border"
                    : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60"
              )}
            >
              {s.icon} {s.label}
            </button>
          );
        })}
      </div>

      {/* Info card with service details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Información</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Proveedor</p>
              <p className="font-medium text-foreground">{order.supplierName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Operario</p>
              <p className="font-medium text-foreground">{order.operatorName ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha creación</p>
              <p className="font-medium text-foreground">{format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: es })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Servicio</p>
              <p className="font-medium text-foreground">
                <button onClick={() => navigate(`/servicios/${order.serviceId}`)} className="text-primary hover:underline">
                  {order.serviceId}
                </button>
              </p>
            </div>
          </div>

          {/* Service type & status */}
          {service && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Tipología servicio</p>
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                  {service.serviceType === "Presupuesto" ? "Con presupuesto" : "Reparación directa"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Especialidad</p>
                <p className="font-medium text-foreground">{service.specialty}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado servicio</p>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                  service.status === "Finalizado" ? "bg-success/15 text-success border-success/30"
                    : service.status === "En_Curso" ? "bg-info/15 text-info border-info/30"
                      : "bg-warning/15 text-warning border-warning/30"
                )}>
                  {service.status.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium text-foreground">{service.clientName}</p>
              </div>
            </div>
          )}

          {order.notes && <p className="mt-4 text-sm text-muted-foreground italic">📝 {order.notes}</p>}

          {/* Generated PDF link */}
          {order.pdfPath && (
            <div className="mt-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <a href={order.pdfPath} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                Ver PDF generado
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" /> Líneas
          </CardTitle>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addEditLine}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Añadir
              </Button>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                <X className="w-3.5 h-3.5 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={saveLines} disabled={updateLines.isPending}>
                {updateLines.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Guardar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              {editLines.map((l, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3 space-y-1">
                    {idx === 0 && <Label className="text-xs">Artículo</Label>}
                    <Input value={l.articleName} onChange={(e) => updateEditLine(idx, { articleName: e.target.value })} placeholder="Nombre" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    {idx === 0 && <Label className="text-xs">Descripción</Label>}
                    <Input value={l.description} onChange={(e) => updateEditLine(idx, { description: e.target.value })} placeholder="Desc." />
                  </div>
                  <div className="col-span-1 space-y-1">
                    {idx === 0 && <Label className="text-xs">Uds.</Label>}
                    <Input type="number" value={l.units} onChange={(e) => updateEditLine(idx, { units: Number(e.target.value) || 0 })} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 0 && <Label className="text-xs">Precio</Label>}
                    <Input type="number" step="0.01" value={l.costPrice} onChange={(e) => updateEditLine(idx, { costPrice: Number(e.target.value) || 0 })} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 0 && <Label className="text-xs">IVA</Label>}
                    <Select value={String(l.taxRate)} onValueChange={(v) => updateEditLine(idx, { taxRate: Number(v) })}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {taxTypes.length > 0
                          ? taxTypes.map((tt) => <SelectItem key={tt.id} value={String(tt.rate)}>{tt.name} ({tt.rate}%)</SelectItem>)
                          : [0, 4, 10, 21].map((r) => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeEditLine(idx)} disabled={editLines.length === 1}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : order.lines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin líneas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Artículo</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Descripción</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">Uds.</th>
                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Precio</th>
                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">IVA</th>
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
                      <td className="px-3 py-2 text-center text-muted-foreground">{l.taxRate}%</td>
                      <td className="px-3 py-2 text-right font-medium">€{(l.units * l.costPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals with tax breakdown */}
          <div className="border-t border-border pt-4 mt-4 space-y-1 text-sm text-right">
            <p className="text-muted-foreground">
              Base imponible: <span className="font-medium text-foreground">€{totals.subtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
            </p>
            {Object.entries(totals.taxByRate).map(([rate, amount]) => (
              <p key={rate} className="text-muted-foreground">
                IVA {rate}%: <span className="font-medium text-foreground">€{(amount as number).toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
              </p>
            ))}
            <p className="text-base font-semibold text-foreground pt-1 border-t border-border">
              Total: €{totals.total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
