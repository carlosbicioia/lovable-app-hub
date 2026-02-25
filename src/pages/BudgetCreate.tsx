import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockServices } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import type { TaxRate, BudgetLine } from "@/types/urbango";

const defaultTerms = "La aceptación de este presupuesto implica el pago inicial del 50% del importe total, en concepto de reserva y planificación de la obra, 20% a la entrega de materiales, 30% final a la finalización de los trabajos.";

export default function BudgetCreate() {
  const navigate = useNavigate();
  const [serviceId, setServiceId] = useState("");
  const [terms, setTerms] = useState(defaultTerms);
  const [lines, setLines] = useState<BudgetLine[]>([
    { id: "1", concept: "", description: "", units: 1, costPrice: 0, margin: 30, taxRate: 21 },
  ]);

  const servicesWithBudget = mockServices.filter((s) => s.serviceType === "Presupuesto");
  const selectedService = mockServices.find((s) => s.id === serviceId);

  const updateLine = (index: number, field: keyof BudgetLine, value: any) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { id: String(prev.length + 1), concept: "", description: "", units: 1, costPrice: 0, margin: 30, taxRate: 21 },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const calcLine = (l: BudgetLine) => {
    const salePrice = l.costPrice * (1 + l.margin / 100);
    const lineSubtotal = salePrice * l.units;
    const lineTax = lineSubtotal * (l.taxRate / 100);
    return { salePrice, lineSubtotal, lineTax };
  };

  const subtotal = lines.reduce((s, l) => s + calcLine(l).lineSubtotal, 0);
  const totalTax = lines.reduce((s, l) => s + calcLine(l).lineTax, 0);
  const total = subtotal + totalTax;

  const handleSave = (send: boolean) => {
    if (!serviceId) {
      toast({ title: "Error", description: "Selecciona un servicio", variant: "destructive" });
      return;
    }
    if (lines.some((l) => !l.concept)) {
      toast({ title: "Error", description: "Todos los conceptos deben tener nombre", variant: "destructive" });
      return;
    }
    toast({
      title: send ? "Presupuesto enviado" : "Presupuesto guardado",
      description: send
        ? "El presupuesto se ha creado y enviado por email."
        : "El presupuesto se ha guardado como borrador.",
    });
    navigate("/presupuestos");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/presupuestos")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-display font-bold text-foreground">Nuevo Presupuesto</h1>
      </div>

      {/* Service selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Servicio vinculado</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio..." />
                </SelectTrigger>
                <SelectContent>
                  {servicesWithBudget.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.id} — {s.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedService && (
              <>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input value={selectedService.clientName} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input value={selectedService.address ?? "—"} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Colaborador</Label>
                  <Input value={selectedService.collaboratorName ?? "Sin colaborador"} readOnly className="bg-muted" />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Líneas del presupuesto</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine}>
            <Plus className="w-4 h-4 mr-1" /> Añadir línea
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_80px_80px_80px_80px_80px_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
            <span>Concepto</span>
            <span>Descripción</span>
            <span>Uds.</span>
            <span>Coste</span>
            <span>Margen %</span>
            <span>PVP</span>
            <span>IVA</span>
            <span></span>
          </div>

          {lines.map((line, i) => {
            const { salePrice, lineSubtotal } = calcLine(line);
            return (
              <div key={line.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_80px_80px_80px_80px_80px_40px] gap-2 items-start border-b border-border pb-3 last:border-0">
                <Input
                  placeholder="Concepto"
                  value={line.concept}
                  onChange={(e) => updateLine(i, "concept", e.target.value)}
                />
                <Input
                  placeholder="Descripción"
                  value={line.description ?? ""}
                  onChange={(e) => updateLine(i, "description", e.target.value)}
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={line.units}
                  onChange={(e) => updateLine(i, "units", parseFloat(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={line.costPrice}
                  onChange={(e) => updateLine(i, "costPrice", parseFloat(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={line.margin}
                  onChange={(e) => updateLine(i, "margin", parseFloat(e.target.value) || 0)}
                />
                <div className="flex items-center h-10 px-2 text-sm text-muted-foreground bg-muted rounded-md">
                  {salePrice.toFixed(2)} €
                </div>
                <Select
                  value={String(line.taxRate)}
                  onValueChange={(v) => updateLine(i, "taxRate", parseInt(v) as TaxRate)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="21">21%</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeLine(i)}
                  disabled={lines.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}

          {/* Totals */}
          <div className="flex justify-end pt-4 border-t border-border">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium text-card-foreground">{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA:</span>
                <span className="text-muted-foreground">{totalTax.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1">
                <span className="font-bold text-card-foreground">TOTAL:</span>
                <span className="font-bold text-card-foreground">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Términos y Condiciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => handleSave(false)}>
          <Save className="w-4 h-4 mr-2" /> Guardar borrador
        </Button>
        <Button onClick={() => handleSave(true)}>
          <Send className="w-4 h-4 mr-2" /> Guardar y enviar por email
        </Button>
      </div>
    </div>
  );
}
