import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { ArrowLeft, Plus, Trash2, Send, Save, PackageSearch, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useServices } from "@/hooks/useServices";
import { useArticles, getArticleSalePrice } from "@/hooks/useArticles";
import { toast } from "sonner";
import type { TaxRate, BudgetLine } from "@/types/urbango";
import { useBudgets } from "@/hooks/useBudgets";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useEffect } from "react";
import { Building2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function BudgetCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addBudget, budgets } = useBudgets();
  const { services } = useServices();
  const { data: companySettings } = useCompanySettings();

  const [serviceId, setServiceId] = useState(searchParams.get("serviceId") ?? "");
  const [terms, setTerms] = useState("");
  const [termsLoaded, setTermsLoaded] = useState(false);
  const [lines, setLines] = useState<BudgetLine[]>([
    { id: "1", concept: "", description: "", units: 1, costPrice: 0, margin: 30, taxRate: 21 },
  ]);
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);

  const isDirty = !!serviceId || lines.some(l => !!l.concept || l.costPrice > 0);
  const { UnsavedChangesDialog } = useUnsavedChanges(isDirty);

  // Load default terms from company settings
  useEffect(() => {
    if (companySettings && !termsLoaded) {
      const defaultTerms = (companySettings as any).budget_terms;
      if (defaultTerms) setTerms(defaultTerms);
      setTermsLoaded(true);
    }
  }, [companySettings, termsLoaded]);

  const servicesWithBudget = services.filter((s) => s.serviceType === "Presupuesto");
  const selectedService = services.find((s) => s.id === serviceId);

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

  const addLineFromArticle = (articleId: string) => {
    const article = articlesData.find((a) => a.id === articleId);
    if (!article) return;
    const salePrice = getArticleSalePrice(article);
    const margin = article.costPrice > 0 ? ((salePrice - article.costPrice) / article.costPrice) * 100 : 30;

    if (openPopoverIndex !== null && openPopoverIndex < lines.length) {
      setLines((prev) =>
        prev.map((l, i) =>
          i === openPopoverIndex
            ? { ...l, concept: article.title, description: article.description, costPrice: article.costPrice, margin: Math.round(margin * 100) / 100, units: 1 }
            : l
        )
      );
    } else {
      setLines((prev) => [
        ...prev,
        {
          id: String(prev.length + 1),
          concept: article.title,
          description: article.description,
          units: 1,
          costPrice: article.costPrice,
          margin: Math.round(margin * 100) / 100,
          taxRate: 21,
        },
      ]);
    }
    setOpenPopoverIndex(null);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const calcLine = (l: BudgetLine) => {
    const salePrice = Math.round(l.costPrice * (1 + l.margin / 100) * 100) / 100;
    const lineSubtotal = Math.round(salePrice * l.units * 100) / 100;
    const lineTax = Math.round(lineSubtotal * (l.taxRate / 100) * 100) / 100;
    return { salePrice, lineSubtotal, lineTax };
  };

  const subtotal = lines.reduce((s, l) => s + calcLine(l).lineSubtotal, 0);
  const totalTax = lines.reduce((s, l) => s + calcLine(l).lineTax, 0);
  const total = subtotal + totalTax;

  const handleSave = async (send: boolean) => {
    if (!serviceId) {
      toast.error("Selecciona un servicio");
      return;
    }
    if (lines.some((l) => !l.concept.trim())) {
      toast.error("Todos los conceptos deben tener nombre");
      return;
    }
    if (lines.some((l) => l.units <= 0)) {
      toast.error("Las unidades deben ser mayor que 0 en todas las líneas");
      return;
    }
    if (lines.some((l) => l.costPrice <= 0)) {
      toast.error("El precio de coste debe ser mayor que 0 en todas las líneas");
      return;
    }
    if (total <= 0) {
      toast.error("El total del presupuesto debe ser mayor que 0€");
      return;
    }
    if (send && lines.length === 1 && !lines[0].concept.trim()) {
      toast.error("Añade al menos una línea con contenido antes de enviar");
      return;
    }

    const prefix = (companySettings as any)?.budget_prefix || "PRE-";
    const nextNumber = (companySettings as any)?.budget_next_number || (15271349 + budgets.length);
    const newBudget = {
      id: `${prefix}${nextNumber}`,
      serviceId,
      serviceName: selectedService?.description ?? "",
      clientName: selectedService?.clientName ?? "",
      clientAddress: selectedService?.address ?? "",
      collaboratorName: selectedService?.collaboratorName ?? null,
      createdAt: new Date().toISOString(),
      status: send ? "Enviado" as const : "Borrador" as const,
      lines,
      termsAndConditions: terms,
      proformaPaid: false,
      proformaPaidAt: null,
      proformaSent: false,
      proformaSentAt: null,
    };

    await addBudget(newBudget);
    // Increment next budget number in company settings
    if (companySettings) {
      await supabase.from("company_settings").update({ budget_next_number: nextNumber + 1 }).eq("id", (companySettings as any).id);
    }
    toast.success(send ? "Presupuesto creado y enviado" : "Presupuesto guardado como borrador");
    // If coming from service creation flow, go back to continue editing
    const pendingData = sessionStorage.getItem("pendingServiceCreate");
    if (pendingData) {
      navigate("/servicios/nuevo");
    } else {
      navigate("/presupuestos");
    }
  };

  return (
    <>
    <UnsavedChangesDialog />
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
              <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={serviceSearchOpen} className="w-full justify-between font-normal">
                    {selectedService
                      ? `${selectedService.id} — ${selectedService.clientName}`
                      : "Buscar servicio..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0 bg-popover" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por nº, cliente, dirección o colaborador..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron servicios</CommandEmpty>
                      <CommandGroup>
                        {servicesWithBudget.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={`${s.id} ${s.clientName} ${s.address ?? ""} ${s.collaboratorName ?? ""}`}
                            onSelect={() => {
                              setServiceId(s.id);
                              setServiceSearchOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", serviceId === s.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{s.id} — {s.clientName}</span>
                              <span className="text-xs text-muted-foreground">
                                {s.address || "Sin dirección"}{s.collaboratorName ? ` · ${s.collaboratorName}` : ""}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
          <div className="flex gap-2">
            <Popover open={openPopoverIndex === -1} onOpenChange={(open) => setOpenPopoverIndex(open ? -1 : null)}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <PackageSearch className="w-4 h-4 mr-1" /> Desde artículo
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0 bg-popover" align="end">
                <Command>
                  <CommandInput placeholder="Buscar artículo..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron artículos</CommandEmpty>
                    <CommandGroup>
                      {articlesData.map((a) => (
                        <CommandItem key={a.id} value={`${a.title} ${a.description}`} onSelect={() => addLineFromArticle(a.id)}>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{a.title}</span>
                            <span className="text-xs text-muted-foreground">{a.costPrice.toFixed(2)} € · {a.unit} · {a.specialty}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="w-4 h-4 mr-1" /> Línea manual
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="hidden md:grid grid-cols-[1fr_2fr_80px_80px_80px_80px_80px_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
            <span>Artículo</span>
            <span>Descripción</span>
            <span>Uds.</span>
            <span>Coste</span>
            <span>Margen %</span>
            <span>PVP</span>
            <span>IVA</span>
            <span></span>
          </div>

          {lines.map((line, i) => {
            const { salePrice } = calcLine(line);
            return (
              <div key={line.id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_80px_80px_80px_80px_80px_40px] gap-2 items-start border-b border-border pb-3 last:border-0">
                <div className="flex gap-1">
                  <Popover open={openPopoverIndex === i} onOpenChange={(open) => setOpenPopoverIndex(open ? i : null)}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" title="Buscar artículo">
                        <PackageSearch className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0 bg-popover z-50" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar artículo..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron artículos</CommandEmpty>
                          <CommandGroup>
                            {articlesData.map((a) => (
                              <CommandItem key={a.id} value={`${a.title} ${a.description}`} onSelect={() => addLineFromArticle(a.id)}>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{a.title}</span>
                                  <span className="text-xs text-muted-foreground">{a.costPrice.toFixed(2)} € · {a.unit} · {a.specialty}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    placeholder="Artículo"
                    value={line.concept}
                    onChange={(e) => updateLine(i, "concept", e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Textarea
                  placeholder="Descripción detallada..."
                  value={line.description ?? ""}
                  onChange={(e) => updateLine(i, "description", e.target.value)}
                  className="min-h-[40px] resize-y text-sm"
                  rows={1}
                />
                <Input type="number" min={0} step={0.01} value={line.units} onChange={(e) => updateLine(i, "units", parseFloat(e.target.value) || 0)} />
                <Input type="number" min={0} step={0.01} value={line.costPrice} onChange={(e) => updateLine(i, "costPrice", parseFloat(e.target.value) || 0)} />
                <Input type="number" min={0} step={1} value={line.margin} onChange={(e) => updateLine(i, "margin", parseFloat(e.target.value) || 0)} />
                <div className="flex items-center h-10 px-2 text-sm text-muted-foreground bg-muted rounded-md">
                  {salePrice.toFixed(2)} €
                </div>
                <Select value={String(line.taxRate)} onValueChange={(v) => updateLine(i, "taxRate", parseInt(v) as TaxRate)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="21">21%</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeLine(i)} disabled={lines.length <= 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}

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
          <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={4} className="text-sm resize-y" />
        </CardContent>
      </Card>

      {/* Legal conditions & Company info */}
      {companySettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información del documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {companySettings.legal_conditions && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Condiciones legales</Label>
                <p className="text-sm text-card-foreground whitespace-pre-line bg-muted/50 rounded-lg p-3 border border-border">
                  {companySettings.legal_conditions}
                </p>
              </div>
            )}

            {companySettings.document_footer && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Pie de documento</Label>
                <p className="text-sm text-muted-foreground whitespace-pre-line bg-muted/50 rounded-lg p-3 border border-border">
                  {companySettings.document_footer}
                </p>
              </div>
            )}

            <Separator />

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Datos de la empresa emisora
              </Label>
              <div className="text-sm text-card-foreground bg-muted/50 rounded-lg p-3 border border-border space-y-0.5">
                <p className="font-medium">{companySettings.company_name || "—"}</p>
                {companySettings.tax_id && <p className="text-muted-foreground">CIF: {companySettings.tax_id}</p>}
                {companySettings.address && <p className="text-muted-foreground">{companySettings.address}</p>}
                <div className="flex gap-4 text-muted-foreground">
                  {companySettings.phone && <span>Tel: {companySettings.phone}</span>}
                  {companySettings.email && <span>{companySettings.email}</span>}
                </div>
                {companySettings.website && <p className="text-muted-foreground">{companySettings.website}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
    </>
  );
}
