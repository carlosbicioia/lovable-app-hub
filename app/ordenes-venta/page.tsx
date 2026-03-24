"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Search, Filter, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useSalesOrders, useUpdateSalesOrder, SalesOrder } from "@/hooks/useSalesOrders";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import { useCollaborators } from "@/hooks/useCollaborators";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function SalesOrders() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useSalesOrders();
  const { collaborators } = useCollaborators();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sending, setSending] = useState(false);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName.toLowerCase().includes(search.toLowerCase()) ||
      o.serviceId.toLowerCase().includes(search.toLowerCase()) ||
      o.budgetId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const { selectedIds, selectedItems, toggle, toggleAll, clear, allSelected, someSelected, count } =
    useBulkSelect(filtered);

  const totalPendiente = orders.filter((o) => o.status === "Pendiente").reduce((s, o) => s + o.total, 0);
  const totalLiquidada = orders.filter((o) => o.status === "Liquidada").reduce((s, o) => s + o.total, 0);

  const sendToHolded = async () => {
    const pendingOrders = selectedItems.filter((o) => !o.sentToHolded);
    if (pendingOrders.length === 0) {
      toast.warning("Todas las órdenes seleccionadas ya fueron enviadas a Holded");
      return;
    }

    setSending(true);
    try {
      const services = pendingOrders.map((o) => ({
        id: o.serviceId,
        clientName: o.clientName,
        clientId: "",
        address: o.clientAddress,
        budgetTotal: o.total,
        specialty: "",
        description: "",
      }));

      const budgets = pendingOrders.map((o) => ({
        id: o.budgetId,
        serviceId: o.serviceId,
        clientName: o.clientName,
        lines: o.lines.map((l) => ({
          concept: l.concept,
          description: l.description || "",
          units: l.units,
          costPrice: l.costPrice,
          margin: l.margin,
          taxRate: l.taxRate,
        })),
      }));

      const { data, error } = await supabase.functions.invoke("export-holded", {
        body: { services, budgets, type: "invoice" },
      });

      if (error) throw error;

      const successResults = (data?.results || []).filter((r: any) => !r.error);
      const now = new Date().toISOString();

      for (const result of successResults) {
        const order = pendingOrders.find((o) => o.serviceId === result.serviceId);
        if (!order) continue;

        await supabase.from("sales_orders").update({
          sent_to_holded: true,
          sent_to_holded_at: now,
          holded_doc_id: result.holdedInvoiceId || null,
          status: "Liquidada",
        }).eq("id", order.id);

        await supabase.from("services").update({ status: "Liquidado" }).eq("id", order.serviceId);
      }

      const failedCount = (data?.results || []).filter((r: any) => r.error).length;

      if (successResults.length > 0) {
        toast.success(`${successResults.length} orden(es) enviada(s) a Holded y servicio(s) liquidado(s)`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} orden(es) fallaron al enviar`);
      }

      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      clear();
    } catch (err: any) {
      toast.error(err.message || "Error al enviar a Holded");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Órdenes de Venta</h1>
        <p className="text-sm text-muted-foreground">Gestión de órdenes generadas a partir de presupuestos finalizados</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total órdenes</p><p className="text-2xl font-bold text-card-foreground">{orders.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pendientes</p><p className="text-2xl font-bold text-warning">{totalPendiente.toFixed(2)} €</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Liquidadas</p><p className="text-2xl font-bold text-success">{totalLiquidada.toFixed(2)} €</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nº orden, cliente, servicio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Pendiente">Pendiente</SelectItem>
            <SelectItem value="Liquidada">Liquidada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {count > 0 && (
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 animate-in slide-in-from-top-2 duration-200">
          <span className="text-sm font-medium text-primary">{count} {count === 1 ? "seleccionada" : "seleccionadas"}</span>
          <div className="h-4 w-px bg-primary/20" />
          <Button size="sm" onClick={sendToHolded} disabled={sending} className="h-8 text-xs gap-1.5">
            <Send className="w-3.5 h-3.5" />
            {sending ? "Enviando..." : `Enviar a Holded (${selectedItems.filter(o => !o.sentToHolded).length})`}
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clear}><span className="sr-only">Limpiar selección</span>✕</Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No hay órdenes de venta</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Seleccionar todas" {...(someSelected ? { "data-state": "indeterminate" } : {})} />
                  </TableHead>
                  <TableHead>Nº Orden</TableHead>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Holded</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id} className={cn("cursor-pointer hover:bg-muted/50", selectedIds.has(o.id) && "bg-primary/5")}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(o.id)} onCheckedChange={() => toggle(o.id)} aria-label={`Seleccionar ${o.id}`} />
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => router.push(`/servicios/${o.serviceId}`)}>{o.id}</TableCell>
                    <TableCell className="text-muted-foreground" onClick={() => router.push(`/servicios/${o.serviceId}`)}>{o.budgetId}</TableCell>
                    <TableCell className="text-muted-foreground" onClick={() => router.push(`/servicios/${o.serviceId}`)}>{o.serviceId}</TableCell>
                    <TableCell onClick={() => router.push(`/servicios/${o.serviceId}`)}>{o.clientName}</TableCell>
                    <TableCell className="text-right font-medium" onClick={() => router.push(`/servicios/${o.serviceId}`)}>{o.total.toFixed(2)} €</TableCell>
                    <TableCell onClick={() => router.push(`/servicios/${o.serviceId}`)}>
                      {(() => {
                        if (!o.collaboratorName) return <span className="text-xs text-muted-foreground">—</span>;
                        const collab = collaborators.find((c) => c.companyName === o.collaboratorName);
                        const rate = collab?.commissionRate ?? 0;
                        if (rate <= 0) return <span className="text-xs text-muted-foreground">—</span>;
                        const commission = Math.round(o.total * rate) / 100;
                        return <span className="text-xs text-warning font-medium">{rate}% (−{commission.toFixed(2)} €)</span>;
                      })()}
                    </TableCell>
                    <TableCell onClick={() => router.push(`/servicios/${o.serviceId}`)}>
                      <Badge variant="outline" className={cn("text-[10px]", o.status === "Liquidada" ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30")}>{o.status}</Badge>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/servicios/${o.serviceId}`)}>
                      {o.sentToHolded ? <Badge variant="outline" className="text-[10px] bg-info/15 text-info border-info/30">Enviada</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm" onClick={() => router.push(`/servicios/${o.serviceId}`)}>
                      {format(new Date(o.createdAt), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
