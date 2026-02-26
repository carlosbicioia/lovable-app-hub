import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreatePurchaseOrder, useNextPurchaseOrderId } from "@/hooks/usePurchaseOrders";
import { useServices } from "@/hooks/useServices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { mockOperators } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Loader2, ShoppingCart } from "lucide-react";

interface LineInput {
  articleName: string;
  description: string;
  units: number;
  costPrice: number;
}

const emptyLine = (): LineInput => ({ articleName: "", description: "", units: 1, costPrice: 0 });

export default function PurchaseCreate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preServiceId = params.get("serviceId") ?? "";
  const { services } = useServices();
  const { data: suppliers = [] } = useSuppliers();
  const { data: nextId, isLoading: loadingId } = useNextPurchaseOrderId();
  const createOrder = useCreatePurchaseOrder();

  const [serviceId, setServiceId] = useState(preServiceId);
  const [supplierName, setSupplierName] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineInput[]>([emptyLine()]);

  const selectedOp = mockOperators.find((o) => o.id === operatorId);
  const total = lines.reduce((s, l) => s + l.units * l.costPrice, 0);

  const updateLine = (i: number, field: keyof LineInput, val: any) => {
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, [field]: val } : l)));
  };

  const handleSubmit = () => {
    if (!nextId || !serviceId || !supplierName) return;
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
    <div className="space-y-6 max-w-4xl">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Servicio *</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.id} - {s.clientName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Proveedor *</Label>
              <Select value={supplierName} onValueChange={setSupplierName}>
                <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                <SelectContent>
                  {suppliers.filter((s) => s.active).map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Operario</Label>
              <Select value={operatorId} onValueChange={setOperatorId}>
                <SelectTrigger><SelectValue placeholder="Asignar operario" /></SelectTrigger>
                <SelectContent>
                  {mockOperators.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4 space-y-1">
                  {i === 0 && <Label className="text-xs">Artículo</Label>}
                  <Input value={l.articleName} onChange={(e) => updateLine(i, "articleName", e.target.value)} placeholder="Nombre" />
                </div>
                <div className="col-span-3 space-y-1">
                  {i === 0 && <Label className="text-xs">Descripción</Label>}
                  <Input value={l.description} onChange={(e) => updateLine(i, "description", e.target.value)} placeholder="Desc." />
                </div>
                <div className="col-span-2 space-y-1">
                  {i === 0 && <Label className="text-xs">Uds.</Label>}
                  <Input type="number" value={l.units} onChange={(e) => updateLine(i, "units", Number(e.target.value))} />
                </div>
                <div className="col-span-2 space-y-1">
                  {i === 0 && <Label className="text-xs">Coste</Label>}
                  <Input type="number" step="0.01" value={l.costPrice} onChange={(e) => updateLine(i, "costPrice", Number(e.target.value))} />
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setLines((p) => p.filter((_, j) => j !== i))} disabled={lines.length === 1}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4 text-sm font-semibold text-foreground">
            Total: €{total.toFixed(2)}
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
  );
}
