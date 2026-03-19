import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VoiceTextarea as Textarea } from "@/components/ui/voice-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useCompanySettings, useUpdateCompanySettings } from "@/hooks/useCompanySettings";

export default function DocumentsTab() {
  const { data: settings } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const [docsForm, setDocsForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (settings) {
      setDocsForm({
        budget_prefix: settings.budget_prefix,
        budget_next_number: settings.budget_next_number,
        budget_validity_days: settings.budget_validity_days,
        date_format: settings.date_format,
        budget_terms: (settings as any).budget_terms ?? "",
        legal_conditions: settings.legal_conditions,
        document_footer: settings.document_footer,
        service_prefix: settings.service_prefix,
        invoice_prefix: settings.invoice_prefix,
        purchase_order_prefix: (settings as any).purchase_order_prefix ?? "OC-",
      });
    }
  }, [settings]);

  const handleSave = () => updateSettings.mutate(docsForm);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plantilla de presupuesto</CardTitle>
          <CardDescription>Personaliza el aspecto y contenido de los presupuestos generados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prefijo de numeración</Label>
              <Input value={docsForm.budget_prefix ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, budget_prefix: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Siguiente número</Label>
              <Input type="number" value={docsForm.budget_next_number ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, budget_next_number: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Validez por defecto (días)</Label>
              <Input type="number" value={docsForm.budget_validity_days ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, budget_validity_days: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Formato de fecha</Label>
              <Select value={docsForm.date_format ?? "dd/MM/yyyy"} onValueChange={(v) => setDocsForm(p => ({ ...p, date_format: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                  <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                  <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Términos y condiciones del presupuesto</Label>
            <p className="text-xs text-muted-foreground">Se incluirán por defecto en todos los presupuestos nuevos</p>
            <Textarea rows={5} className="resize-y" value={docsForm.budget_terms ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, budget_terms: e.target.value }))} placeholder="Ej: La aceptación de este presupuesto implica el pago inicial del 50%..." />
          </div>
          <div className="space-y-2">
            <Label>Condiciones legales</Label>
            <p className="text-xs text-muted-foreground">Texto legal que aparecerá al pie de los presupuestos</p>
            <Textarea rows={4} value={docsForm.legal_conditions ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, legal_conditions: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Nota al pie del documento</Label>
            <Textarea rows={2} value={docsForm.document_footer ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, document_footer: e.target.value }))} />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar plantilla
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Otros documentos</CardTitle>
          <CardDescription>Configura prefijos y formatos para partes de trabajo y facturas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prefijo de servicio</Label>
              <Input value={docsForm.service_prefix ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, service_prefix: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Prefijo de factura</Label>
              <Input value={docsForm.invoice_prefix ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, invoice_prefix: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Prefijo de orden de compra</Label>
              <Input value={docsForm.purchase_order_prefix ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, purchase_order_prefix: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
