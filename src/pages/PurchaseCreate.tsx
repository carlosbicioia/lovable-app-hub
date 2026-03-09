import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useCreatePurchaseOrder, useNextPurchaseOrderId } from "@/hooks/usePurchaseOrders";
import { useServices } from "@/hooks/useServices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useActiveTaxTypes } from "@/hooks/useTaxTypes";
import { useOperators } from "@/hooks/useOperators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { ArrowLeft, Plus, Trash2, Loader2, ShoppingCart } from "lucide-react";

interface LineInput {
  articleName: string;
  description: string;
  units: number;
  costPrice: number;
  taxRate: number;
}

const emptyLine = (): LineInput => ({ articleName: "", description: "", units: 1, costPrice: 0, taxRate: 21 });

export default function PurchaseCreate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preServiceId = params.get("serviceId") ?? "";
  const { services } = useServices();
  const { data: suppliers = [] } = useSuppliers();
  const { data: taxTypes = [] } = useActiveTaxTypes();
  const { data: nextId, isLoading: loadingId } = useNextPurchaseOrderId();
  const createOrder = useCreatePurchaseOrder();

  const [serviceId, setServiceId] = useState(preServiceId);
  const [supplierName, setSupplierName] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [notes, setNotes] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [lines, setLines] = useState<LineInput[]>([emptyLine()]);
  const todayStr = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

  const isDirty = !createOrder.isPending && (!!serviceId || !!supplierName || lines.some(l => !!l.articleName || l.costPrice > 0));
  const { UnsavedChangesDialog } = useUnsavedChanges(isDirty);

  const { data: operators = [] } = useOperators();
  const selectedOp = operators.find((o) => o.id === operatorId);
  const subtotal = lines.reduce((s, l) => s + l.units * l.costPrice, 0);
  const totalTax = lines.reduce((s, l) => s + l.units * l.costPrice * (l.taxRate / 100), 0);
  const total = subtotal + totalTax;

  const updateLine = (i: number, field: keyof LineInput, val: any) => {
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, [field]: val } : l)));
  };

  const handleSubmit = () => {
    if (!nextId || !serviceId) {
      toast.error("Selecciona un servicio");
      return;
    }
    if (!supplierName) {
      toast.error("Selecciona un proveedor");
      return;
    }
    if (lines.some((l) => !l.articleName.trim())) {
      toast.error("Todos los artículos deben tener nombre");
      return;
    }
    if (lines.some((l) => l.units <= 0)) {
      toast.error("Las unidades deben ser mayor que 0");
      return;
    }
    if (lines.some((l) => l.costPrice <= 0)) {
      toast.error("El coste debe ser mayor que 0 en todas las líneas");
      return;
    }
    createOrder.mutate(
      {
        id: nextId,
        serviceId,
        supplierName,
        operatorId: operatorId || null,
        operatorName: selectedOp?.name ?? null,
        notes,
        lines,
      },
      { onSuccess: () => navigate("/compras") }
    );
  };

  if (loadingId) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
    <UnsavedChangesDialog />
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" /> Nueva orden de compra
          </h1>
          <p className="text-sm text-muted-foreground">ID: {nextId}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos de la orden</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Servicio *</Label>
              <SearchableSelect
                value={serviceId}
                onValueChange={setServiceId}
                placeholder="Buscar servicio…"
                searchPlaceholder="Nº servicio, cliente…"
                emptyText="Sin servicios"
                options={services.map((s) => ({
                  value: s.id,
                  label: `${s.id} - ${s.clientName}`,
                  subtitle: s.address ?? undefined,
                  searchText: `${s.description ?? ""} ${s.address ?? ""}`,
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Proveedor *</Label>
              <SearchableSelect
                value={supplierName}
                onValueChange={setSupplierName}
                placeholder="Buscar proveedor…"
                searchPlaceholder="Nombre, CIF…"
                emptyText="Sin proveedores"
                options={suppliers.filter((s) => s.active).map((s) => ({
                  value: s.name,
                  label: s.name,
                  subtitle: s.city || undefined,
                  searchText: `${s.taxId} ${s.contactPerson}`,
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Operario</Label>
              <SearchableSelect
                value={operatorId}
                onValueChange={setOperatorId}
                placeholder="Asignar operario…"
                searchPlaceholder="Nombre del operario…"
                emptyText="Sin operarios"
                options={operators.map((o) => ({
                  value: o.id,
                  label: o.name,
                  subtitle: `${o.specialty} · NPS ${o.npsMean}`,
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de creación</Label>
              <Input value={todayStr} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de recogida</Label>
              <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Líneas</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setLines((p) => [...p, emptyLine()])}><Plus className="w-4 h-4 mr-1" /> Añadir</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="grid gap-2 items-end" style={{ gridTemplateColumns: "2fr 5fr 70px 80px 100px auto" }}>
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs">Artículo</Label>}
                  <Input value={l.articleName} onChange={(e) => updateLine(i, "articleName", e.target.value)} placeholder="Nombre" />
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs">Descripción</Label>}
                  <Textarea value={l.description} onChange={(e) => updateLine(i, "description", e.target.value)} placeholder="Descripción del artículo…" className="min-h-[40px] resize-y" rows={1} />
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs">Uds.</Label>}
                  <Input type="number" min="0" max="99999" className="text-center px-1" value={l.units} onChange={(e) => updateLine(i, "units", Math.max(0, Number(e.target.value)))} />
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs">Coste</Label>}
                  <Input type="number" min="0" max="99999" step="0.01" className="px-1" value={l.costPrice} onChange={(e) => updateLine(i, "costPrice", Math.max(0, Number(e.target.value)))} />
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs">IVA</Label>}
                  <Select value={String(l.taxRate)} onValueChange={(v) => updateLine(i, "taxRate", Number(v))}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {taxTypes.length > 0
                        ? taxTypes.map((tt) => <SelectItem key={tt.id} value={String(tt.rate)}>{tt.name} ({tt.rate}%)</SelectItem>)
                        : [0, 4, 10, 21].map((r) => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setLines((p) => p.filter((_, j) => j !== i))} disabled={lines.length === 1}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 mt-4 space-y-1 text-sm text-right">
            <p className="text-muted-foreground">Base imponible: <span className="font-medium text-foreground">€{subtotal.toFixed(2)}</span></p>
            <p className="text-muted-foreground">Impuestos: <span className="font-medium text-foreground">€{totalTax.toFixed(2)}</span></p>
            <p className="text-base font-semibold text-foreground">Total: €{total.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={!serviceId || !supplierName || createOrder.isPending}>
          {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Crear orden
        </Button>
      </div>
    </div>
    </>
  );
}
