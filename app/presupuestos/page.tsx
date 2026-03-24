"use client";

import { Search, Plus, Receipt, Loader2, CheckCircle2, List, Columns3, Trash2, Filter, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { BudgetStatus } from "@/types/urbango";
import { useBudgets } from "@/hooks/useBudgets";
import { useServices } from "@/hooks/useServices";
import { useCreateSalesOrder } from "@/hooks/useSalesOrders";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useBatchProtocolChecks } from "@/hooks/useBatchProtocolChecks";
import ProtocolDots, { type ProtocolStep } from "@/components/shared/ProtocolDots";
import { useEnabledProtocolSteps } from "@/hooks/useProtocolSteps";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BudgetKanban from "@/components/budgets/BudgetKanban";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DatePresetSelect from "@/components/shared/DatePresetSelect";

const statusConfig: Record<BudgetStatus, { label: string; className: string }> = {
  Borrador: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  Enviado: { label: "Enviado", className: "bg-info/15 text-info" },
  Aprobado: { label: "Aprobado", className: "bg-success/15 text-success" },
  Rechazado: { label: "Rechazado", className: "bg-destructive/15 text-destructive" },
  Pte_Facturación: { label: "En proceso", className: "bg-warning/15 text-warning" },
  Finalizado: { label: "Finalizado", className: "bg-primary/15 text-primary" },
};

const allStatuses: BudgetStatus[] = ["Borrador", "Enviado", "Aprobado", "Rechazado", "Pte_Facturación", "Finalizado"];

function calcBudgetTotals(lines: { costPrice: number; margin: number; units: number; taxRate: number }[]) {
  let subtotal = 0;
  let totalTax = 0;
  for (const l of lines) {
    const salePrice = Math.round(l.costPrice * (1 + l.margin / 100) * 100) / 100;
    const lineTotal = Math.round(salePrice * l.units * 100) / 100;
    subtotal += lineTotal;
    totalTax += Math.round(lineTotal * (l.taxRate / 100) * 100) / 100;
  }
  return { subtotal, totalTax, total: subtotal + totalTax };
}

