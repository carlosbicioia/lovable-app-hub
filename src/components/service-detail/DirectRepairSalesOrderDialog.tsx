import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, CheckCircle2, Clock, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCreateSalesOrder } from "@/hooks/useSalesOrders";
import { useServices } from "@/hooks/useServices";
import { articlesData, getArticleSalePrice } from "@/data/articlesData";
import type { Service } from "@/types/urbango";
import { toast } from "sonner";

interface SalesOrderDraftLine {
  concept: string;
  description: string | null;
  units: number;
  costPrice: number;
  margin: number;
  taxRate: number;
  type: "labor" | "material";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  onFinalized: () => void;
}

export default function DirectRepairSalesOrderDialog({ open, onOpenChange, service, onFinalized }: Props) {
  const [lines, setLines] = useState<SalesOrderDraftLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const createSalesOrder = useCreateSalesOrder();
  const { updateService } = useServices();

  useEffect(() => {
    if (!open) return;
    loadDraftLines();
  }, [open, service.id]);

  const loadDraftLines = async () => {
    setLoading(true);
    try {
      const draftLines: SalesOrderDraftLine[] = [];

      // 1. Get time records grouped by operator
      const { data: timeRecords } = await supabase
        .from("time_records")
        .select("operator_id, hours, notes")
        .eq("service_id", service.id);

      // Get specialty hourly rate
      const { data: specialties } = await supabase
        .from("specialties")
        .select("name, hourly_rate")
        .eq("name", service.specialty)
        .limit(1);

      const hourlyRate = (specialties?.[0] as any)?.hourly_rate ?? 0;

      if (timeRecords && timeRecords.length > 0) {
        // Group hours by operator
        const opHours: Record<string, { total: number; name: string }> = {};
        for (const tr of timeRecords) {
          if (!opHours[tr.operator_id]) {
            opHours[tr.operator_id] = { total: 0, name: "" };
          }
          opHours[tr.operator_id].total += Number(tr.hours);
        }

        // Get operator names
        const opIds = Object.keys(opHours);
        if (opIds.length > 0) {
          const { data: ops } = await supabase
            .from("operators")
            .select("id, name")
            .in("id", opIds);
          ops?.forEach((op) => {
            if (opHours[op.id]) opHours[op.id].name = op.name;
          });
        }

        for (const [, info] of Object.entries(opHours)) {
          draftLines.push({
            concept: `Mano de obra - ${info.name || "Operario"}`,
            description: `${service.specialty} · ${info.total.toFixed(2)}h`,
            units: info.total,
            costPrice: hourlyRate,
            margin: 0,
            taxRate: 21,
            type: "labor",
          });
        }
      }

      // 2. Get materials from service_materials_used
      const { data: materials } = await (supabase as any)
        .from("service_materials_used")
        .select("material, supplier_name, brand, model")
        .eq("service_id", service.id);

      if (materials && materials.length > 0) {
        for (const mat of materials) {
          const desc = [mat.brand, mat.model, mat.supplier_name].filter(Boolean).join(" · ");
          draftLines.push({
            concept: mat.material || "Material",
            description: desc || null,
            units: 1,
            costPrice: 0,
            margin: 30,
            taxRate: 21,
            type: "material",
          });
        }
      }

      // 3. Get materials from purchase order lines
      const { data: purchaseOrders } = await supabase
        .from("purchase_orders")
        .select("id")
        .eq("service_id", service.id);

      if (purchaseOrders && purchaseOrders.length > 0) {
        const poIds = purchaseOrders.map((po) => po.id);
        const { data: poLines } = await supabase
          .from("purchase_order_lines")
          .select("article_name, description, units, cost_price, tax_rate")
          .in("purchase_order_id", poIds);

        if (poLines && poLines.length > 0) {
          for (const pl of poLines) {
            // Check if already added from materials
            const alreadyExists = draftLines.some(
              (l) => l.type === "material" && l.concept === pl.article_name
            );
            if (!alreadyExists) {
              draftLines.push({
                concept: pl.article_name || "Material (compra)",
                description: pl.description || null,
                units: Number(pl.units),
                costPrice: Number(pl.cost_price),
                margin: 30,
                taxRate: Number(pl.tax_rate),
                type: "material",
              });
            } else {
              // Update cost if material exists but had no cost
              const idx = draftLines.findIndex(
                (l) => l.type === "material" && l.concept === pl.article_name
              );
              if (idx >= 0 && draftLines[idx].costPrice === 0) {
                draftLines[idx].costPrice = Number(pl.cost_price);
                draftLines[idx].units = Number(pl.units);
              }
            }
          }
        }
      }

      setLines(draftLines);
    } catch (err) {
      console.error("Error loading draft lines:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateLine = (idx: number, field: keyof SalesOrderDraftLine, value: any) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { concept: "", description: null, units: 1, costPrice: 0, margin: 0, taxRate: 21, type: "material" },
    ]);
  };

  const calcLineTotal = (l: SalesOrderDraftLine) => {
    const salePrice = Math.round(l.costPrice * (1 + l.margin / 100) * 100) / 100;
    const subtotal = Math.round(salePrice * l.units * 100) / 100;
    return subtotal + Math.round(subtotal * (l.taxRate / 100) * 100) / 100;
  };

  const grandTotal = lines.reduce((s, l) => s + calcLineTotal(l), 0);

  const handleCreate = async () => {
    if (lines.length === 0) {
      toast.error("Añade al menos una línea a la orden de venta");
      return;
    }
    setCreating(true);
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from("sales_orders")
        .select("id")
        .eq("service_id", service.id)
        .limit(1);
      if (existing && existing.length > 0) {
        toast.error("Ya existe una orden de venta para este servicio.");
        return;
      }

      const timestamp = Date.now().toString(36).toUpperCase();
      const salesOrderId = `OV-${service.id.replace("SRV-", "")}-${timestamp}`;

      // We need a "virtual" budget_id for direct repairs
      const budgetId = `DIR-${service.id}`;

      await createSalesOrder.mutateAsync({
        id: salesOrderId,
        budgetId,
        serviceId: service.id,
        clientName: service.clientName,
        clientAddress: service.address || "",
        collaboratorName: service.collaboratorName,
        total: Math.round(grandTotal * 100) / 100,
        lines: lines.map((l, i) => ({
          concept: l.concept,
          description: l.description,
          units: l.units,
          costPrice: l.costPrice,
          margin: l.margin,
          taxRate: l.taxRate,
          sortOrder: i,
        })),
      });

      await updateService(service.id, { status: "Finalizado" });
      toast.success(`Orden de venta ${salesOrderId} creada y servicio finalizado.`);
      onOpenChange(false);
      onFinalized();
    } catch (err: any) {
      toast.error(err.message || "Error al crear la orden de venta");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Finalizar servicio {service.id} — Orden de venta
          </AlertDialogTitle>
          <AlertDialogDescription>
            Revisa y edita las líneas de la orden de venta antes de confirmar. Se generan automáticamente a partir de las horas y materiales registrados.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-muted/50 rounded-lg p-3">
              <div>
                <span className="text-muted-foreground">Cliente:</span>{" "}
                <span className="font-medium text-foreground">{service.clientName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Especialidad:</span>{" "}
                <span className="font-medium text-foreground">{service.specialty}</span>
              </div>
              {service.collaboratorName && (
                <div>
                  <span className="text-muted-foreground">Colaborador:</span>{" "}
                  <span className="font-medium text-foreground">{service.collaboratorName}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Dirección:</span>{" "}
                <span className="font-medium text-foreground">{service.address || "—"}</span>
              </div>
            </div>

            {/* Lines */}
            {lines.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No se han encontrado horas ni materiales registrados.
                <br />Puedes añadir líneas manualmente.
              </div>
            ) : (
              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {line.type === "labor" ? (
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-warning shrink-0" />
                      )}
                      <Input
                        value={line.concept}
                        onChange={(e) => updateLine(idx, "concept", e.target.value)}
                        placeholder="Concepto"
                        className="h-8 text-sm font-medium flex-1"
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeLine(idx)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Input
                      value={line.description || ""}
                      onChange={(e) => updateLine(idx, "description", e.target.value || null)}
                      placeholder="Descripción (opcional)"
                      className="h-7 text-xs"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Uds.</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.units}
                          onChange={(e) => updateLine(idx, "units", parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Coste ud.</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.costPrice}
                          onChange={(e) => updateLine(idx, "costPrice", parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Margen %</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={line.margin}
                          onChange={(e) => updateLine(idx, "margin", parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">IVA %</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={line.taxRate}
                          onChange={(e) => updateLine(idx, "taxRate", parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="text-right text-xs font-medium text-foreground">
                      Total: €{calcLineTotal(line).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" size="sm" className="w-full" onClick={addLine}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Añadir línea
            </Button>

            {/* Grand total */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <span className="text-sm font-medium text-foreground">Total orden de venta</span>
              <span className="text-lg font-bold text-foreground">€{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel disabled={creating}>Cancelar</AlertDialogCancel>
          <Button onClick={handleCreate} disabled={creating || loading}>
            {creating ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
            )}
            Crear orden y finalizar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
