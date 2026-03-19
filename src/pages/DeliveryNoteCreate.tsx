import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useCreateDeliveryNote } from "@/hooks/useDeliveryNotes";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useServices } from "@/hooks/useServices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useActiveTaxTypes } from "@/hooks/useTaxTypes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOperators } from "@/hooks/useOperators";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VoiceTextarea as Textarea } from "@/components/ui/voice-textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { ArrowLeft, Plus, Trash2, Loader2, Truck, Upload, FileText, X, ShoppingCart, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LinkMode = null | "oc" | "standalone";

interface LineInput {
  articleName: string;
  description: string;
  units: number;
  costPrice: number;
  taxRate: number;
  serviceId: string;
}

const emptyLine = (): LineInput => ({ articleName: "", description: "", units: 1, costPrice: 0, taxRate: 21, serviceId: "" });

export default function DeliveryNoteCreate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preServiceId = params.get("serviceId") ?? "";
  const preOcId = params.get("ocId") ?? "";
  const { services } = useServices();
  const { data: suppliers = [] } = useSuppliers();
  const { data: orders = [] } = usePurchaseOrders();
  const createNote = useCreateDeliveryNote();
  const { data: taxTypes = [] } = useActiveTaxTypes();

  // Step 0: choose mode
  const [mode, setMode] = useState<LinkMode>(preOcId ? "oc" : null);
  const [selectedOcId, setSelectedOcId] = useState(preOcId);

  const [code, setCode] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineInput[]>([{ ...emptyLine(), serviceId: preServiceId }]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = !createNote.isPending && (!!supplierName || !!code || lines.some(l => !!l.articleName || l.costPrice > 0));
  const { UnsavedChangesDialog } = useUnsavedChanges(isDirty);

  const todayStr = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const { data: allOperators = [] } = useOperators();
  const selectedOp = allOperators.find((o) => o.id === operatorId);
  const subtotal = lines.reduce((s, l) => s + l.units * l.costPrice, 0);
  const totalTax = lines.reduce((s, l) => s + l.units * l.costPrice * (l.taxRate / 100), 0);
  const total = subtotal + totalTax;
  const mainServiceId = lines[0]?.serviceId || preServiceId;

  // Pre-fill from selected OC
  const handleSelectOc = (ocId: string) => {
    setSelectedOcId(ocId);
    const oc = orders.find((o) => o.id === ocId);
    if (!oc) return;
    setSupplierName(oc.supplierName);
    setOperatorId(oc.operatorId ?? "");
    setLines(
      oc.lines.length > 0
        ? oc.lines.map((l) => ({
            articleName: l.articleName,
            description: l.description,
            units: l.units,
            costPrice: l.costPrice,
            taxRate: (l as any).taxRate ?? 21,
            serviceId: oc.serviceId,
          }))
        : [{ ...emptyLine(), serviceId: oc.serviceId }]
    );
    setPrefilled(true);
  };

  const handleConfirmMode = () => {
    if (mode === "oc" && selectedOcId) {
      handleSelectOc(selectedOcId);
    }
  };

  const updateLine = (i: number, field: keyof LineInput, val: any) => {
    setLines((prev) => prev.map((l, j) => (j === i ? { ...l, [field]: val } : l)));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else if (file) {
      toast.error("Solo se permiten archivos PDF");
    }
  };

  const uploadPdf = async (): Promise<string | null> => {
    if (!pdfFile) return null;
    const ext = pdfFile.name.split(".").pop();
    const path = `albaranes/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("delivery-notes").upload(path, pdfFile);
    if (error) {
      toast.error("Error al subir el PDF");
      return null;
    }
    const { data: urlData } = supabase.storage.from("delivery-notes").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!mainServiceId || !supplierName) return;
    setUploading(true);
    try {
      const pdfPath = await uploadPdf();
      createNote.mutate(
        {
          serviceId: mainServiceId,
          purchaseOrderId: mode === "oc" ? selectedOcId || null : null,
          code,
          supplierName,
          operatorId: operatorId || null,
          operatorName: selectedOp?.name ?? null,
          notes,
          pdfPath,
          lines: lines.map((l) => ({
            articleName: l.articleName,
            description: l.description,
            units: l.units,
            costPrice: l.costPrice,
          })),
        },
        { onSuccess: () => navigate("/compras") }
      );
    } finally {
      setUploading(false);
    }
  };

  const serviceOptions = services.map((s) => ({
    value: s.id,
    label: `${s.id} - ${s.clientName}`,
    subtitle: s.address ?? undefined,
    searchText: `${s.description ?? ""} ${s.address ?? ""}`,
  }));

  const ocOptions = orders.map((o) => ({
    value: o.id,
    label: `${o.id} — ${o.supplierName}`,
    subtitle: `Servicio: ${o.serviceId} · €${o.totalCost.toFixed(2)}`,
    searchText: `${o.serviceId} ${o.supplierName} ${o.operatorName ?? ""}`,
  }));

  const isPending = createNote.isPending || uploading;

  // Step 0: Mode selection
  if (mode === null || (mode === "oc" && !prefilled)) {
    return (
      <>
      <UnsavedChangesDialog />
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" /> Nuevo albarán
            </h1>
            <p className="text-sm text-muted-foreground">¿Cómo quieres crear el albarán?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
              mode === "oc" && "ring-2 ring-primary border-primary"
            )}
            onClick={() => setMode("oc")}
          >
            <CardContent className="pt-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-base">Vinculado a una OC</CardTitle>
              <CardDescription>
                Asociar este albarán a una orden de compra existente. Se pre-rellenarán los datos.
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
              mode === "standalone" && "ring-2 ring-primary border-primary"
            )}
            onClick={() => { setMode("standalone"); setPrefilled(true); }}
          >
            <CardContent className="pt-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center">
                <PackageOpen className="w-6 h-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-base">Compra sin OC</CardTitle>
              <CardDescription>
                Crear un albarán independiente, sin vincularlo a ninguna orden de compra.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {mode === "oc" && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base">Selecciona la orden de compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchableSelect
                value={selectedOcId}
                onValueChange={setSelectedOcId}
                placeholder="Buscar OC…"
                searchPlaceholder="ID, proveedor, servicio…"
                emptyText="No hay órdenes de compra"
                options={ocOptions}
              />
              <div className="flex justify-end">
                <Button onClick={handleConfirmMode} disabled={!selectedOcId}>
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </>
    );
  }

  // Step 1: Form
  return (
    <>
    <UnsavedChangesDialog />
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { setPrefilled(false); setMode(null); }}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Nuevo albarán
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "oc" ? `Vinculado a OC: ${selectedOcId}` : "Compra sin OC"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del albarán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Código albarán</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: ALB-001" />
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
                options={allOperators.map((o) => ({
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
          </div>

          {/* PDF Upload */}
          <div className="space-y-1.5">
            <Label>PDF del albarán</Label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {pdfFile ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground truncate max-w-[200px]">{pdfFile.name}</span>
                  <span className="text-xs text-muted-foreground">({(pdfFile.size / 1024).toFixed(0)} KB)</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPdfFile(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="w-4 h-4" /> Subir PDF
                </Button>
              )}
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
          <Button variant="outline" size="sm" onClick={() => setLines((p) => [...p, emptyLine()])}>
            <Plus className="w-4 h-4 mr-1" /> Añadir
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <div className="grid gap-2 items-end" style={{ gridTemplateColumns: "2fr 2fr 1fr 70px 80px 100px 90px auto" }}>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs">Servicio</Label>}
                    <SearchableSelect
                      value={l.serviceId}
                      onValueChange={(v) => updateLine(i, "serviceId", v)}
                      placeholder="Servicio…"
                      searchPlaceholder="Buscar…"
                      emptyText="—"
                      options={serviceOptions}
                    />
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs">Artículo</Label>}
                    <Input value={l.articleName} onChange={(e) => updateLine(i, "articleName", e.target.value)} placeholder="Artículo" />
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs">Descripción</Label>}
                    <Input value={l.description} onChange={(e) => updateLine(i, "description", e.target.value)} placeholder="Descripción…" />
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs">Uds.</Label>}
                    <Input type="number" min="0" max="99999" className="text-center px-1" value={l.units} onChange={(e) => updateLine(i, "units", Math.max(0, Number(e.target.value)))} />
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs">Coste ud.</Label>}
                    <Input type="number" min="0" max="99999" step="0.01" className="px-1" value={l.costPrice} onChange={(e) => updateLine(i, "costPrice", Math.max(0, Number(e.target.value)))} />
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs">IVA</Label>}
                    <Select value={String(l.taxRate)} onValueChange={(v) => updateLine(i, "taxRate", Number(v))}>
                      <SelectTrigger className="h-10 px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {taxTypes.map((t) => (
                          <SelectItem key={t.id} value={String(t.rate)}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    {i === 0 && <Label className="text-xs">Total</Label>}
                    <div className="flex items-center h-10 px-2 text-sm font-medium text-foreground bg-muted rounded-md whitespace-nowrap">
                      €{(l.units * l.costPrice * (1 + l.taxRate / 100)).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    {i === 0 && <Label className="text-xs invisible">X</Label>}
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setLines((p) => p.filter((_, j) => j !== i))} disabled={lines.length === 1}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 mt-4 space-y-1 text-sm text-right">
            <p className="text-muted-foreground">
              Base imponible: <span className="font-medium text-foreground">€{subtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
            </p>
            <p className="text-muted-foreground">
              IVA: <span className="font-medium text-foreground">€{totalTax.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
            </p>
            <p className="text-base font-semibold text-foreground">Total: €{total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={!mainServiceId || !supplierName || isPending}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Crear albarán
        </Button>
      </div>
    </div>
    </>
  );
}