export default function Budgets() {
  const [search, setSearch] = useState("");
  const [filterCollaborator, setFilterCollaborator] = useState<string>("all");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [salesOrderPromptBudgetId, setSalesOrderPromptBudgetId] = useState<string | null>(null);
  const [creatingSalesOrder, setCreatingSalesOrder] = useState(false);
  const router = useRouter();
  const { budgets, updateBudgetStatus } = useBudgets();
  const { services } = useServices();
  const createSalesOrder = useCreateSalesOrder();
  const { data: companySettings } = useCompanySettings();

  const { data: enabledSteps = [] } = useEnabledProtocolSteps();
  const protocolSteps: ProtocolStep[] = useMemo(
    () => enabledSteps.map((s) => ({ id: s.stepId, label: s.label })),
    [enabledSteps]
  );

  const budgetServiceIds = useMemo(() => [...new Set(budgets.map((b) => b.serviceId))], [budgets]);
  const { data: protocolChecksMap } = useBatchProtocolChecks(budgetServiceIds);

  const [sendingProforma, setSendingProforma] = useState<string | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  const serviceSpecialtyMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of services) map[s.id] = s.specialty;
    return map;
  }, [services]);

  const collaboratorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of budgets) if (b.collaboratorName) set.add(b.collaboratorName);
    return Array.from(set).sort();
  }, [budgets]);

  const specialtyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of budgets) {
      const sp = serviceSpecialtyMap[b.serviceId];
      if (sp) set.add(sp);
    }
    return Array.from(set).sort();
  }, [budgets, serviceSpecialtyMap]);

  const serviceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of budgets) set.add(b.serviceId);
    return Array.from(set).sort();
  }, [budgets]);

  const filtered = budgets.filter((b) => {
    const matchSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.clientName.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceId.toLowerCase().includes(search.toLowerCase());
    const matchCollaborator = filterCollaborator === "all" || b.collaboratorName === filterCollaborator;
    const matchSpecialty = filterSpecialty === "all" || serviceSpecialtyMap[b.serviceId] === filterSpecialty;
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchService = filterService === "all" || b.serviceId === filterService;
    const budgetDate = new Date(b.createdAt);
    const matchDateFrom = !dateFrom || budgetDate >= dateFrom;
    const matchDateTo = !dateTo || budgetDate <= new Date(dateTo.getTime() + 86400000 - 1);
    return matchSearch && matchCollaborator && matchSpecialty && matchStatus && matchService && matchDateFrom && matchDateTo;
  });

  const BUDGET_TRANSITIONS: Record<BudgetStatus, BudgetStatus[]> = {
    Borrador: ["Enviado", "Rechazado"],
    Enviado: ["Aprobado", "Rechazado", "Borrador"],
    Aprobado: ["Pte_Facturación", "Finalizado", "Rechazado"],
    Rechazado: ["Borrador"],
    Pte_Facturación: ["Finalizado"],
    Finalizado: [],
  };

  const [pendingReject, setPendingReject] = useState<string | null>(null);

  const handleStatusChange = (budgetId: string, newStatus: BudgetStatus) => {
    const budget = budgets.find((b) => b.id === budgetId);
    if (!budget) return;

    const allowed = BUDGET_TRANSITIONS[budget.status] || [];
    if (!allowed.includes(newStatus)) {
      toast.error(`No se puede cambiar de "${statusConfig[budget.status].label}" a "${statusConfig[newStatus].label}"`);
      return;
    }

    if (newStatus === "Rechazado") { setPendingReject(budgetId); return; }

    if (newStatus === "Finalizado") {
      updateBudgetStatus(budgetId, newStatus);
      toast.success(`Estado actualizado a "${statusConfig[newStatus].label}"`);
      setSalesOrderPromptBudgetId(budgetId);
      return;
    }
    updateBudgetStatus(budgetId, newStatus);
    toast.success(`Estado actualizado a "${statusConfig[newStatus].label}"`);
  };

  const confirmReject = () => {
    if (pendingReject) {
      updateBudgetStatus(pendingReject, "Rechazado");
      toast.success("Presupuesto rechazado");
      setPendingReject(null);
    }
  };

  const handleCreateSalesOrder = async () => {
    if (!salesOrderPromptBudgetId) return;
    const budget = budgets.find((b) => b.id === salesOrderPromptBudgetId);
    if (!budget) return;
    setCreatingSalesOrder(true);
    try {
      const orderId = `OV-${budget.id}`;
      const { total } = calcBudgetTotals(budget.lines);
      await createSalesOrder.mutateAsync({
        id: orderId,
        budgetId: budget.id,
        serviceId: budget.serviceId,
        clientName: budget.clientName,
        clientAddress: budget.clientAddress,
        collaboratorName: budget.collaboratorName,
        total,
        lines: budget.lines.map((l, i) => ({
          concept: l.concept,
          description: l.description || null,
          units: l.units,
          costPrice: l.costPrice,
          margin: l.margin,
          taxRate: l.taxRate,
          sortOrder: i,
        })),
      });
      toast.success(`Orden de venta ${orderId} creada`);
    } catch (err: any) {
      toast.error(err.message || "Error al crear la orden de venta");
    } finally {
      setCreatingSalesOrder(false);
      setSalesOrderPromptBudgetId(null);
    }
  };

  const handleMarkProformaPaid = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from("budgets")
        .update({ proforma_paid: true, proforma_paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", budgetId);
      if (error) throw error;
      toast.success("Proforma marcada como pagada");
    } catch (err: any) {
      toast.error(err.message || "Error al marcar proforma como pagada");
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await supabase.from("budget_lines").delete().eq("budget_id", budgetId);
      const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
      if (error) throw error;
      toast.success("Presupuesto eliminado");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar presupuesto");
    } finally {
      setDeletingBudgetId(null);
    }
  };

  const handleSendProforma = async (budget: typeof budgets[0]) => {
    setSendingProforma(budget.id);
    try {
      const { data, error } = await supabase.functions.invoke("export-holded", {
        body: {
          services: [{ id: budget.serviceId, clientName: budget.clientName, clientId: "", budgetTotal: null, specialty: "", description: budget.serviceName }],
          budgets: [budget],
          type: "proforma",
          percentage: 50,
        },
      });
      if (error) throw error;
      await supabase.from("budgets").update({ proforma_sent: true, proforma_sent_at: new Date().toISOString() }).eq("id", budget.id);
      toast.success(`Proforma del 50% enviada a Holded para ${budget.id}`);
    } catch (err: any) {
      console.error("Error sending proforma:", err);
      toast.error(err.message || "Error al enviar proforma a Holded");
    } finally {
      setSendingProforma(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Presupuestos</h1>
          <p className="text-muted-foreground text-sm mt-1">{budgets.length} presupuestos</p>
        </div>
        <Button onClick={() => router.push("/presupuestos/nuevo")}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Presupuesto
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por ID, cliente o servicio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCollaborator} onValueChange={setFilterCollaborator}>
            <SelectTrigger className="w-[200px] h-9 text-sm"><span className="text-muted-foreground mr-1">Colaborador:</span><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem>{collaboratorOptions.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
          </Select>
          <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
            <SelectTrigger className="w-[200px] h-9 text-sm"><span className="text-muted-foreground mr-1">Especialidad:</span><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas</SelectItem>{specialtyOptions.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] h-9 text-sm"><span className="text-muted-foreground mr-1">Estado:</span><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem>{allStatuses.map((s) => (<SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>))}</SelectContent>
          </Select>
          <SearchableSelect
            options={[{ value: "all", label: "Todos los servicios" }, ...serviceOptions.map((s) => ({ value: s, label: s }))]}
            value={filterService}
            onValueChange={setFilterService}
            placeholder="Servicio"
            searchPlaceholder="Buscar servicio..."
            emptyText="Sin resultados"
            className="w-[200px] h-9 text-sm"
          />
          <DatePresetSelect
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
          />
          <TabsList className="ml-auto">
            <TabsTrigger value="list" className="gap-1.5"><List className="w-4 h-4" /> Lista</TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1.5"><Columns3 className="w-4 h-4" /> Kanban</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Nº Presupuesto</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Servicio</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Cliente</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha</th>
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                    <th className="text-right px-5 py-3 text-muted-foreground font-medium">Subtotal</th>
                    <th className="text-right px-5 py-3 text-muted-foreground font-medium">IVA</th>
                    <th className="text-right px-5 py-3 text-muted-foreground font-medium">Total</th>
                    <th className="text-center px-5 py-3 text-muted-foreground font-medium">Protocolo</th>
                    <th className="text-center px-5 py-3 text-muted-foreground font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const { subtotal, totalTax, total } = calcBudgetTotals(b.lines);
                    const cfg = statusConfig[b.status];
                    return (
                      <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground cursor-pointer" onClick={() => router.push(`/presupuestos/${b.id}`)}>{b.id}</td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground cursor-pointer" onClick={() => router.push(`/presupuestos/${b.id}`)}>{b.serviceId}</td>
                        <td className="px-5 py-3 font-medium text-card-foreground cursor-pointer" onClick={() => router.push(`/presupuestos/${b.id}`)}>{b.clientName}</td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">{format(new Date(b.createdAt), "dd MMM yyyy", { locale: es })}</td>
                        <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const allowedTransitions = BUDGET_TRANSITIONS[b.status] || [];
                            return (
                              <Select value={b.status} onValueChange={(v) => handleStatusChange(b.id, v as BudgetStatus)}>
                                <SelectTrigger className={cn("h-7 w-[140px] text-xs font-medium border-0", cfg.className)}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {allStatuses.map((s) => (
                                    <SelectItem key={s} value={s} className="text-xs" disabled={s !== b.status && !allowedTransitions.includes(s)}>
                                      {statusConfig[s].label}{s === b.status && " ✓"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-3 text-right text-card-foreground">{subtotal.toFixed(2)} €</td>
                        <td className="px-5 py-3 text-right text-muted-foreground">{totalTax.toFixed(2)} €</td>
                        <td className="px-5 py-3 text-right font-medium text-card-foreground">{total.toFixed(2)} €</td>
                        <td className="px-5 py-3">
                          <TooltipProvider delayDuration={200}>
                            <ProtocolDots steps={protocolSteps} checkedIds={protocolChecksMap[b.serviceId] ?? new Set()} />
                          </TooltipProvider>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <TooltipProvider delayDuration={200}>
                            <div className="flex items-center justify-center gap-1">
                              {b.status === "Aprobado" && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className={cn("h-8 w-8", b.proformaSent && "text-success")} disabled={sendingProforma === b.id} onClick={(e) => { e.stopPropagation(); if (!b.proformaSent) handleSendProforma(b); }}>
                                        {sendingProforma === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{b.proformaSent ? "Proforma emitida" : "Emitir proforma del 50%"}</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className={cn("h-8 w-8", b.proformaPaid && "text-success")} onClick={(e) => { e.stopPropagation(); if (!b.proformaPaid) handleMarkProformaPaid(b.id); }}>
                                        <CheckCircle2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{b.proformaPaid ? "Proforma pagada" : "Marcar proforma como pagada"}</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingBudgetId(b.id); }}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar presupuesto</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <BudgetKanban budgets={filtered} onStatusChange={handleStatusChange} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deletingBudgetId} onOpenChange={(open) => { if (!open) setDeletingBudgetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminarán el presupuesto <span className="font-semibold">{deletingBudgetId}</span> y todas sus líneas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletingBudgetId && handleDeleteBudget(deletingBudgetId)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!salesOrderPromptBudgetId} onOpenChange={(open) => { if (!open) setSalesOrderPromptBudgetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> ¿Emitir orden de venta?</AlertDialogTitle>
            <AlertDialogDescription>El presupuesto ha sido finalizado. ¿Quieres generar la orden de venta correspondiente? Las líneas se copiarán automáticamente del presupuesto.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creatingSalesOrder}>Más tarde</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateSalesOrder} disabled={creatingSalesOrder}>
              {creatingSalesOrder ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Crear orden de venta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingReject} onOpenChange={(open) => { if (!open) setPendingReject(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>Vas a rechazar el presupuesto <span className="font-semibold">{pendingReject}</span>. Esta acción cambiará el estado a "Rechazado".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmReject}>Rechazar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
