import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreatePurchaseInvoice } from "@/hooks/usePurchaseInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useServices } from "@/hooks/useServices";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useActiveTaxTypes } from "@/hooks/useTaxTypes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Upload, Loader2, Sparkles, Plus, Trash2, ShoppingCart, Receipt } from "lucide-react";

interface InvoiceLine {
  description: string;
  units: number;
  unitPrice: number;
  taxRate: number;
  total: number;
  serviceId: string | null;
  purchaseOrderId: string | null;
  deliveryNoteId: string | null;
}

const emptyLine = (): InvoiceLine => ({
  description: "", units: 1, unitPrice: 0, taxRate: 21, total: 0,
  serviceId: null, purchaseOrderId: null, deliveryNoteId: null,
});

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preServiceId = searchParams.get("serviceId") ?? null;
  const { toast } = useToast();
  const createInvoice = useCreatePurchaseInvoice();
  const { data: suppliers = [] } = useSuppliers();
  const { services } = useServices();
  const { data: orders = [] } = usePurchaseOrders();
  const { data: taxTypes = [] } = useActiveTaxTypes();
  const fileRef = useRef<HTMLInputElement>(null);

  // Mode: "oc" = contra OC, "directa" = factura directa
  const [mode, setMode] = useState<"oc" | "directa">("directa");
  const [selectedOcId, setSelectedOcId] = useState("");

  const [parsing, setParsing] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState(21);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([{ ...emptyLine(), serviceId: preServiceId }]);

  const selectedOc = useMemo(() => orders.find((o) => o.id === selectedOcId), [orders, selectedOcId]);

  // When an OC is selected, auto-fill everything
  const handleOcSelect = (ocId: string) => {
    setSelectedOcId(ocId);
    const oc = orders.find((o) => o.id === ocId);
    if (!oc) return;

    setSupplierName(oc.supplierName);
    setSupplierId(oc.supplierId);

    // Match supplier for search select
    if (oc.supplierId) {
      setSupplierId(oc.supplierId);
    } else {
      const match = suppliers.find((s) => s.name.toLowerCase() === oc.supplierName.toLowerCase());
      if (match) setSupplierId(match.id);
    }

    // Build lines from OC lines
    setLines(
      oc.lines.length > 0
        ? oc.lines.map((l) => ({
            description: l.articleName || l.description || "",
            units: l.units,
            unitPrice: l.costPrice,
            taxRate: 21,
            total: l.units * l.costPrice,
            serviceId: oc.serviceId,
            purchaseOrderId: oc.id,
            deliveryNoteId: null,
          }))
        : [{ ...emptyLine(), serviceId: oc.serviceId, purchaseOrderId: oc.id }]
    );

    setNotes(oc.notes || "");
  };

  const recalcLine = (line: InvoiceLine) => ({
    ...line,
    total: line.units * line.unitPrice * (1 + line.taxRate / 100),
  });

  const updateLine = (idx: number, patch: Partial<InvoiceLine>) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? recalcLine({ ...l, ...patch }) : l))
    );
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (idx: number) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handlePdfUpload = useCallback(
    async (file: File) => {
      setPdfFile(file);
      setParsing(true);

      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        const { data, error } = await supabase.functions.invoke("parse-invoice", {
          body: { pdfBase64: base64, mimeType: file.type },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        if (data.invoice_number) setInvoiceNumber(data.invoice_number);
        if (data.supplier_name) {
          setSupplierName(data.supplier_name);
          const match = suppliers.find(
            (s) => s.name.toLowerCase() === data.supplier_name.toLowerCase() ||
                   s.taxId === data.supplier_tax_id
          );
          if (match) setSupplierId(match.id);
        }
        if (data.invoice_date) setInvoiceDate(data.invoice_date);
        if (data.due_date) setDueDate(data.due_date);
        if (data.tax_rate != null) setTaxRate(data.tax_rate);

        if (data.lines?.length > 0) {
          setLines(
            data.lines.map((l: any) => ({
              description: l.description || "",
              units: l.units || 1,
              unitPrice: l.unit_price || 0,
              taxRate: l.tax_rate || 21,
              total: l.total || (l.units || 1) * (l.unit_price || 0),
              serviceId: null,
              purchaseOrderId: null,
              deliveryNoteId: null,
            }))
          );
        }

        toast({ title: "Factura leída con IA", description: "Revisa los datos extraídos antes de guardar." });
      } catch (e: any) {
        console.error("OCR error:", e);
        toast({ title: "Error al leer la factura", description: e.message, variant: "destructive" });
      } finally {
        setParsing(false);
      }
    },
    [suppliers, toast]
  );

  const computedSubtotal = lines.reduce((s, l) => s + l.units * l.unitPrice, 0);
  const computedTax = lines.reduce((s, l) => s + l.units * l.unitPrice * (l.taxRate / 100), 0);
  const computedTotal = computedSubtotal + computedTax;

  const handleSubmit = async () => {
    if (!invoiceNumber || !supplierName) {
      toast({ title: "Completa los campos obligatorios", variant: "destructive" });
      return;
    }

    let uploadedPdfPath: string | null = null;
    if (pdfFile) {
      const ext = pdfFile.name.split(".").pop() || "pdf";
      const path = `invoices/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("purchase-docs")
        .upload(path, pdfFile);
      if (uploadErr) {
        toast({ title: "Error subiendo PDF", description: uploadErr.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = supabase.storage.from("purchase-docs").getPublicUrl(path);
      uploadedPdfPath = urlData.publicUrl;
    }

    createInvoice.mutate(
      {
        invoiceNumber,
        supplierId,
        supplierName,
        invoiceDate: invoiceDate || null,
        dueDate: dueDate || null,
        subtotal: computedSubtotal,
        taxRate,
        taxAmount: computedTax,
        total: computedTotal,
        pdfPath: uploadedPdfPath,
        notes,
        lines: lines.map((l) => ({
          serviceId: l.serviceId,
          purchaseOrderId: l.purchaseOrderId,
          deliveryNoteId: l.deliveryNoteId,
          description: l.description,
          units: l.units,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          total: l.total,
        })),
      },
      { onSuccess: () => navigate("/compras") }
    );
  };

  // OC options for searchable select
  const ocOptions = useMemo(
    () =>
      orders.map((o) => ({
        value: o.id,
        label: `${o.id} — ${o.supplierName}`,
        subtitle: `${o.serviceId} · €${o.totalCost.toFixed(2)} · ${o.status}`,
        searchText: `${o.serviceId} ${o.supplierName} ${o.notes}`,
      })),
    [orders]
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/compras")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6" /> Nueva factura de compra
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Registra una factura contra una OC existente o como factura directa
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <Card>
        <CardContent className="pt-6">
          <Label className="text-sm font-medium mb-3 block">Tipo de factura</Label>
          <Tabs value={mode} onValueChange={(v) => {
            setMode(v as "oc" | "directa");
            // Reset when switching
            setSelectedOcId("");
            setLines([emptyLine()]);
            setInvoiceNumber("");
            setSupplierName("");
            setSupplierId(null);
            setNotes("");
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="oc" className="gap-2">
                <ShoppingCart className="w-4 h-4" /> Contra orden de compra
              </TabsTrigger>
              <TabsTrigger value="directa" className="gap-2">
                <Receipt className="w-4 h-4" /> Factura directa
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "oc" && (
            <div className="mt-4 space-y-3">
              <Label>Seleccionar orden de compra</Label>
              <SearchableSelect
                value={selectedOcId}
                onValueChange={handleOcSelect}
                placeholder="Buscar OC por nº, proveedor, servicio…"
                searchPlaceholder="OC-001, proveedor, servicio…"
                emptyText="No hay órdenes de compra"
                options={ocOptions}
              />
              {selectedOc && (
                <div className="bg-muted/50 rounded-lg p-3 border border-border text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-card-foreground">{selectedOc.id}</span>
                    <span className="font-bold text-card-foreground">€{selectedOc.totalCost.toFixed(2)}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {selectedOc.supplierName} · Servicio: {selectedOc.serviceId} · {selectedOc.lines.length} líneas
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Upload zone (both modes) */}
      <div
        className="bg-card border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handlePdfUpload(f);
          }}
        />
        {parsing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analizando factura con IA…</p>
          </div>
        ) : pdfFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            <p className="text-sm font-medium text-card-foreground">{pdfFile.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Datos extraídos con IA · Haz clic para reemplazar
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-medium text-card-foreground">Subir PDF de la factura (opcional)</p>
            <p className="text-xs text-muted-foreground">La IA extraerá los datos automáticamente</p>
          </div>
        )}
      </div>

      {/* Invoice data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la factura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nº Factura *</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="FAC-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Proveedor *</Label>
              <SearchableSelect
                value={supplierId ?? "__manual__"}
                onValueChange={(v) => {
                  if (v === "__manual__") {
                    setSupplierId(null);
                  } else {
                    setSupplierId(v);
                    const s = suppliers.find((s) => s.id === v);
                    if (s) setSupplierName(s.name);
                  }
                }}
                placeholder="Buscar proveedor…"
                searchPlaceholder="Nombre, CIF…"
                emptyText="Sin proveedores"
                options={[
                  { value: "__manual__", label: "Escribir manualmente" },
                  ...suppliers.map((s) => ({
                    value: s.id,
                    label: s.name,
                    subtitle: s.city || undefined,
                    searchText: `${s.taxId} ${s.contactPerson}`,
                  })),
                ]}
              />
              {!supplierId && (
                <Input
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Nombre del proveedor"
                  className="mt-1"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Fecha factura</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha vencimiento</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones…" rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Líneas</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Añadir
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="border border-border rounded-lg p-3">
                <div className="grid gap-2 items-end" style={{ gridTemplateColumns: "2fr 1fr 70px 80px 100px 90px auto" }}>
                  <div className="space-y-1">
                    {idx === 0 && <Label className="text-xs">Servicio</Label>}
                    <SearchableSelect
                      value={line.serviceId ?? ""}
                      onValueChange={(v) => updateLine(idx, { serviceId: v || null })}
                      placeholder="Servicio…"
                      searchPlaceholder="Buscar…"
                      emptyText="—"
                      options={services.map((s) => ({
                        value: s.id,
                        label: s.id,
                        subtitle: s.clientName,
                        searchText: `${s.clientName} ${s.address ?? ""} ${s.description ?? ""}`,
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    {idx === 0 && <Label className="text-xs">Descripción</Label>}
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(idx, { description: e.target.value })}
                      placeholder="Concepto / descripción"
                    />
                  </div>
                  <div className="space-y-1">
                    {idx === 0 && <Label className="text-xs">Uds.</Label>}
                    <Input
                      type="number"
                      className="text-center px-1"
                      value={line.units}
                      onChange={(e) => updateLine(idx, { units: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    {idx === 0 && <Label className="text-xs">Precio ud.</Label>}
                    <Input
                      type="number"
                      step="0.01"
                      className="px-1"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    {idx === 0 && <Label className="text-xs">IVA</Label>}
                    <Select value={String(line.taxRate)} onValueChange={(v) => updateLine(idx, { taxRate: Number(v) })}>
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
                    {idx === 0 && <Label className="text-xs">Total</Label>}
                    <div className="flex items-center h-10 px-2 text-sm font-medium text-card-foreground bg-muted rounded-md whitespace-nowrap">
                      €{line.total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    {idx === 0 && <Label className="text-xs invisible">X</Label>}
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeLine(idx)} disabled={lines.length === 1}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 mt-4 space-y-1 text-sm text-right">
            <p className="text-muted-foreground">
              Base imponible: <span className="font-medium text-card-foreground">€{computedSubtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
            </p>
            <p className="text-muted-foreground">
              IVA: <span className="font-medium text-card-foreground">€{computedTax.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
            </p>
            <p className="text-base font-semibold text-card-foreground">
              Total: €{computedTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/compras")}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={createInvoice.isPending}>
          {createInvoice.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Registrar factura
        </Button>
      </div>
    </div>
  );
}
