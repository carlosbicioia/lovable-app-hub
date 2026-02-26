import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePurchaseInvoice } from "@/hooks/usePurchaseInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useServices } from "@/hooks/useServices";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Upload, Loader2, Sparkles, Plus, Trash2 } from "lucide-react";

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

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createInvoice = useCreatePurchaseInvoice();
  const { data: suppliers = [] } = useSuppliers();
  const { services } = useServices();
  const { data: orders = [] } = usePurchaseOrders();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsing, setParsing] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [subtotal, setSubtotal] = useState(0);
  const [taxRate, setTaxRate] = useState(21);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: "", units: 1, unitPrice: 0, taxRate: 21, total: 0, serviceId: null, purchaseOrderId: null, deliveryNoteId: null },
  ]);

  const recalcLine = (line: InvoiceLine) => ({
    ...line,
    total: line.units * line.unitPrice,
  });

  const updateLine = (idx: number, patch: Partial<InvoiceLine>) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? recalcLine({ ...l, ...patch }) : l))
    );
  };

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { description: "", units: 1, unitPrice: 0, taxRate: 21, total: 0, serviceId: null, purchaseOrderId: null, deliveryNoteId: null },
    ]);

  const removeLine = (idx: number) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handlePdfUpload = useCallback(
    async (file: File) => {
      setPdfFile(file);
      setParsing(true);

      try {
        // Convert to base64
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

        // Auto-fill fields
        if (data.invoice_number) setInvoiceNumber(data.invoice_number);
        if (data.supplier_name) {
          setSupplierName(data.supplier_name);
          // Try to match supplier
          const match = suppliers.find(
            (s) => s.name.toLowerCase() === data.supplier_name.toLowerCase() ||
                   s.taxId === data.supplier_tax_id
          );
          if (match) setSupplierId(match.id);
        }
        if (data.invoice_date) setInvoiceDate(data.invoice_date);
        if (data.due_date) setDueDate(data.due_date);
        if (data.subtotal != null) setSubtotal(data.subtotal);
        if (data.tax_rate != null) setTaxRate(data.tax_rate);
        if (data.tax_amount != null) setTaxAmount(data.tax_amount);
        if (data.total != null) setTotal(data.total);

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
        subtotal,
        taxRate,
        taxAmount,
        total,
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

  const computedSubtotal = lines.reduce((s, l) => s + l.total, 0);
  const computedTax = computedSubtotal * (taxRate / 100);
  const computedTotal = computedSubtotal + computedTax;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/compras")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6" /> Nueva factura de compra
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Sube el PDF y la IA extraerá los datos automáticamente
          </p>
        </div>
      </div>

      {/* PDF Upload zone */}
      <div
        className="bg-card border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
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
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analizando factura con IA…</p>
          </div>
        ) : pdfFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-10 h-10 text-primary" />
            <p className="text-sm font-medium text-card-foreground">{pdfFile.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Datos extraídos con IA
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm font-medium text-card-foreground">
              Arrastra o haz clic para subir el PDF de la factura
            </p>
            <p className="text-xs text-muted-foreground">PDF o imagen · Máx 20MB</p>
          </div>
        )}
      </div>

      {/* Invoice data form */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-base font-semibold text-card-foreground">Datos de la factura</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-card-foreground">Nº Factura *</label>
            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="FAC-001" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground">Proveedor *</label>
            <Select
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
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__manual__">Escribir manualmente</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!supplierId && (
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Nombre del proveedor"
                className="mt-2"
              />
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground">Fecha factura</label>
            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-card-foreground">Fecha vencimiento</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-card-foreground">Notas</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones…" className="mt-1" rows={2} />
        </div>
      </div>

      {/* Lines */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-card-foreground">Líneas</h2>
          <Button variant="outline" size="sm" onClick={addLine}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Añadir
          </Button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_2fr_80px_100px_80px_100px_100px_36px] gap-2 text-xs font-medium text-muted-foreground">
            <span>Servicio</span>
            <span>Descripción</span>
            <span>Uds.</span>
            <span>Precio ud.</span>
            <span>IVA %</span>
            <span>Total</span>
            <span>OC vinculada</span>
            <span></span>
          </div>

          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_2fr_80px_100px_80px_100px_100px_36px] gap-2 items-center">
              <Select
                value={line.serviceId ?? "__none__"}
                onValueChange={(v) => updateLine(idx, { serviceId: v === "__none__" ? null : v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin asignar</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={line.description}
                onChange={(e) => updateLine(idx, { description: e.target.value })}
                placeholder="Descripción"
                className="h-9 text-xs"
              />
              <Input
                type="number"
                value={line.units}
                onChange={(e) => updateLine(idx, { units: Number(e.target.value) || 0 })}
                className="h-9 text-xs"
              />
              <Input
                type="number"
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) || 0 })}
                className="h-9 text-xs"
              />
              <Input
                type="number"
                value={line.taxRate}
                onChange={(e) => updateLine(idx, { taxRate: Number(e.target.value) || 0 })}
                className="h-9 text-xs"
              />
              <span className="text-xs font-medium text-card-foreground text-right pr-2">
                €{line.total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
              </span>

              <Select
                value={line.purchaseOrderId ?? "__none__"}
                onValueChange={(v) => updateLine(idx, { purchaseOrderId: v === "__none__" ? null : v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLine(idx)}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4 space-y-1 text-sm text-right">
          <p className="text-muted-foreground">
            Base imponible: <span className="font-medium text-card-foreground">€{computedSubtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
          </p>
          <p className="text-muted-foreground">
            IVA ({taxRate}%): <span className="font-medium text-card-foreground">€{computedTax.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
          </p>
          <p className="text-base font-semibold text-card-foreground">
            Total: €{computedTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/compras")}>Cancelar</Button>
        <Button
          onClick={() => {
            setSubtotal(computedSubtotal);
            setTaxAmount(computedTax);
            setTotal(computedTotal);
            setTimeout(handleSubmit, 0);
          }}
          disabled={createInvoice.isPending}
        >
          {createInvoice.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Registrar factura
        </Button>
      </div>
    </div>
  );
}
