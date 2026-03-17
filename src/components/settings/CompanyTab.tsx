import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useCompanySettings, useUpdateCompanySettings, type CompanySettings } from "@/hooks/useCompanySettings";
import LogoUploadSection from "./LogoUploadSection";

export default function CompanyTab() {
  const { data: settings } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();

  const [companyForm, setCompanyForm] = useState<Record<string, any>>({});
  const [operativeForm, setOperativeForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (settings) {
      setCompanyForm({
        company_name: settings.company_name,
        tax_id: settings.tax_id,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
      });
      setOperativeForm({
        sla_first_contact_hours: settings.sla_first_contact_hours,
        sla_resolution_hours: settings.sla_resolution_hours,
        default_vat: settings.default_vat,
        currency: settings.currency,
      });
    }
  }, [settings]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la empresa</CardTitle>
          <CardDescription>Información legal y de contacto que aparecerá en documentos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Razón social</Label>
              <Input value={companyForm.company_name ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, company_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>CIF / NIF</Label>
              <Input value={companyForm.tax_id ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, tax_id: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Dirección fiscal</Label>
              <Input value={companyForm.address ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={companyForm.phone ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email de contacto</Label>
              <Input type="email" value={companyForm.email ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Sitio web</Label>
              <Input value={companyForm.website ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, website: e.target.value }))} />
            </div>
          </div>
          <Separator />
          <LogoUploadSection logoUrl={settings?.logo_url ?? null} onUploaded={(url) => updateSettings.mutate({ logo_url: url })} onRemoved={() => updateSettings.mutate({ logo_url: null })} />
          <div className="flex justify-end">
            <Button onClick={() => updateSettings.mutate(companyForm)} disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración operativa</CardTitle>
          <CardDescription>Parámetros generales del negocio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SLA primer contacto (horas)</Label>
              <Input type="number" value={operativeForm.sla_first_contact_hours ?? ""} onChange={(e) => setOperativeForm(p => ({ ...p, sla_first_contact_hours: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>SLA resolución (horas)</Label>
              <Input type="number" value={operativeForm.sla_resolution_hours ?? ""} onChange={(e) => setOperativeForm(p => ({ ...p, sla_resolution_hours: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>IVA por defecto (%)</Label>
              <Input type="number" value={operativeForm.default_vat ?? ""} onChange={(e) => setOperativeForm(p => ({ ...p, default_vat: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={operativeForm.currency ?? "EUR"} onValueChange={(v) => setOperativeForm(p => ({ ...p, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                  <SelectItem value="USD">$ Dólar (USD)</SelectItem>
                  <SelectItem value="GBP">£ Libra (GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => updateSettings.mutate(operativeForm)} disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
