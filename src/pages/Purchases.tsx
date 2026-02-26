import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePurchaseOrders, PurchaseOrderStatus } from "@/hooks/usePurchaseOrders";
import { usePurchaseInvoices, InvoiceStatus } from "@/hooks/usePurchaseInvoices";
import { useDeliveryNotes } from "@/hooks/useDeliveryNotes";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Loader2, ShoppingCart, FileText, Pencil, Trash2, CheckCircle2 } from "lucide-react";

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

export default function Purchases() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading: loadingOC } = usePurchaseOrders();
  const { data: invoices = [], isLoading: loadingInv } = usePurchaseInvoices();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState("oc");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "oc" | "invoice"; id: string } | null>(null);

  const filteredOC = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.serviceId.toLowerCase().includes(q) ||
        (o.operatorName ?? "").toLowerCase().includes(q)
    );
  }, [orders, search]);

  const filteredInv = useMemo(() => {
    if (!search) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (i) =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.supplierName.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "oc") {
      await supabase.from("purchase_order_lines").delete().eq("purchase_order_id", deleteTarget.id);
      const { error } = await supabase.from("purchase_orders").delete().eq("id", deleteTarget.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Orden eliminada" }); queryClient.invalidateQueries({ queryKey: ["purchase_orders"] }); }
    } else {
      await supabase.from("purchase_invoice_lines").delete().eq("invoice_id", deleteTarget.id);
      const { error } = await supabase.from("purchase_invoices").delete().eq("id", deleteTarget.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Factura eliminada" }); queryClient.invalidateQueries({ queryKey: ["purchase_invoices"] }); }
    }
    setDeleteTarget(null);
  };

  const isLoading = loadingOC || loadingInv;

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
          <p className="text-muted-foreground text-sm mt-1">
            {orders.length} órdenes de compra · {invoices.length} facturas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "oc" && (
            <Button onClick={() => navigate("/compras/nueva")}>
              <Plus className="w-4 h-4 mr-2" /> Nueva OC
            </Button>
          )}
          {tab === "facturas" && (
            <Button onClick={() => navigate("/compras/factura/nueva")}>
              <Plus className="w-4 h-4 mr-2" /> Nueva factura
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="oc" className="gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" /> Órdenes de compra
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{orders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="facturas" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Facturas
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{invoices.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <TabsContent value="oc" className="mt-4">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
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
                    <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No hay órdenes de compra</td></tr>
                  ) : filteredOC.map((o) => {
                    const sc = ocStatusConfig[o.status];
                    return (
                      <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/compras/${o.id}`)}>
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

        <TabsContent value="facturas" className="mt-4">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Nº Factura</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Proveedor</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                    <th className="text-right px-5 py-3 text-muted-foreground font-medium">Total</th>
                    <th className="text-center px-5 py-3 text-muted-foreground font-medium">PDF</th>
                    <th className="text-center px-5 py-3 text-muted-foreground font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInv.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No hay facturas</td></tr>
                  ) : filteredInv.map((inv) => {
                    const sc = invStatusConfig[inv.status];
                    return (
                      <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{inv.invoiceNumber || "—"}</td>
                        <td className="px-5 py-3 font-medium text-card-foreground">{inv.supplierName || "—"}</td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {inv.invoiceDate ? format(new Date(inv.invoiceDate), "dd MMM yyyy", { locale: es }) : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", sc.cls)}>{sc.label}</span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-card-foreground">€{inv.total.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-3 text-center">
                          {inv.pdfPath ? (
                            <a href={inv.pdfPath} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs" onClick={(e) => e.stopPropagation()}>Ver PDF</a>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
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
            <AlertDialogTitle>¿Eliminar {deleteTarget?.type === "oc" ? "orden" : "factura"}?</AlertDialogTitle>
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
