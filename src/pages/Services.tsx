import { useServices } from "@/hooks/useServices";
import { useAppUsers } from "@/hooks/useAppUsers";
import { useBatchProtocolChecks } from "@/hooks/useBatchProtocolChecks";
import { useEnabledProtocolSteps } from "@/hooks/useProtocolSteps";
import ProtocolDots, { type ProtocolStep } from "@/components/shared/ProtocolDots";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Search, Plus, Filter, FileText, Upload, Loader2, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { useState, useMemo, useCallback, useEffect } from "react";
import { differenceInHours, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBudgets } from "@/hooks/useBudgets";
import { useBranches } from "@/hooks/useBranches";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/shared/BulkActionBar";
import { exportCsv } from "@/lib/exportCsv";
import SearchableSelect from "@/components/shared/SearchableSelect";
import DatePresetSelect from "@/components/shared/DatePresetSelect";
import type { BudgetStatus, Service, ServiceStatus, UrgencyLevel } from "@/types/urbango";

const statusOptions: { value: ServiceStatus; label: string }[] = [
  { value: "Pendiente_Contacto", label: "Pte. Contacto" },
  { value: "Pte_Asignacion", label: "Pte. Asignación" },
  { value: "Asignado", label: "Asignado" },
  { value: "Agendado", label: "Agendado" },
  { value: "En_Curso", label: "En Curso" },
  { value: "Finalizado", label: "Finalizado" },
  { value: "Liquidado", label: "Liquidado" },
];

const urgencyOptions: { value: UrgencyLevel; label: string }[] = [
  { value: "Estándar", label: "Estándar" },
  { value: "24h", label: "24h" },
  { value: "Inmediato", label: "Urgente" },
];

type TabValue = "all" | "billing";

