import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Wrench, AlertTriangle, TrendingUp, Clock, Handshake, Star, Euro, ShoppingCart, UserPlus, FileText, UserCheck } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, eachDayOfInterval, eachWeekOfInterval, addDays, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import KpiCard from "@/components/shared/KpiCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { useServices } from "@/hooks/useServices";
import { useCollaborators } from "@/hooks/useCollaborators";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useClients } from "@/hooks/useClients";
import { useOperators } from "@/hooks/useOperators";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import DatePresetSelect from "@/components/shared/DatePresetSelect";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language.startsWith("en") ? enUS : es;
  const navigate = useNavigate();
  const { services, loading } = useServices();
  const { collaborators } = useCollaborators();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: operators = [] } = useOperators();
  const { data: clients = [] } = useClients();

  const alertOrders = purchaseOrders.filter((o) => o.status === "Borrador");

  const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date | undefined>(endOfMonth(new Date()));

  const filtered = useMemo(() => {
    if (!dateFrom) return services;
    const from = dateFrom;
    const to = dateTo ?? dateFrom;
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
  }, [services, dateFrom, dateTo]);

  const totalServices = services.length;
  const pendingContact = services.filter((s) => s.status === "Pendiente_Contacto").length;
  const assigned = services.filter((s) => s.status === "Asignado").length;
  const inProgress = services.filter((s) => s.status === "En_Curso").length;
  const urgent = services.filter((s) => s.urgency !== "Estándar" && !["Finalizado", "Liquidado", "Cancelado"].includes(s.status)).length;
  const finalized = filtered.filter((s) => s.status === "Finalizado" || s.status === "Liquidado").length;

  const pendingInvoice = services.filter((s) => s.status === "Finalizado");
  const pendingInvoiceCount = pendingInvoice.length;
  const pendingInvoiceTotal = pendingInvoice.reduce((sum, s) => sum + (s.budgetTotal ?? 0), 0);

  const totalBudget = filtered.reduce((sum, s) => sum + (s.budgetTotal ?? 0), 0);
  const operatorNpsValues = operators.filter((op) => op.npsMean > 0).map((op) => op.npsMean);
  const avgNps = operatorNpsValues.length > 0 ? (operatorNpsValues.reduce((a, b) => a + b, 0) / operatorNpsValues.length).toFixed(1) : "—";

  const uniqueClients = clients.length;
  const uniqueCollabs = collaborators.length;

  const chartData = useMemo(() => {
    if (!dateFrom) return [];
    const from = dateFrom;
    const to = dateTo ?? dateFrom;
    const span = differenceInDays(to, from);
    const useWeeks = span > 21;

    if (useWeeks) {
      const weeks = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 });
      let acc = 0;
      return weeks.map((weekStart) => {
        const weekEnd = addDays(weekStart, 6);
        const weekServices = filtered.filter((s) => {
          try {
            const d = parseISO(s.receivedAt);
            return d >= weekStart && d <= weekEnd;
          } catch { return false; }
        });
        acc += weekServices.reduce((sum, s) => sum + (s.budgetTotal ?? 0), 0);
        return { label: format(weekStart, "d MMM", { locale: dateFnsLocale }), servicios: weekServices.length, facturación: acc };
      });
    }

    const days = eachDayOfInterval({ start: from, end: to });
    let acc = 0;
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayServices = filtered.filter((s) => {
        try { return s.receivedAt.startsWith(dayStr); }
        catch { return false; }
      });
      acc += dayServices.reduce((sum, s) => sum + (s.budgetTotal ?? 0), 0);
      return { label: format(day, "d MMM", { locale: dateFnsLocale }), servicios: dayServices.length, facturación: acc };
    });
  }, [filtered, dateFrom, dateTo, dateFnsLocale]);

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
          <h1 className="text-2xl font-display font-bold text-foreground">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("dashboard.subtitle")}</p>
        </div>

        <DatePresetSelect
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title={t("dashboard.services")} value={totalServices} subtitle={t("dashboard.totalRegistered")} icon={Wrench} variant="primary" onClick={() => navigate("/servicios")} />
        <KpiCard title={t("dashboard.pendingContact")} value={pendingContact} subtitle={t("dashboard.notContactedYet")} icon={Clock} variant="warning" onClick={() => navigate("/servicios?status=Pendiente_Contacto")} />
        <KpiCard title={t("dashboard.assigned")} value={assigned} subtitle={t("dashboard.withTechNoDate")} icon={UserCheck} variant="default" onClick={() => navigate("/servicios?status=Asignado")} />
        <KpiCard title={t("dashboard.inProgress")} value={inProgress} subtitle={t("dashboard.techsWorking")} icon={TrendingUp} variant="info" onClick={() => navigate("/servicios?status=En_Curso")} />
        <KpiCard title={t("dashboard.urgencies")} value={urgent} subtitle={t("dashboard.notClosed")} icon={AlertTriangle} variant="warning" onClick={() => navigate("/servicios?urgency=urgent")} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title={t("dashboard.clients")} value={uniqueClients} icon={Users} variant="default" onClick={() => navigate("/clientes")} />
        <KpiCard title={t("dashboard.collaborators")} value={uniqueCollabs} icon={Handshake} variant="success" onClick={() => navigate("/colaboradores")} />
        <KpiCard title={t("dashboard.avgNps")} value={avgNps} icon={Star} variant="primary" />
        <KpiCard
          title={t("dashboard.billing")}
          value={totalBudget > 0 ? `€${(totalBudget / 1000).toFixed(1)}k` : "€0"}
          icon={Euro}
          variant="success"
        />
        <KpiCard
          title={t("dashboard.pendingBilling")}
          value={pendingInvoiceCount}
          subtitle={pendingInvoiceTotal > 0 ? `€${pendingInvoiceTotal.toLocaleString()}` : "€0"}
          icon={FileText}
          variant="warning"
          onClick={() => navigate("/servicios?status=Finalizado")}
        />
      </div>

      {/* Evolution chart */}
      {chartData.length > 1 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-card-foreground mb-4">{t("dashboard.chartTitle")}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorServicios" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFacturacion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `€${(v / 1000).toFixed(1)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
                formatter={(value: number, name: string) =>
                  name === t("dashboard.billingLabel") ? [`€${value.toLocaleString()}`, name] : [value, name]
                }
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="servicios"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorServicios)"
                name={t("dashboard.servicesLabel")}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="facturación"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fill="url(#colorFacturacion)"
                name={t("dashboard.billingLabel")}
                strokeDasharray="5 3"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Purchase orders alerts */}
      {alertOrders.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-card-foreground flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              {t("dashboard.purchaseAlerts")}
            </h2>
            <span className="text-xs text-muted-foreground">{t("dashboard.orderCount", { count: alertOrders.length })}</span>
          </div>
          <div className="divide-y divide-border">
            {alertOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/compras/${o.id}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                    {o.status}
                  </span>
                  <span className="text-sm text-foreground font-medium">{o.supplierName}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">€{o.totalCost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent services table */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold text-card-foreground">{t("dashboard.periodServices")}</h2>
          <span className="text-xs text-muted-foreground">{t("dashboard.resultCount", { count: filtered.length })}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">{t("table.id")}</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">{t("table.client")}</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">{t("table.specialty")}</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">{t("table.status")}</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">{t("table.urgency")}</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">{t("table.technician")}</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">{t("table.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    {t("dashboard.noServicesInPeriod")}
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 10).map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/servicios/${s.id}`)}>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                    <td className="px-5 py-3 font-medium text-card-foreground">{s.clientName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.specialty}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} contactedAt={s.contactedAt} /></td>
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
