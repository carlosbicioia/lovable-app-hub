import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Wrench, AlertTriangle, TrendingUp, Clock, Handshake, Star, Euro, CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, eachDayOfInterval, eachWeekOfInterval, addDays, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import KpiCard from "@/components/shared/KpiCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { useServices } from "@/hooks/useServices";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { services, loading } = useServices();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const filtered = useMemo(() => {
    if (!dateRange?.from) return services;
    const from = dateRange.from;
    const to = dateRange.to ?? dateRange.from;
    // set to end of day for 'to'
    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);

    return services.filter((s) => {
      try {
        const d = parseISO(s.receivedAt);
        return isWithinInterval(d, { start: from, end: toEnd });
      } catch {
        return false;
      }
    });
  }, [services, dateRange]);

  const pendingContact = filtered.filter((s) => s.status === "Pendiente_Contacto").length;
  const inProgress = filtered.filter((s) => s.status === "En_Curso").length;
  const urgent = filtered.filter((s) => s.urgency !== "Estándar").length;
  const finalized = filtered.filter((s) => s.status === "Finalizado" || s.status === "Liquidado").length;

  const totalBudget = filtered.reduce((sum, s) => sum + (s.budgetTotal ?? 0), 0);
  const npsValues = filtered.filter((s) => s.nps !== null).map((s) => s.nps!);
  const avgNps = npsValues.length > 0 ? (npsValues.reduce((a, b) => a + b, 0) / npsValues.length).toFixed(1) : "—";

  const uniqueClients = new Set(filtered.map((s) => s.clientId)).size;
  const uniqueCollabs = new Set(filtered.filter((s) => s.collaboratorId).map((s) => s.collaboratorId)).size;

  // Chart data: group by day or week depending on range span
  const chartData = useMemo(() => {
    if (!dateRange?.from) return [];
    const from = dateRange.from;
    const to = dateRange.to ?? dateRange.from;
    const span = differenceInDays(to, from);
    const useWeeks = span > 21;

    if (useWeeks) {
      const weeks = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 });
      return weeks.map((weekStart) => {
        const weekEnd = addDays(weekStart, 6);
        const count = filtered.filter((s) => {
          try {
            const d = parseISO(s.receivedAt);
            return d >= weekStart && d <= weekEnd;
          } catch { return false; }
        }).length;
        return { label: format(weekStart, "d MMM", { locale: es }), servicios: count };
      });
    }

    const days = eachDayOfInterval({ start: from, end: to });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const count = filtered.filter((s) => {
        try { return s.receivedAt.startsWith(dayStr); }
        catch { return false; }
      }).length;
      return { label: format(day, "d MMM", { locale: es }), servicios: count };
    });
  }, [filtered, dateRange]);

  const formatRange = () => {
    if (!dateRange?.from) return "Seleccionar fechas";
    const fromStr = format(dateRange.from, "d MMM", { locale: es });
    if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) return fromStr;
    const toStr = format(dateRange.to, "d MMM yyyy", { locale: es });
    return `${fromStr} – ${toStr}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Panel de Control</h1>
          <p className="text-muted-foreground text-sm mt-1">Resumen operativo de UrbanGO</p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal min-w-[220px]",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={es}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Servicios" value={filtered.length} subtitle="En el periodo" icon={Wrench} variant="primary" />
        <KpiCard title="Pte. Contacto" value={pendingContact} subtitle="SLA 12h activo" icon={Clock} variant="warning" />
        <KpiCard title="En Curso" value={inProgress} subtitle="Técnicos asignados" icon={TrendingUp} variant="info" />
        <KpiCard title="Urgencias" value={urgent} subtitle="24h o inmediato" icon={AlertTriangle} variant="warning" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Clientes" value={uniqueClients} icon={Users} variant="default" />
        <KpiCard title="Colaboradores" value={uniqueCollabs} icon={Handshake} variant="success" />
        <KpiCard title="NPS Medio" value={avgNps} icon={Star} variant="primary" />
        <KpiCard
          title="Facturación"
          value={totalBudget > 0 ? `€${(totalBudget / 1000).toFixed(1)}k` : "€0"}
          icon={Euro}
          variant="success"
        />
      </div>

      {/* Evolution chart */}
      {chartData.length > 1 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-card-foreground mb-4">Evolución de Servicios</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorServicios" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="servicios"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorServicios)"
                name="Servicios"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent services table */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold text-card-foreground">Servicios del Periodo</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} resultado(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">ID</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Cliente</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Especialidad</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Urgencia</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Técnico</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    No hay servicios en el periodo seleccionado
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 10).map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/servicios/${s.id}`)}>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                    <td className="px-5 py-3 font-medium text-card-foreground">{s.clientName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.specialty}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3"><StatusBadge urgency={s.urgency} /></td>
                    <td className="px-5 py-3 text-muted-foreground">{s.operatorName ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">
                      {s.budgetTotal ? `€${s.budgetTotal.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