export default function Services() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabValue>("all");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>(
    searchParams.get("urgency") === "urgent" ? "no_estandar" : "all"
  );
  const [filterCollaborator, setFilterCollaborator] = useState<string>("all");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const { budgets } = useBudgets();
  const { data: branches = [] } = useBranches();
  const activeBranches = branches.filter((b) => b.active);
  const { services, loading, updateService, refetch } = useServices();
  const { toast } = useToast();
  const { data: appUsers = [] } = useAppUsers();

  const operators = useMemo(
    () => appUsers.filter((u) => u.role === "operario" && u.active),
    [appUsers]
  );

  const serviceIds = useMemo(() => services.map((s) => s.id), [services]);
  const { data: protocolChecksMap, toggle: toggleProtocolCheck } = useBatchProtocolChecks(serviceIds);
  const { data: enabledSteps = [] } = useEnabledProtocolSteps();
  const protocolSteps: ProtocolStep[] = useMemo(
    () => enabledSteps.map((s) => ({ id: s.stepId, label: s.label })),
    [enabledSteps]
  );

  const handleStatusChange = async (serviceId: string, newStatus: string) => {
    const updates: Record<string, any> = { status: newStatus };
    if (newStatus === "Agendado" || newStatus === "En_Curso" || newStatus === "Finalizado") {
      const svc = services.find(s => s.id === serviceId);
      if (svc && !svc.contactedAt) updates.contacted_at = new Date().toISOString();
    }
    const { error } = await updateService(serviceId, updates);
    if (error) toast({ title: "Error", description: "No se pudo cambiar el estado", variant: "destructive" });
  };

  const handleUrgencyChange = async (serviceId: string, newUrgency: string) => {
    const { error } = await updateService(serviceId, { urgency: newUrgency });
    if (error) toast({ title: "Error", description: "No se pudo cambiar la urgencia", variant: "destructive" });
  };

  const getBudgetStatusForService = (serviceId: string): BudgetStatus | null => {
    const budget = budgets.find((b) => b.serviceId === serviceId);
    return budget?.status ?? null;
  };

  // Filter options
  const collaboratorOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) if (s.collaboratorName) set.add(s.collaboratorName);
    return Array.from(set).sort();
  }, [services]);

  const specialtyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) if (s.specialty) set.add(s.specialty);
    return Array.from(set).sort();
  }, [services]);

  const serviceIdOptions = useMemo(() => services.map((s) => s.id).sort(), [services]);

  const filtered = useMemo(() => {
    let list = services;
    if (tab === "billing") {
      list = list.filter((s) => getBudgetStatusForService(s.id) === "Pte_Facturación");
    }
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    if (urgencyFilter === "no_estandar") {
      list = list.filter((s) => s.urgency !== "Estándar" && !["Finalizado", "Liquidado", "Cancelado"].includes(s.status));
    } else if (urgencyFilter !== "all") {
      list = list.filter((s) => s.urgency === urgencyFilter);
    }
    if (filterCollaborator !== "all") list = list.filter((s) => s.collaboratorName === filterCollaborator);
    if (filterSpecialty !== "all") list = list.filter((s) => s.specialty === filterSpecialty);
    if (filterBranch !== "all") list = list.filter((s) => s.branchId === filterBranch);
    if (filterService !== "all") list = list.filter((s) => s.id === filterService);
    if (dateFrom) list = list.filter((s) => new Date(s.receivedAt) >= dateFrom);
    if (dateTo) list = list.filter((s) => new Date(s.receivedAt) <= new Date(dateTo.getTime() + 86400000 - 1));
    if (search) {
      list = list.filter((s) => s.clientName.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()));
    }
    return list;
  }, [services, budgets, tab, search, statusFilter, urgencyFilter, filterCollaborator, filterSpecialty, filterBranch, filterService, dateFrom, dateTo]);

  const bulk = useBulkSelect(filtered);

  const billingCount = useMemo(
    () => services.filter((s) => getBudgetStatusForService(s.id) === "Pte_Facturación").length,
    [services, budgets]
  );

  const getSlaStatus = (receivedAt: string, contactedAt: string | null) => {
    if (contactedAt) return null;
    const hours = differenceInHours(new Date(), new Date(receivedAt));
    if (hours >= 12) return "expired";
    if (hours >= 8) return "warning";
    return "ok";
  };

  const closedStatuses = ["Finalizado", "Liquidado"];

  const handleExportHolded = async () => {
    const ids = Array.from(bulk.selectedIds);
    if (ids.length === 0) {
      toast({ title: "Selecciona al menos un servicio", variant: "destructive" });
      return;
    }
    const servicesToExport = filtered.filter((s) => ids.includes(s.id));
    const nonClosed = servicesToExport.filter((s) => !closedStatuses.includes(s.status));
    if (nonClosed.length > 0) {
      toast({ title: "Servicios no cerrados", description: `No se puede facturar: ${nonClosed.map((s) => s.id).join(", ")}`, variant: "destructive" });
      return;
    }
    setExporting(true);
    try {
      const budgetsToExport = budgets.filter((b) => ids.includes(b.serviceId));
      const { data, error } = await supabase.functions.invoke("export-holded", {
        body: { services: servicesToExport, budgets: budgetsToExport, type: "invoice" },
      });
      if (error) throw error;
      toast({ title: "Exportación completada", description: `${ids.length} servicio(s) enviados a Holded correctamente.` });
      bulk.clear();
    } catch (err: any) {
      toast({ title: "Error al exportar", description: err.message || "No se pudo conectar con Holded", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = bulk.selectedItems.map((s) => s.id);
    for (const id of ids) {
      await supabase.from("services").delete().eq("id", id);
    }
    bulk.clear();
    refetch();
    toast({ title: `${ids.length} servicio(s) eliminado(s)` });
  };

  const handleBulkExport = () => {
    const headers = ["ID", "Cliente", "Especialidad", "Estado", "Urgencia", "Origen", "Fecha Alta", "Fecha Prevista", "Importe"];
    const rows = bulk.selectedItems.map((s) => [
      s.id, s.clientName, s.specialty, s.status, s.urgency, s.origin,
      format(new Date(s.receivedAt), "dd/MM/yyyy"), s.scheduledAt ? format(new Date(s.scheduledAt), "dd/MM/yyyy HH:mm") : "",
      s.budgetTotal?.toString() ?? "",
    ]);
    exportCsv("servicios.csv", headers, rows);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const isBillingTab = tab === "billing";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Servicios</h1>
          <p className="text-muted-foreground text-sm mt-1">{services.length} servicios en sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { const event = new CustomEvent("open-voice-assistant"); window.dispatchEvent(event); }} className="gap-2">
            <Mic className="w-4 h-4" /> Crear con Alex
          </Button>
          <Button onClick={() => navigate("/servicios/nuevo")}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Servicio
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); bulk.clear(); }}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Todos</TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Pendiente de facturar
              {billingCount > 0 && <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-info/15 text-info text-[10px] font-bold">{billingCount}</span>}
            </TabsTrigger>
          </TabsList>
          {isBillingTab && (
            <Button size="sm" disabled={bulk.count === 0 || exporting} onClick={handleExportHolded} className="gap-1.5">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Exportar a Holded ({bulk.count})
            </Button>
          )}
        </div>
      </Tabs>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px] h-9 text-sm">
            <span className="text-muted-foreground mr-1">Estado:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statusOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <span className="text-muted-foreground mr-1">Urgencia:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="no_estandar">⚠ No estándar</SelectItem>
            {urgencyOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterBranch} onValueChange={setFilterBranch}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <span className="text-muted-foreground mr-1">Sede:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {activeBranches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SearchableSelect
          options={[
            { value: "all", label: "Todos los servicios" },
            ...serviceIdOptions.map((s) => ({ value: s, label: s })),
          ]}
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
      </div>

      <BulkActionBar count={bulk.count} onClear={bulk.clear} onDelete={handleBulkDelete} onExport={handleBulkExport} entityName="servicios" />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-3 w-10">
                  <Checkbox checked={bulk.allSelected} onCheckedChange={bulk.toggleAll} className={bulk.someSelected ? "data-[state=unchecked]:bg-primary/20" : ""} />
                </th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">ID</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Origen</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Cliente</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Especialidad</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha Alta</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha Prevista</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">SLA</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Urgencia</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Presupuesto</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Importe</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Protocolo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={13} className="text-center py-12 text-muted-foreground">{isBillingTab ? "No hay servicios pendientes de facturación" : "No se encontraron servicios"}</td></tr>
              ) : filtered.map((s) => {
                const sla = getSlaStatus(s.receivedAt, s.contactedAt);
                return (
                  <tr key={s.id} className={cn("border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer", bulk.selectedIds.has(s.id) && "bg-primary/5", isBillingTab && !closedStatuses.includes(s.status) && "opacity-60")}
                    onClick={() => { if (isBillingTab) bulk.toggle(s.id); else navigate(`/servicios/${s.id}`); }}>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={bulk.selectedIds.has(s.id)} onCheckedChange={() => bulk.toggle(s.id)} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      <span className="hover:text-primary hover:underline" onClick={(e) => { if (isBillingTab) { e.stopPropagation(); navigate(`/servicios/${s.id}`); } }}>{s.id}</span>
                    </td>
                    <td className="px-5 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">{s.origin}</span></td>
                    <td className="px-5 py-3 font-medium text-card-foreground">{s.clientName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.specialty}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <Select value={s.status} onValueChange={(v) => handleStatusChange(s.id, v)}>
                        <SelectTrigger className="h-7 w-auto min-w-[120px] border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1"><StatusBadge status={s.status} /></SelectTrigger>
                        <SelectContent>{statusOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}><StatusBadge status={opt.value} /></SelectItem>)}</SelectContent>
                      </Select>
                      {isBillingTab && !closedStatuses.includes(s.status) && <span className="block text-[10px] text-destructive mt-0.5">Servicio no cerrado</span>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{format(new Date(s.receivedAt), "dd MMM yyyy", { locale: es })}</td>
                    <td className="px-5 py-3 text-xs">
                      {s.scheduledAt ? <span className="text-card-foreground font-medium">{format(new Date(s.scheduledAt), "dd MMM yyyy · HH:mm", { locale: es })}</span> : <span className="text-muted-foreground">Sin agendar</span>}
                    </td>
                    <td className="px-5 py-3">
                      {sla === "expired" && <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive animate-pulse-soft">⏰ Vencido</span>}
                      {sla === "warning" && <span className="text-xs font-medium text-warning">⚠ Próximo</span>}
                      {sla === "ok" && <span className="text-xs text-muted-foreground">✓ OK</span>}
                      {!sla && <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <Select value={s.urgency} onValueChange={(v) => handleUrgencyChange(s.id, v)}>
                        <SelectTrigger className="h-7 w-auto min-w-[90px] border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1"><StatusBadge urgency={s.urgency} /></SelectTrigger>
                        <SelectContent>{urgencyOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}><StatusBadge urgency={opt.value} /></SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3">
                      {(() => {
                        const bStatus = getBudgetStatusForService(s.id);
                        if (bStatus) {
                          return <span className={cn("inline-flex items-center gap-1 text-xs font-medium", bStatus === "Aprobado" || bStatus === "Finalizado" ? "text-success" : bStatus === "Borrador" || bStatus === "Enviado" ? "text-warning" : bStatus === "Rechazado" ? "text-destructive" : bStatus === "Pte_Facturación" ? "text-info" : "text-muted-foreground")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", bStatus === "Aprobado" || bStatus === "Finalizado" ? "bg-success" : bStatus === "Borrador" || bStatus === "Enviado" ? "bg-warning" : bStatus === "Rechazado" ? "bg-destructive" : bStatus === "Pte_Facturación" ? "bg-info" : "bg-muted-foreground")} />
                            {bStatus === "Pte_Facturación" ? "Pte. Fact." : bStatus}
                          </span>;
                        }
                        if (s.serviceType === "Presupuesto") {
                          return <span className="inline-flex items-center gap-1 text-xs text-warning font-medium"><span className="w-1.5 h-1.5 rounded-full bg-warning/60" />Pendiente</span>;
                        }
                        return <span className="text-xs text-muted-foreground">Rep. directa</span>;
                      })()}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{s.budgetTotal ? `€${s.budgetTotal.toLocaleString()}` : "—"}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <TooltipProvider delayDuration={200}>
                        <ProtocolDots steps={protocolSteps} checkedIds={protocolChecksMap[s.id] ?? new Set()} onToggle={(stepId) => toggleProtocolCheck(s.id, stepId)} />
                      </TooltipProvider>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
