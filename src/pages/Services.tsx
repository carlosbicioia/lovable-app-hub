import { useServices } from "@/hooks/useServices";
import { useAppUsers } from "@/hooks/useAppUsers";
import { useBatchProtocolChecks } from "@/hooks/useBatchProtocolChecks";
import { useEnabledProtocolSteps } from "@/hooks/useProtocolSteps";
import ProtocolDots, { type ProtocolStep } from "@/components/shared/ProtocolDots";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Search, Plus, Filter, FileText, Upload, Loader2, Mic, ChevronDown, ChevronUp, User, MapPin, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { useState, useMemo } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
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
  const [showFilters, setShowFilters] = useState(false);
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
      const q = search.toLowerCase();
      list = list.filter((s) => s.clientName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.operatorName?.toLowerCase().includes(q)) || (s.address?.toLowerCase().includes(q)));
    }
    return list;
  }, [services, budgets, tab, search, statusFilter, urgencyFilter, filterCollaborator, filterSpecialty, filterBranch, filterService, dateFrom, dateTo]);

  const bulk = useBulkSelect(filtered);

  const billingCount = useMemo(
    () => services.filter((s) => getBudgetStatusForService(s.id) === "Pte_Facturación").length,
    [services, budgets]
  );

  // Pipeline summary counts
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of services) {
      counts[s.status] = (counts[s.status] || 0) + 1;
    }
    return counts;
  }, [services]);

  const getSlaStatus = (receivedAt: string, contactedAt: string | null) => {
    if (contactedAt) return null;
    const hours = differenceInHours(new Date(), new Date(receivedAt));
    if (hours >= 12) return "expired";
    if (hours >= 8) return "warning";
    return "ok";
  };

  const closedStatuses = ["Finalizado", "Liquidado"];

  const activeFilterCount = [
    filterCollaborator !== "all",
    filterSpecialty !== "all",
    filterBranch !== "all",
    filterService !== "all",
    urgencyFilter !== "all",
    !!dateFrom,
  ].filter(Boolean).length;

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">Servicios</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5">{services.length} servicios · {filtered.length} mostrados</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => { const event = new CustomEvent("open-voice-assistant"); window.dispatchEvent(event); }} className="gap-1.5 hidden sm:inline-flex">
            <Mic className="w-3.5 h-3.5" /> Alex
          </Button>
          <Button onClick={() => navigate("/servicios/nuevo")} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Nuevo Servicio</span><span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Pipeline summary */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {statusOptions.map((opt) => {
          const count = pipelineCounts[opt.value] || 0;
          const isActive = statusFilter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(isActive ? "all" : opt.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap",
                isActive
                  ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                  : "bg-card border-border text-muted-foreground hover:bg-muted/50"
              )}
            >
              <span>{opt.label}</span>
              <span className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabs + Search + Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); bulk.clear(); }}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs h-7 gap-1"><FileText className="w-3 h-3" /> Todos</TabsTrigger>
              <TabsTrigger value="billing" className="text-xs h-7 gap-1">
                <Upload className="w-3 h-3" /> Facturación
                {billingCount > 0 && <span className="ml-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-info/15 text-info text-[9px] font-bold">{billingCount}</span>}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 max-w-xs min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Buscar ID, cliente, operario..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
          </div>

          <Button
            variant="outline"
            size="sm"
            className={cn("gap-1.5 h-8", activeFilterCount > 0 && "border-primary/50 text-primary")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">{activeFilterCount}</span>
            )}
            {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>

          {isBillingTab && (
            <Button size="sm" disabled={bulk.count === 0 || exporting} onClick={handleExportHolded} className="gap-1.5 h-8 ml-auto">
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Exportar ({bulk.count})
            </Button>
          )}
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <Card className="border-dashed">
            <CardContent className="p-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={filterCollaborator} onValueChange={setFilterCollaborator}>
                  <SelectTrigger className="w-[170px] h-8 text-xs">
                    <span className="text-muted-foreground mr-1">Colaborador:</span>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {collaboratorOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <span className="text-muted-foreground mr-1">Especialidad:</span>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {specialtyOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
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
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <span className="text-muted-foreground mr-1">Sede:</span>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {activeBranches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
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
                  className="w-[160px] h-8 text-xs"
                />
                <DatePresetSelect
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
                />
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => {
                    setFilterCollaborator("all");
                    setFilterSpecialty("all");
                    setUrgencyFilter("all");
                    setFilterBranch("all");
                    setFilterService("all");
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BulkActionBar count={bulk.count} onClear={bulk.clear} onDelete={handleBulkDelete} onExport={handleBulkExport} entityName="servicios" />

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2.5 w-10">
                  <Checkbox checked={bulk.allSelected} onCheckedChange={bulk.toggleAll} className={bulk.someSelected ? "data-[state=unchecked]:bg-primary/20" : ""} />
                </th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium text-xs">Servicio</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium text-xs">Estado</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium text-xs">Cita</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium text-xs">SLA</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium text-xs">Urgencia</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium text-xs">Presupuesto</th>
                <th className="text-right px-3 py-2.5 text-muted-foreground font-medium text-xs">Importe</th>
                <th className="text-left px-3 py-2.5 text-muted-foreground font-medium text-xs">Protocolo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">{isBillingTab ? "No hay servicios pendientes de facturación" : "No se encontraron servicios"}</td></tr>
              ) : filtered.map((s) => {
                const sla = getSlaStatus(s.receivedAt, s.contactedAt);
                const br = activeBranches.find(b => b.id === s.branchId);
                return (
                  <tr key={s.id} className={cn("border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer", bulk.selectedIds.has(s.id) && "bg-primary/5", isBillingTab && !closedStatuses.includes(s.status) && "opacity-60")}
                    onClick={() => { if (isBillingTab) bulk.toggle(s.id); else navigate(`/servicios/${s.id}`); }}>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={bulk.selectedIds.has(s.id)} onCheckedChange={() => bulk.toggle(s.id)} />
                    </td>
                    {/* Service info — combined column */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground hover:text-primary hover:underline"
                            onClick={(e) => { if (isBillingTab) { e.stopPropagation(); navigate(`/servicios/${s.id}`); } }}
                          >{s.id}</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{s.origin}</span>
                          {s.specialty && <span className="text-[10px] text-muted-foreground hidden lg:inline">{s.specialty}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="font-medium text-card-foreground">{s.clientName}</span>
                          <span className="text-muted-foreground/50">·</span>
                          <span>{format(new Date(s.receivedAt), "dd MMM", { locale: es })}</span>
                          {s.operatorName && (
                            <>
                              <span className="text-muted-foreground/50">·</span>
                              <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{s.operatorName}</span>
                            </>
                          )}
                          {br && <span className="hidden xl:inline text-muted-foreground/50">· {br.name}</span>}
                        </div>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Select value={s.status} onValueChange={(v) => handleStatusChange(s.id, v)}>
                        <SelectTrigger className="h-6 w-auto min-w-[100px] border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1"><StatusBadge status={s.status} className="text-[10px]" /></SelectTrigger>
                        <SelectContent>{statusOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}><StatusBadge status={opt.value} /></SelectItem>)}</SelectContent>
                      </Select>
                      {isBillingTab && !closedStatuses.includes(s.status) && <span className="block text-[10px] text-destructive mt-0.5">No cerrado</span>}
                    </td>
                    {/* Scheduled date */}
                    <td className="px-3 py-2.5 text-xs">
                      {s.scheduledAt ? (
                        <div className="flex flex-col">
                          <span className="text-card-foreground font-medium">{format(new Date(s.scheduledAt), "dd MMM", { locale: es })}</span>
                          <span className="text-muted-foreground text-[10px]">{format(new Date(s.scheduledAt), "HH:mm")}</span>
                        </div>
                      ) : <span className="text-muted-foreground italic">Sin cita</span>}
                    </td>
                    {/* SLA */}
                    <td className="px-3 py-2.5">
                      {sla === "expired" && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive animate-pulse-soft">⏰ Vencido</span>}
                      {sla === "warning" && <span className="text-[10px] font-semibold text-warning">⚠ Próximo</span>}
                      {sla === "ok" && <span className="text-[10px] text-success">✓ OK</span>}
                      {!sla && <span className="text-[10px] text-muted-foreground">—</span>}
                    </td>
                    {/* Urgency */}
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Select value={s.urgency} onValueChange={(v) => handleUrgencyChange(s.id, v)}>
                        <SelectTrigger className="h-6 w-auto min-w-[70px] border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1"><StatusBadge urgency={s.urgency} className="text-[10px]" /></SelectTrigger>
                        <SelectContent>{urgencyOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}><StatusBadge urgency={opt.value} /></SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    {/* Budget status */}
                    <td className="px-3 py-2.5">
                      {(() => {
                        const bStatus = getBudgetStatusForService(s.id);
                        if (bStatus) {
                          return <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", bStatus === "Aprobado" || bStatus === "Finalizado" ? "text-success" : bStatus === "Borrador" || bStatus === "Enviado" ? "text-warning" : bStatus === "Rechazado" ? "text-destructive" : bStatus === "Pte_Facturación" ? "text-info" : "text-muted-foreground")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", bStatus === "Aprobado" || bStatus === "Finalizado" ? "bg-success" : bStatus === "Borrador" || bStatus === "Enviado" ? "bg-warning" : bStatus === "Rechazado" ? "bg-destructive" : bStatus === "Pte_Facturación" ? "bg-info" : "bg-muted-foreground")} />
                            {bStatus === "Pte_Facturación" ? "Pte. Fact." : bStatus}
                          </span>;
                        }
                        if (s.serviceType === "Presupuesto") {
                          return <span className="inline-flex items-center gap-1 text-[10px] text-warning font-medium"><span className="w-1.5 h-1.5 rounded-full bg-warning/60" />Pendiente</span>;
                        }
                        return <span className="text-[10px] text-muted-foreground">Rep. directa</span>;
                      })()}
                    </td>
                    {/* Amount */}
                    <td className="px-3 py-2.5 text-right font-medium text-card-foreground text-xs">{s.budgetTotal ? `€${s.budgetTotal.toLocaleString()}` : "—"}</td>
                    {/* Protocol */}
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
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
