import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateDeliveryNote } from "@/hooks/useDeliveryNotes";
import { useServices } from "@/hooks/useServices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { mockOperators } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { ArrowLeft, Plus, Trash2, Loader2, Truck, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface LineInput {
  articleName: string;
  description: string;
  units: number;
  costPrice: number;
  serviceId: string;
}

const emptyLine = (): LineInput => ({ articleName: "", description: "", units: 1, costPrice: 0, serviceId: "" });

export default function DeliveryNoteCreate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preServiceId = params.get("serviceId") ?? "";
  const { services } = useServices();
  const { data: suppliers = [] } = useSuppliers();
  const createNote = useCreateDeliveryNote();

  const [code, setCode] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineInput[]>([{ ...emptyLine(), serviceId: preServiceId }]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const selectedOp = mockOperators.find((o) => o.id === operatorId);
  const total = lines.reduce((s, l) => s + l.units * l.costPrice, 0);

  // Use the first line's serviceId as the main serviceId (required by DB)
  const mainServiceId = lines[0]?.serviceId || preServiceId;

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

  const isPending = createNote.isPending || uploading;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Nuevo albarán
          </h1>
          <p className="text-sm text-muted-foreground">Registra un albarán de proveedor</p>
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
                options={mockOperators.map((o) => ({
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
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3 space-y-1">
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
                <div className="col-span-2 space-y-1">
                  {i === 0 && <Label className="text-xs">Artículo</Label>}
                  <Input value={l.articleName} onChange={(e) => updateLine(i, "articleName", e.target.value)} placeholder="Nombre" />
                </div>
                <div className="col-span-3 space-y-1">
                  {i === 0 && <Label className="text-xs">Descripción</Label>}
                  <Textarea
                    value={l.description}
                    onChange={(e) => updateLine(i, "description", e.target.value)}
                    placeholder="Descripción…"
                    className="min-h-[40px] resize-y"
                    rows={1}
                  />
                </div>
                <div className="col-span-1 space-y-1">
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
          <div className="border-t border-border pt-4 mt-4 space-y-1 text-sm text-right">
            <p className="text-base font-semibold text-foreground">Total: €{total.toFixed(2)}</p>
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
  );
}
