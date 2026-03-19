import { useMemo, useEffect, useState } from "react";
import { useServices } from "@/hooks/useServices";
import { useOperators } from "@/hooks/useOperators";
import { useClients } from "@/hooks/useClients";
import { useCollaborators } from "@/hooks/useCollaborators";
import { useSalesOrders } from "@/hooks/useSalesOrders";
import { Loader2, Wrench, Clock, UserCheck, TrendingUp, AlertTriangle, Euro, Star, Users, UserPlus, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import CompanyLogo from "@/components/shared/CompanyLogo";

export default function TvDashboard() {
  const { services, loading } = useServices();
  const { data: operators = [] } = useOperators();
  const { data: clients = [] } = useClients();
  const { collaborators } = useCollaborators();
  const { data: salesOrders = [] } = useSalesOrders();
  const { signOut } = useAuth();
  const [now, setNow] = useState(new Date());

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      window.location.reload();
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Clock ticker every second
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const stats = useMemo(() => {
    const pendingContact = services.filter(s => s.status === "Pendiente_Contacto").length;
    const assigned = services.filter(s => s.status === "Asignado").length;
    const scheduled = services.filter(s => s.status === "Agendado").length;
    const inProgress = services.filter(s => s.status === "En_Curso").length;
    const finalized = services.filter(s => s.status === "Finalizado").length;
    const settled = services.filter(s => s.status === "Liquidado").length;
    const urgent = services.filter(s => s.urgency !== "Estándar" && !["Finalizado", "Liquidado", "Cancelado"].includes(s.status)).length;

    const totalBudgeted = services.reduce((s, svc) => s + (svc.budgetTotal ?? 0), 0);
    const ovPendiente = salesOrders.filter(o => o.status === "Pendiente").reduce((s, o) => s + o.total, 0);
    const ovLiquidada = salesOrders.filter(o => o.status === "Liquidada").reduce((s, o) => s + o.total, 0);

    const npsValues = operators.filter(op => op.npsMean > 0).map(op => op.npsMean);
    const avgNps = npsValues.length > 0 ? (npsValues.reduce((a, b) => a + b, 0) / npsValues.length) : null;

    const activeOperators = operators.filter(op => op.activeServices > 0);

    return {
      total: services.length,
      pendingContact, assigned, scheduled, inProgress, finalized, settled, urgent,
      totalBudgeted, ovPendiente, ovLiquidada,
      avgNps, activeOperators,
      clientCount: clients.length,
      collabCount: collaborators.length,
    };
  }, [services, operators, clients, collaborators, salesOrders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const statusCards = [
    { label: "Pte. Contacto", value: stats.pendingContact, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Pte. Asignación", value: stats.pendingAssign, icon: UserPlus, color: "text-info", bg: "bg-info/10" },
    { label: "Asignado", value: stats.assigned, icon: UserCheck, color: "text-foreground", bg: "bg-muted" },
    { label: "Agendado", value: stats.scheduled, icon: Wrench, color: "text-primary", bg: "bg-primary/10" },
    { label: "En Curso", value: stats.inProgress, icon: TrendingUp, color: "text-info", bg: "bg-info/10" },
    { label: "Finalizado", value: stats.finalized, icon: Wrench, color: "text-success", bg: "bg-success/10" },
    { label: "Liquidado", value: stats.settled, icon: Euro, color: "text-success", bg: "bg-success/10" },
    { label: "Urgencias", value: stats.urgent, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <CompanyLogo size="sm" />
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <Monitor className="w-7 h-7 text-primary" /> Panel TV
            </h1>
            <p className="text-sm text-muted-foreground">Modo cine — actualización automática cada 60s</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-4xl font-display font-bold text-foreground tabular-nums">
              {format(now, "HH:mm:ss")}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(now, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={signOut}>
            Salir
          </Button>
        </div>
      </div>

      {/* Service status pipeline */}
      <div>
        <h2 className="text-lg font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" /> Servicios por Estado
          <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-sm font-bold">{stats.total}</span>
        </h2>
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
          {statusCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-2 rounded-lg", card.bg)}>
                  <card.icon className={cn("w-5 h-5", card.color)} />
                </div>
              </div>
              <p className={cn("text-4xl font-display font-bold", card.color)}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Middle row: Billing + NPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Euro className="w-5 h-5 text-success" /> Facturación
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Presupuestado</p>
              <p className="text-3xl font-display font-bold text-foreground">
                €{(stats.totalBudgeted / 1000).toFixed(1)}k
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">OV Pendiente</p>
              <p className="text-3xl font-display font-bold text-warning">
                €{stats.ovPendiente.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">OV Liquidada</p>
              <p className="text-3xl font-display font-bold text-success">
                €{stats.ovLiquidada.toFixed(0)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Clientes</p>
              <p className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" /> {stats.clientCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Colaboradores</p>
              <p className="text-2xl font-display font-bold text-foreground">{stats.collabCount}</p>
            </div>
          </div>
        </div>

        {/* NPS + Active Operators */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-warning" /> NPS y Equipo
          </h2>
          <div className="flex items-center gap-8 mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">NPS Medio</p>
              <p className={cn(
                "text-5xl font-display font-bold",
                stats.avgNps !== null
                  ? stats.avgNps >= 9 ? "text-success" : stats.avgNps >= 7 ? "text-warning" : "text-destructive"
                  : "text-muted-foreground"
              )}>
                {stats.avgNps !== null ? stats.avgNps.toFixed(1) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Operarios activos</p>
              <p className="text-5xl font-display font-bold text-primary">{stats.activeOperators.length}</p>
            </div>
          </div>

          {/* Active operator list */}
          {stats.activeOperators.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {stats.activeOperators.map(op => (
                <div key={op.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${op.color})` }}
                    />
                    <span className="text-sm font-medium text-foreground">{op.name}</span>
                    <span className="text-xs text-muted-foreground">{op.specialty}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                      {op.activeServices} servicio(s)
                    </span>
                    {op.npsMean > 0 && (
                      <span className={cn(
                        "text-xs font-semibold",
                        op.npsMean >= 9 ? "text-success" : op.npsMean >= 7 ? "text-warning" : "text-destructive"
                      )}>
                        NPS {op.npsMean.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
        <span>UrbanGO — Panel TV</span>
        <span>Última actualización: {format(now, "HH:mm:ss")}</span>
      </div>
    </div>
  );
}
