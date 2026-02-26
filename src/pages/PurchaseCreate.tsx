import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreatePurchaseOrder, useNextPurchaseOrderId, PurchaseOrderType } from "@/hooks/usePurchaseOrders";
import { useServices } from "@/hooks/useServices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useActiveTaxTypes } from "@/hooks/useTaxTypes";
import { mockOperators } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  ShoppingCart,
  CreditCard,
} from "lucide-react";

interface LineInput {
  supplierCode: string;
  description: string;
  units: number;
  costPrice: number;
  discountPercent: number;
}

const emptyLine = (): LineInput => ({
  supplierCode: "",
  description: "",
  units: 1,
  costPrice: 0,
  discountPercent: 0,
});

function lineTotal(l: LineInput): number {
  return l.units * l.costPrice * (1 - l.discountPercent / 100);
}

export default function PurchaseCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get("serviceId") ?? "";
  const isDirect = searchParams.get("direct") === "true";

  const { services } = useServices();
  const { data: nextId, isLoading: idLoading } = useNextPurchaseOrderId();
  const { data: suppliers = [] } = useSuppliers();
  const { data: taxTypes = [] } = useActiveTaxTypes();
  const activeSuppliers = suppliers.filter((s) => s.active);
  const createMutation = useCreatePurchaseOrder();

  const defaultTaxType = taxTypes.find((t) => t.is_default) ?? taxTypes[0];

  const [type, setType] = useState<PurchaseOrderType>(isDirect ? "Servicio" : (preselectedServiceId ? "Servicio" : "Servicio"));
  const [serviceId, setServiceId] = useState<string>(preselectedServiceId);
  const [operatorId, setOperatorId] = useState<string>("");
  const [supplierName, setSupplierName] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineInput[]>([emptyLine()]);
  const [taxTypeId, setTaxTypeId] = useState<string>("");

  // Set default tax type when loaded
  const effectiveTaxTypeId = taxTypeId || defaultTaxType?.id || "";
  const selectedTaxType = taxTypes.find((t) => t.id === effectiveTaxTypeId);
  const taxRate = selectedTaxType?.rate ?? 21;

  const selectedOperator = mockOperators.find((o) => o.id === operatorId);

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof LineInput, value: any) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );
  };

  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const canSubmit = !!(
    nextId &&
    supplierName.trim() &&
    lines.some((l) => l.supplierCode.trim() && l.costPrice > 0) &&
    serviceId
  ) || !!(
    nextId &&
    supplierName.trim() &&
    lines.some((l) => l.supplierCode.trim() && l.costPrice > 0) &&
    !isDirect &&
    type !== "Servicio"
  );

  const handleSubmit = async () => {
    if (!canSubmit || !nextId) return;
    await createMutation.mutateAsync({
      id: nextId,
      type: isDirect ? "Servicio" : type,
      serviceId: (isDirect || type === "Servicio") ? serviceId : null,
      operatorId: operatorId || null,
      operatorName: selectedOperator?.name ?? null,
      supplierName,
      isEmergency: isDirect ? false : isEmergency,
      notes: isDirect ? `[Compra directa] ${notes}`.trim() : notes,
      taxTypeId: effectiveTaxTypeId || null,
      lines: lines
        .filter((l) => l.supplierCode.trim())
        .map((l) => ({
          supplierCode: l.supplierCode,
          description: l.description,
          units: l.units,
          costPrice: l.costPrice,
          discountPercent: l.discountPercent,
        })),
      status: isDirect ? "Conciliada" : undefined,
    });
    navigate("/compras");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/compras")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            {isDirect ? (
              <CreditCard className="w-6 h-6 text-primary" />
            ) : (
              <ShoppingCart className="w-6 h-6 text-primary" />
            )}
            {isDirect ? "Compra Directa" : "Nueva Orden de Compra"}
            {!idLoading && nextId && (
              <Badge variant="outline" className="text-sm font-mono">{nextId}</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isDirect
              ? "Registra una compra ya realizada vinculada a un servicio"
              : "Registra materiales para recogida en proveedor"}
          </p>
        </div>
      </div>

      {/* General info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isDirect && (
            <div className="space-y-1.5">
              <Label>Tipo de compra</Label>
              <Select value={type} onValueChange={(v) => setType(v as PurchaseOrderType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Servicio">Servicio (vinculada a un servicio)</SelectItem>
                  <SelectItem value="Fungible">Fungible (stock de furgoneta)</SelectItem>
                  <SelectItem value="Gasto_General">Gasto general</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(isDirect || type === "Servicio") && (
            <div className="space-y-1.5">
              <Label>Servicio vinculado *</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar servicio..." /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.id} · {s.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Proveedor</Label>
            <Select value={supplierName} onValueChange={setSupplierName}>
              <SelectTrigger><SelectValue placeholder="Seleccionar proveedor..." /></SelectTrigger>
              <SelectContent>
                {activeSuppliers.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}{s.taxId ? ` · ${s.taxId}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Operario asignado</Label>
            <Select value={operatorId} onValueChange={setOperatorId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar operario..." /></SelectTrigger>
              <SelectContent>
                {mockOperators.map((op) => (
                  <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo impositivo</Label>
            <Select value={effectiveTaxTypeId} onValueChange={setTaxTypeId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar impuesto..." /></SelectTrigger>
              <SelectContent>
                {taxTypes.map((tt) => (
                  <SelectItem key={tt.id} value={tt.id}>
                    {tt.name} ({tt.rate}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isDirect && (
            <div className="flex items-center gap-3 col-span-full">
              <Switch checked={isEmergency} onCheckedChange={setIsEmergency} />
              <div className="flex items-center gap-1.5">
                {isEmergency && <AlertTriangle className="w-4 h-4 text-destructive" />}
                <Label className={cn(isEmergency && "text-destructive font-semibold")}>
                  Compra de emergencia (pieza faltante en obra)
                </Label>
              </div>
            </div>
          )}

          <div className="col-span-full space-y-1.5">
            <Label>Notas</Label>
            <Textarea
              placeholder="Observaciones, justificación de emergencia..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Materiales</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine}>
            <Plus className="w-4 h-4 mr-1" /> Añadir línea
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[120px_1fr_80px_100px_90px_100px_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
            <span>Cód. proveedor</span>
            <span>Descripción</span>
            <span>Uds.</span>
            <span>Coste ud.</span>
            <span>Dto. %</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-[120px_1fr_80px_100px_90px_100px_40px] gap-2 items-center bg-muted/30 rounded-lg p-2">
              <Input
                placeholder="Código"
                value={line.supplierCode}
                onChange={(e) => updateLine(idx, "supplierCode", e.target.value)}
              />
              <Input
                placeholder="Descripción del material"
                value={line.description}
                onChange={(e) => updateLine(idx, "description", e.target.value)}
              />
              <Input
                type="number"
                min={1}
                value={line.units}
                onChange={(e) => updateLine(idx, "units", Number(e.target.value))}
              />
              <Input
                type="number"
                min={0}
                step={0.01}
                value={line.costPrice || ""}
                onChange={(e) => updateLine(idx, "costPrice", Number(e.target.value))}
                placeholder="€"
              />
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={line.discountPercent || ""}
                onChange={(e) => updateLine(idx, "discountPercent", Number(e.target.value))}
                placeholder="%"
              />
              <div className="text-right font-medium text-sm text-foreground pr-1">
                €{lineTotal(line).toFixed(2)}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeLine(idx)}
                disabled={lines.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {/* Totals */}
          <div className="flex flex-col items-end gap-1 pt-3 border-t border-border text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground w-32 text-right">Base imponible:</span>
              <span className="font-bold text-foreground w-28 text-right">€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground w-32 text-right">
                {selectedTaxType ? selectedTaxType.name : `IVA ${taxRate}%`}:
              </span>
              <span className="font-bold text-foreground w-28 text-right">€{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex gap-2 pt-1 border-t border-border">
              <span className="text-muted-foreground w-32 text-right font-semibold">Total:</span>
              <span className="font-bold text-foreground text-base w-28 text-right">€{total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/compras")}>
          Cancelar
        </Button>
        <Button disabled={!canSubmit || createMutation.isPending} onClick={handleSubmit}>
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isDirect ? (
            <CreditCard className="w-4 h-4 mr-2" />
          ) : (
            <ShoppingCart className="w-4 h-4 mr-2" />
          )}
          {isDirect ? "Registrar compra directa" : "Crear orden de compra"}
        </Button>
      </div>
    </div>
  );
}
