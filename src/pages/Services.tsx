import { useServices } from "@/hooks/useServices";
import { useAppUsers } from "@/hooks/useAppUsers";
import { Search, Plus, Filter, FileText, Upload, Loader2, CheckSquare, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { useState, useMemo } from "react";
import { differenceInHours, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useBudgets } from "@/hooks/useBudgets";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BudgetStatus, Service, ServiceStatus, UrgencyLevel } from "@/types/urbango";

const statusOptions: { value: ServiceStatus; label: string }[] = [
  { value: "Pendiente_Contacto", label: "Pte. Contacto" },
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
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabValue>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const { budgets } = useBudgets();
  const { services, loading, updateService } = useServices();
  const { toast } = useToast();
  const { data: appUsers = [] } = useAppUsers();

  const operators = useMemo(
    () => appUsers.filter((u) => u.role === "operario" && u.active),
    [appUsers]
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

  const handleOperatorChange = async (serviceId: string, operatorId: string) => {
    if (operatorId === "__none__") {
      const { error } = await updateService(serviceId, { operator_id: null, operator_name: null });
      if (error) toast({ title: "Error", description: "No se pudo cambiar el técnico", variant: "destructive" });
      return;
    }
    const op = operators.find((o) => o.id === operatorId);
    if (!op) return;
    const { error } = await updateService(serviceId, { operator_id: op.id, operator_name: op.name });
    if (error) toast({ title: "Error", description: "No se pudo cambiar el técnico", variant: "destructive" });
  };

  const getBudgetStatusForService = (serviceId: string): BudgetStatus | null => {
    const budget = budgets.find((b) => b.serviceId === serviceId);
    return budget?.status ?? null;
  };

  const filtered = useMemo(() => {
    let list = services;

    // Tab filter
    if (tab === "billing") {
      list = list.filter((s) => {
        const bStatus = getBudgetStatusForService(s.id);
        return bStatus === "Pte_Facturación";
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }

    // Urgency filter
    if (urgencyFilter !== "all") {
      list = list.filter((s) => s.urgency === urgencyFilter);
    }

    // Search filter
    if (search) {
      list = list.filter(
        (s) =>
          s.clientName.toLowerCase().includes(search.toLowerCase()) ||
          s.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    return list;
  }, [services, budgets, tab, search, statusFilter, urgencyFilter]);

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const closedStatuses = ["Finalizado", "Liquidado"];

  const handleExportHolded = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast({ title: "Selecciona al menos un servicio", variant: "destructive" });
      return;
    }

    const servicesToExport = filtered.filter((s) => ids.includes(s.id));
    const nonClosed = servicesToExport.filter((s) => !closedStatuses.includes(s.status));

    if (nonClosed.length > 0) {
      toast({
        title: "Servicios no cerrados",
        description: `No se puede facturar: ${nonClosed.map((s) => s.id).join(", ")}. Solo se pueden facturar servicios en estado Finalizado o Liquidado.`,
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      const budgetsToExport = budgets.filter((b) => ids.includes(b.serviceId));

      const { data, error } = await supabase.functions.invoke("export-holded", {
        body: { services: servicesToExport, budgets: budgetsToExport, type: "invoice" },
      });

      if (error) throw error;

      toast({
        title: "Exportación completada",
        description: `${ids.length} servicio(s) enviados a Holded correctamente.`,
      });
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error("Error exporting to Holded:", err);
      toast({
        title: "Error al exportar",
        description: err.message || "No se pudo conectar con Holded",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
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
          <Button variant="outline" onClick={() => {
            const event = new CustomEvent("open-voice-assistant");
            window.dispatchEvent(event);
          }} className="gap-2">
            <Mic className="w-4 h-4" /> Crear con Alex
          </Button>
          <Button onClick={() => navigate("/servicios/nuevo")}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Servicio
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); setSelectedIds(new Set()); }}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Pendiente de facturar
              {billingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-info/15 text-info text-[10px] font-bold">
                  {billingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {isBillingTab && (
            <Button
              size="sm"
              disabled={selectedIds.size === 0 || exporting}
              onClick={handleExportHolded}
              className="gap-1.5"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Exportar a Holded ({selectedIds.size})
            </Button>
          )}
        </div>
      </Tabs>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <StatusBadge status={opt.value} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Urgencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las urgencias</SelectItem>
            {urgencyOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <StatusBadge urgency={opt.value} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {isBillingTab && (
                  <th className="px-3 py-3 w-10">
                    <Checkbox
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">ID</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Origen</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Cliente</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Especialidad</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Técnico</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha Alta</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha Prevista</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">SLA</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Urgencia</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Presupuesto</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isBillingTab ? 13 : 12} className="text-center py-12 text-muted-foreground">
                    {isBillingTab
                      ? "No hay servicios pendientes de facturación"
                      : "No se encontraron servicios"}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const sla = getSlaStatus(s.receivedAt, s.contactedAt);
                  return (
                    <tr
                      key={s.id}
                      className={cn(
                        "border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer",
                        selectedIds.has(s.id) && "bg-primary/5",
                        isBillingTab && !closedStatuses.includes(s.status) && "opacity-60"
                      )}
                      onClick={() => {
                        if (isBillingTab) {
                          toggleSelect(s.id);
                        } else {
                          navigate(`/servicios/${s.id}`);
                        }
                      }}
                    >
                      {isBillingTab && (
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(s.id)}
                            onCheckedChange={() => toggleSelect(s.id)}
                          />
                        </td>
                      )}
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        <span
                          className="hover:text-primary hover:underline"
                          onClick={(e) => {
                            if (isBillingTab) {
                              e.stopPropagation();
                              navigate(`/servicios/${s.id}`);
                            }
                          }}
                        >
                          {s.id}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          {s.origin}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-card-foreground">{s.clientName}</td>
                      <td className="px-5 py-3 text-muted-foreground">{s.specialty}</td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <Select value={s.operatorId ?? "__none__"} onValueChange={(v) => handleOperatorChange(s.id, v)}>
                          <SelectTrigger className="h-7 w-auto min-w-[120px] border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                            <span className="text-sm text-muted-foreground">{s.operatorName ?? "Sin asignar"}</span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              <span className="text-muted-foreground">Sin asignar</span>
                            </SelectItem>
                            {operators.map((op) => (
                              <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <Select value={s.status} onValueChange={(v) => handleStatusChange(s.id, v)}>
                          <SelectTrigger className="h-7 w-auto min-w-[120px] border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                            <StatusBadge status={s.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <StatusBadge status={opt.value} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isBillingTab && !closedStatuses.includes(s.status) && (
                          <span className="block text-[10px] text-destructive mt-0.5">Servicio no cerrado</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {format(new Date(s.receivedAt), "dd MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {s.scheduledAt ? (
                          <span className="text-card-foreground font-medium">
                            {format(new Date(s.scheduledAt), "dd MMM yyyy · HH:mm", { locale: es })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Sin agendar</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {sla === "expired" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive animate-pulse-soft">
                            ⏰ Vencido
                          </span>
                        )}
                        {sla === "warning" && (
                          <span className="text-xs font-medium text-warning">⚠ Próximo</span>
                        )}
                        {sla === "ok" && (
                          <span className="text-xs text-muted-foreground">✓ OK</span>
                        )}
                        {!sla && <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <Select value={s.urgency} onValueChange={(v) => handleUrgencyChange(s.id, v)}>
                          <SelectTrigger className="h-7 w-auto min-w-[90px] border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                            <StatusBadge urgency={s.urgency} />
                          </SelectTrigger>
                          <SelectContent>
                            {urgencyOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <StatusBadge urgency={opt.value} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-5 py-3">
                        {(() => {
                          const bStatus = getBudgetStatusForService(s.id);
                          if (!bStatus) return "—";
                          return (
                            <span className={cn(
                              "text-xs font-medium",
                              bStatus === "Aprobado" ? "text-success" :
                              bStatus === "Borrador" || bStatus === "Enviado" ? "text-warning" :
                              bStatus === "Rechazado" ? "text-destructive" :
                              bStatus === "Pte_Facturación" ? "text-info" : "text-muted-foreground"
                            )}>
                              {bStatus === "Pte_Facturación" ? "En proceso" : bStatus}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-card-foreground">
                        {s.budgetTotal ? `€${s.budgetTotal.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
