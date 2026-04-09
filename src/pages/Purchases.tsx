import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useServices } from "@/hooks/useServices";
import { usePurchaseOrders, PurchaseOrderStatus } from "@/hooks/usePurchaseOrders";
import { usePurchaseInvoices, InvoiceStatus } from "@/hooks/usePurchaseInvoices";
import { useDeliveryNotes } from "@/hooks/useDeliveryNotes";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Loader2, ShoppingCart, FileText, Truck, Trash2, Download } from "lucide-react";
import DatePresetSelect from "@/components/shared/DatePresetSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { generateDocumentPdf } from "@/lib/generateDocumentPdf";
import { format as formatDate } from "date-fns";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/shared/BulkActionBar";
import { exportCsv } from "@/lib/exportCsv";
import SignedPdfLink from "@/components/shared/SignedPdfLink";

const ocStatusConfig: Record<PurchaseOrderStatus, { label: string; cls: string }> = {
  Borrador: { label: "Borrador", cls: "bg-muted text-muted-foreground" },
  Enviada: { label: "Enviada", cls: "bg-info/15 text-info border-info/30" },
  Recogida: { label: "Recogida", cls: "bg-success/15 text-success border-success/30" },
};

const invStatusConfig: Record<InvoiceStatus, { label: string; cls: string }> = {
  Pendiente: { label: "Pendiente", cls: "bg-warning/15 text-warning border-warning/30" },
  Validada: { label: "Validada", cls: "bg-info/15 text-info border-info/30" },
  Exportada: { label: "Exportada", cls: "bg-success/15 text-success border-success/30" },
};

const dnStatusConfig: Record<string, { label: string; cls: string }> = {
  Pendiente: { label: "Pendiente", cls: "bg-warning/15 text-warning border-warning/30" },
  Validado: { label: "Validado", cls: "bg-success/15 text-success border-success/30" },
};

export default function Purchases() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading: loadingOC } = usePurchaseOrders();
  const { data: invoices = [], isLoading: loadingInv } = usePurchaseInvoices();
  const { data: deliveryNotes = [], isLoading: loadingDN } = useDeliveryNotes();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: companySettings } = useCompanySettings();
  const [tab, setTab] = useState("oc");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "oc" | "invoice" | "dn"; id: string } | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [filterCollaborator, setFilterCollaborator] = useState("all");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const { services } = useServices();

  // KPIs
  const totalOrdered = useMemo(() => orders.reduce((s, o) => s + (o.totalCost || 0), 0), [orders]);
  const totalInvoiced = useMemo(() => invoices.reduce((s, i) => s + (i.total || 0), 0), [invoices]);
  const totalPending = totalOrdered - totalInvoiced;
  const fmtEur = (v: number) => v.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const map = new Map<string, { pedido: number; facturado: number }>();
    const addMonth = (date: string | null | undefined, field: "pedido" | "facturado", amount: number) => {
      if (!date) return;
      const key = format(new Date(date), "yyyy-MM");
      const cur = map.get(key) || { pedido: 0, facturado: 0 };
      cur[field] += amount;
      map.set(key, cur);
    };
    for (const o of orders) addMonth(o.createdAt, "pedido", o.totalCost || 0);
    for (const i of invoices) addMonth(i.invoiceDate || i.createdAt, "facturado", i.total || 0);
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, vals]) => ({
        month: format(new Date(month + "-01"), "MMM yy", { locale: es }),
        ...vals,
      }));
  }, [orders, invoices]);

  const chartConfig = {
    pedido: { label: "Pedido", color: "hsl(var(--primary))" },
    facturado: { label: "Facturado", color: "hsl(var(--success))" },
  };

  // Build service lookup maps
  const serviceMap = useMemo(() => {
    const map: Record<string, { collaboratorName: string | null; specialty: string }> = {};
    for (const s of services) map[s.id] = { collaboratorName: s.collaboratorName, specialty: s.specialty };
    return map;
  }, [services]);

  // Compute filter options from all data sources
  const supplierOptions = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders) if (o.supplierName) set.add(o.supplierName);
    for (const i of invoices) if (i.supplierName) set.add(i.supplierName);
    for (const d of deliveryNotes) if (d.supplierName) set.add(d.supplierName);
    return Array.from(set).sort();
  }, [orders, invoices, deliveryNotes]);

  const serviceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders) if (o.serviceId) set.add(o.serviceId);
    for (const d of deliveryNotes) if (d.serviceId) set.add(d.serviceId);
    return Array.from(set).sort();
  }, [orders, deliveryNotes]);

  const collaboratorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const sid of serviceOptions) {
      const s = serviceMap[sid];
      if (s?.collaboratorName) set.add(s.collaboratorName);
    }
    return Array.from(set).sort();
  }, [serviceOptions, serviceMap]);

  const specialtyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const sid of serviceOptions) {
      const s = serviceMap[sid];
      if (s?.specialty) set.add(s.specialty);
    }
    return Array.from(set).sort();
  }, [serviceOptions, serviceMap]);

  const statusOptionsForTab = useMemo(() => {
    if (tab === "oc") return Object.keys(ocStatusConfig);
    if (tab === "albaranes") return Object.keys(dnStatusConfig);
    return Object.keys(invStatusConfig);
  }, [tab]);

  const statusLabelMap: Record<string, string> = {
    ...Object.fromEntries(Object.entries(ocStatusConfig).map(([k, v]) => [k, v.label])),
    ...Object.fromEntries(Object.entries(dnStatusConfig).map(([k, v]) => [k, v.label])),
    ...Object.fromEntries(Object.entries(invStatusConfig).map(([k, v]) => [k, v.label])),
  };

  const matchCollabSpecialty = (serviceId: string) => {
    const s = serviceMap[serviceId];
    if (filterCollaborator !== "all" && s?.collaboratorName !== filterCollaborator) return false;
    if (filterSpecialty !== "all" && s?.specialty !== filterSpecialty) return false;
    return true;
  };

  const dateInRange = (d: string | null | undefined) => {
    if (!dateFrom && !dateTo) return true;
    if (!d) return false;
    const date = new Date(d);
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > new Date(dateTo.getTime() + 86400000 - 1)) return false;
    return true;
  };

  const filteredOC = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        (!search || o.id.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.serviceId.toLowerCase().includes(q) ||
        (o.operatorName ?? "").toLowerCase().includes(q)) &&
        dateInRange(o.createdAt) &&
        (filterSupplier === "all" || o.supplierName === filterSupplier) &&
        (filterStatus === "all" || o.status === filterStatus) &&
        (filterService === "all" || o.serviceId === filterService) &&
        matchCollabSpecialty(o.serviceId)
    );
  }, [orders, search, dateFrom, dateTo, filterSupplier, filterStatus, filterService, filterCollaborator, filterSpecialty, serviceMap]);

  const filteredInv = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter(
      (i) =>
        (!search || i.invoiceNumber.toLowerCase().includes(q) ||
        i.supplierInvoiceNumber.toLowerCase().includes(q) ||
        i.supplierName.toLowerCase().includes(q)) &&
        dateInRange(i.invoiceDate || i.createdAt) &&
        (filterSupplier === "all" || i.supplierName === filterSupplier) &&
        (filterStatus === "all" || i.status === filterStatus)
    );
  }, [invoices, search, dateFrom, dateTo, filterSupplier, filterStatus]);

  const filteredDN = useMemo(() => {
    const q = search.toLowerCase();
    return deliveryNotes.filter(
      (d) =>
        (!search || d.code.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q) ||
        d.serviceId.toLowerCase().includes(q) ||
        (d.operatorName ?? "").toLowerCase().includes(q)) &&
        dateInRange(d.createdAt) &&
        (filterSupplier === "all" || d.supplierName === filterSupplier) &&
        (filterStatus === "all" || d.status === filterStatus) &&
        (filterService === "all" || d.serviceId === filterService) &&
        matchCollabSpecialty(d.serviceId)
    );
  }, [deliveryNotes, search, dateFrom, dateTo, filterSupplier, filterStatus, filterService, filterCollaborator, filterSpecialty, serviceMap]);

  // Bulk select per tab - use filtered items with id mapping
  const ocWithId = useMemo(() => filteredOC.map((o) => ({ ...o, id: o.id })), [filteredOC]);
  const dnWithId = useMemo(() => filteredDN.map((d) => ({ ...d, id: d.id })), [filteredDN]);
  const invWithId = useMemo(() => filteredInv.map((i) => ({ ...i, id: i.id })), [filteredInv]);
  const bulkOC = useBulkSelect(ocWithId);
  const bulkDN = useBulkSelect(dnWithId);
  const bulkInv = useBulkSelect(invWithId);
  const activeBulk = tab === "oc" ? bulkOC : tab === "albaranes" ? bulkDN : bulkInv;

  const handleBulkDelete = async () => {
    if (tab === "oc") {
      for (const o of bulkOC.selectedItems) {
        await supabase.from("purchase_order_lines").delete().eq("purchase_order_id", o.id);
        await supabase.from("purchase_orders").delete().eq("id", o.id);
      }
      bulkOC.clear();
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast({ title: `${bulkOC.count} orden(es) eliminada(s)` });
    } else if (tab === "albaranes") {
      for (const d of bulkDN.selectedItems) {
        await supabase.from("delivery_note_lines").delete().eq("delivery_note_id", d.id);
        await supabase.from("delivery_notes").delete().eq("id", d.id);
      }
      bulkDN.clear();
      queryClient.invalidateQueries({ queryKey: ["delivery_notes"] });
      toast({ title: `${bulkDN.count} albarán(es) eliminado(s)` });
    } else {
      for (const i of bulkInv.selectedItems) {
        await supabase.from("purchase_invoice_lines").delete().eq("invoice_id", i.id);
        await supabase.from("purchase_invoices").delete().eq("id", i.id);
      }
      bulkInv.clear();
      queryClient.invalidateQueries({ queryKey: ["purchase_invoices"] });
      toast({ title: `${bulkInv.count} factura(s) eliminada(s)` });
    }
  };

  const handleBulkExport = () => {
    if (tab === "oc") {
      const headers = ["ID", "Servicio", "Proveedor", "Operario", "Estado", "Fecha", "Coste"];
      const rows = bulkOC.selectedItems.map((o) => [o.id, o.serviceId, o.supplierName, o.operatorName ?? "", o.status, format(new Date(o.createdAt), "dd/MM/yyyy"), o.totalCost.toString()]);
      exportCsv("ordenes_compra.csv", headers, rows);
    } else if (tab === "albaranes") {
      const headers = ["Código", "Servicio", "Proveedor", "Operario", "Estado", "Fecha", "Coste"];
      const rows = bulkDN.selectedItems.map((d) => [d.code || d.id.slice(0, 8), d.serviceId, d.supplierName, d.operatorName ?? "", d.status, format(new Date(d.createdAt), "dd/MM/yyyy"), d.totalCost.toString()]);
      exportCsv("albaranes.csv", headers, rows);
    } else {
      const headers = ["Nº Factura", "Nº Proveedor", "Proveedor", "Fecha", "Estado", "Total"];
      const rows = bulkInv.selectedItems.map((i) => [i.invoiceNumber, i.supplierInvoiceNumber, i.supplierName, i.invoiceDate ? format(new Date(i.invoiceDate), "dd/MM/yyyy") : "", i.status, i.total.toString()]);
      exportCsv("facturas_compra.csv", headers, rows);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "oc") {
      await supabase.from("purchase_order_lines").delete().eq("purchase_order_id", deleteTarget.id);
      const { error } = await supabase.from("purchase_orders").delete().eq("id", deleteTarget.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Orden eliminada" }); queryClient.invalidateQueries({ queryKey: ["purchase_orders"] }); }
    } else if (deleteTarget.type === "invoice") {
      await supabase.from("purchase_invoice_lines").delete().eq("invoice_id", deleteTarget.id);
      const { error } = await supabase.from("purchase_invoices").delete().eq("id", deleteTarget.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Factura eliminada" }); queryClient.invalidateQueries({ queryKey: ["purchase_invoices"] }); }
    } else {
      await supabase.from("delivery_note_lines").delete().eq("delivery_note_id", deleteTarget.id);
      const { error } = await supabase.from("delivery_notes").delete().eq("id", deleteTarget.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Albarán eliminado" }); queryClient.invalidateQueries({ queryKey: ["delivery_notes"] }); }
    }
    setDeleteTarget(null);
  };

  const isLoading = loadingOC || loadingInv || loadingDN;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Compras</h1>
        </div>
        <div className="flex items-center gap-2">
          {tab === "oc" && (
            <Button onClick={() => navigate("/compras/nueva")}>
              <Plus className="w-4 h-4 mr-2" /> Nueva OC
            </Button>
          )}
          {tab === "albaranes" && (
            <Button onClick={() => navigate("/compras/albaran/nuevo")}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo albarán
            </Button>
          )}
          {tab === "facturas" && (
            <Button onClick={() => navigate("/compras/factura/nueva")}>
              <Plus className="w-4 h-4 mr-2" /> Nueva factura
            </Button>
          )}
        </div>
      </div>


      <Tabs value={tab} onValueChange={(v) => { setTab(v); setFilterStatus("all"); bulkOC.clear(); bulkDN.clear(); bulkInv.clear(); }}>
        <TabsList className="mb-4">
          <TabsTrigger value="oc" className="gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" /> Órdenes
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{filteredOC.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="albaranes" className="gap-1.5">
            <Truck className="w-3.5 h-3.5" /> Albaranes
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{filteredDN.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="facturas" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Facturas
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{filteredInv.length}</Badge>
          </TabsTrigger>
        </TabsList>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
          <Select value={filterCollaborator} onValueChange={setFilterCollaborator}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <span className="text-muted-foreground mr-1">Colaborador:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {collaboratorOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <span className="text-muted-foreground mr-1">Especialidad:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {specialtyOptions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SearchableSelect
            options={[
              { value: "all", label: "Todos los proveedores" },
              ...supplierOptions.map((s) => ({ value: s, label: s })),
            ]}
            value={filterSupplier}
            onValueChange={setFilterSupplier}
            placeholder="Proveedor"
            searchPlaceholder="Buscar proveedor..."
            emptyText="Sin resultados"
            className="w-[200px] h-9 text-sm"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <span className="text-muted-foreground mr-1">Estado:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statusOptionsForTab.map((s) => (
                <SelectItem key={s} value={s}>{statusLabelMap[s] || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tab !== "facturas" && (
            <SearchableSelect
              options={[
                { value: "all", label: "Todos los servicios" },
                ...serviceOptions.map((s) => ({ value: s, label: s })),
              ]}
              value={filterService}
              onValueChange={setFilterService}
              placeholder="Servicio"
              searchPlaceholder="Buscar servicio..."
              emptyText="Sin resultados"
              className="w-[200px] h-9 text-sm"
            />
          )}
        <DatePresetSelect
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
        />
      </div>

        <TabsContent value="oc" className="mt-4 space-y-4">
          <BulkActionBar count={bulkOC.count} onClear={bulkOC.clear} onDelete={handleBulkDelete} onExport={handleBulkExport} entityName="órdenes" />
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-3 w-10"><Checkbox checked={bulkOC.allSelected} onCheckedChange={bulkOC.toggleAll} className={bulkOC.someSelected ? "data-[state=unchecked]:bg-primary/20" : ""} /></th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">ID</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Servicio</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Proveedor</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Operario</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha</th>
                    <th className="text-right px-5 py-3 text-muted-foreground font-medium">Coste</th>
                    <th className="text-center px-5 py-3 text-muted-foreground font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOC.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No hay órdenes de compra</td></tr>
                  ) : filteredOC.map((o) => {
                    const sc = ocStatusConfig[o.status];
                    return (
                      <tr key={o.id} className={cn("border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer", bulkOC.selectedIds.has(o.id) && "bg-primary/5")} onClick={() => navigate(`/compras/${o.id}`)}>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={bulkOC.selectedIds.has(o.id)} onCheckedChange={() => bulkOC.toggle(o.id)} /></td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{o.id}</td>
                        <td className="px-5 py-3 text-xs">{o.serviceId}</td>
                        <td className="px-5 py-3 font-medium text-card-foreground">{o.supplierName || "—"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{o.operatorName ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", sc.cls)}>{sc.label}</span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">{format(new Date(o.createdAt), "dd MMM yyyy", { locale: es })}</td>
                        <td className="px-5 py-3 text-right font-medium text-card-foreground">€{o.totalCost.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget({ type: "oc", id: o.id })}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="albaranes" className="mt-4 space-y-4">
          <BulkActionBar count={bulkDN.count} onClear={bulkDN.clear} onDelete={handleBulkDelete} onExport={handleBulkExport} entityName="albaranes" />
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-3 w-10"><Checkbox checked={bulkDN.allSelected} onCheckedChange={bulkDN.toggleAll} className={bulkDN.someSelected ? "data-[state=unchecked]:bg-primary/20" : ""} /></th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Código</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Servicio</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Proveedor</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Operario</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha</th>
                    <th className="text-right px-5 py-3 text-muted-foreground font-medium">Coste</th>
                    <th className="text-center px-5 py-3 text-muted-foreground font-medium">PDF</th>
                    <th className="text-center px-5 py-3 text-muted-foreground font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDN.length === 0 ? (
                    <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">No hay albaranes</td></tr>
                  ) : filteredDN.map((dn) => {
                    const sc = dnStatusConfig[dn.status] ?? dnStatusConfig.Pendiente;
                    return (
                      <tr key={dn.id} className={cn("border-b border-border last:border-0 hover:bg-muted/50 transition-colors", bulkDN.selectedIds.has(dn.id) && "bg-primary/5")}>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={bulkDN.selectedIds.has(dn.id)} onCheckedChange={() => bulkDN.toggle(dn.id)} /></td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{dn.code || dn.id.slice(0, 8)}</td>
                        <td className="px-5 py-3 text-xs">{dn.serviceId}</td>
                        <td className="px-5 py-3 font-medium text-card-foreground">{dn.supplierName || "—"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{dn.operatorName ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", sc.cls)}>{sc.label}</span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">{format(new Date(dn.createdAt), "dd MMM yyyy", { locale: es })}</td>
                        <td className="px-5 py-3 text-right font-medium text-card-foreground">€{dn.totalCost.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3 text-center">
                          <SignedPdfLink path={dn.pdfPath} bucket="delivery-notes" />
                        </td>
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <TooltipProvider><Tooltip><TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                const co = companySettings;
                                generateDocumentPdf({
                                  type: "Albarán",
                                  id: dn.code || dn.id.slice(0, 8),
                                  date: formatDate(new Date(dn.createdAt), "dd/MM/yyyy"),
                                  company: { companyName: co?.company_name || "UrbanGoBO", logoUrl: co?.logo_url, taxId: co?.tax_id, address: co?.address, documentFooter: co?.document_footer },
                                  recipientName: dn.supplierName,
                                  infoFields: [{ label: "Servicio", value: dn.serviceId }, { label: "Operario", value: dn.operatorName || "—" }, { label: "Estado", value: dn.status }],
                                  lines: dn.lines.map((l) => ({ description: l.articleName + (l.description ? ` — ${l.description}` : ""), units: l.units, unitPrice: l.costPrice, total: l.units * l.costPrice })),
                                  subtotal: dn.totalCost, taxBreakdown: [], total: dn.totalCost, notes: dn.notes || undefined,
                                });
                              }}>
                                <Download className="w-3.5 h-3.5 text-primary" />
                              </Button>
                            </TooltipTrigger><TooltipContent>Generar PDF</TooltipContent></Tooltip></TooltipProvider>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget({ type: "dn", id: dn.id })}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="facturas" className="mt-4 space-y-4">
          <BulkActionBar count={bulkInv.count} onClear={bulkInv.clear} onDelete={handleBulkDelete} onExport={handleBulkExport} entityName="facturas" />
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                     <th className="px-3 py-3 w-10"><Checkbox checked={bulkInv.allSelected} onCheckedChange={bulkInv.toggleAll} className={bulkInv.someSelected ? "data-[state=unchecked]:bg-primary/20" : ""} /></th>
                     <th className="text-left px-5 py-3 text-muted-foreground font-medium">Nº Factura</th>
                     <th className="text-left px-5 py-3 text-muted-foreground font-medium">Nº Proveedor</th>
                     <th className="text-left px-5 py-3 text-muted-foreground font-medium">Proveedor</th>
                     <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha</th>
                     <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                     <th className="text-right px-5 py-3 text-muted-foreground font-medium">Total</th>
                     <th className="text-left px-5 py-3 text-muted-foreground font-medium">Notas</th>
                     <th className="text-center px-5 py-3 text-muted-foreground font-medium">PDF</th>
                     <th className="text-center px-5 py-3 text-muted-foreground font-medium">Acciones</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredInv.length === 0 ? (
                     <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">No hay facturas</td></tr>
                   ) : filteredInv.map((inv) => {
                     const sc = invStatusConfig[inv.status];
                     return (
                       <tr key={inv.id} className={cn("border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer", bulkInv.selectedIds.has(inv.id) && "bg-primary/5")}>
                         <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={bulkInv.selectedIds.has(inv.id)} onCheckedChange={() => bulkInv.toggle(inv.id)} /></td>
                         <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{inv.invoiceNumber || "—"}</td>
                         <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{inv.supplierInvoiceNumber || "—"}</td>
                         <td className="px-5 py-3 font-medium text-card-foreground">{inv.supplierName || "—"}</td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {inv.invoiceDate ? format(new Date(inv.invoiceDate), "dd MMM yyyy", { locale: es }) : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", sc.cls)}>{sc.label}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-card-foreground">€{inv.total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{inv.notes || "—"}</td>
                        <td className="px-5 py-3 text-center">
                          <SignedPdfLink path={inv.pdfPath} bucket="purchase-docs" />
                        </td>
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <TooltipProvider><Tooltip><TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                const co = companySettings;
                                const invLines = inv.lines;
                                const taxByRate: Record<number, number> = {};
                                invLines.forEach((l) => { const base = l.units * l.unitPrice; taxByRate[l.taxRate] = (taxByRate[l.taxRate] || 0) + base * (l.taxRate / 100); });
                                generateDocumentPdf({
                                  type: "Factura de Compra", id: inv.invoiceNumber || inv.id.slice(0, 8),
                                  date: inv.invoiceDate ? formatDate(new Date(inv.invoiceDate), "dd/MM/yyyy") : formatDate(new Date(inv.createdAt), "dd/MM/yyyy"),
                                  company: { companyName: co?.company_name || "UrbanGoBO", logoUrl: co?.logo_url, taxId: co?.tax_id, address: co?.address, documentFooter: co?.document_footer },
                                  recipientName: inv.supplierName,
                                  infoFields: [...(inv.dueDate ? [{ label: "Vencimiento", value: formatDate(new Date(inv.dueDate), "dd/MM/yyyy") }] : []), { label: "Estado", value: inv.status }],
                                  lines: invLines.map((l) => ({ description: l.description, units: l.units, unitPrice: l.unitPrice, taxRate: l.taxRate, total: l.total })),
                                  subtotal: inv.subtotal,
                                  taxBreakdown: Object.entries(taxByRate).map(([rate, amount]) => ({ rate: Number(rate), amount })),
                                  total: inv.total, notes: inv.notes || undefined,
                                });
                              }}>
                                <Download className="w-3.5 h-3.5 text-primary" />
                              </Button>
                            </TooltipTrigger><TooltipContent>Generar PDF</TooltipContent></Tooltip></TooltipProvider>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget({ type: "invoice", id: inv.id })}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {deleteTarget?.type === "oc" ? "orden" : deleteTarget?.type === "dn" ? "albarán" : "factura"}?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
