"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench, HardHat, Euro, TrendingUp, TrendingDown, Users, Download,
  DollarSign, BarChart3, Clock, Star, Loader2,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, parseISO, isWithinInterval,
  eachMonthOfInterval, startOfYear, endOfYear,
} from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import KpiCard from "@/components/shared/KpiCard";
import DatePresetSelect from "@/components/shared/DatePresetSelect";
import { useServices } from "@/hooks/useServices";
import { useOperators } from "@/hooks/useOperators";
import { useBudgets } from "@/hooks/useBudgets";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import { exportCsv } from "@/lib/exportCsv";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from "recharts";

export default function AdvancedDashboard() {
  const router = useRouter();
  const { services, loading } = useServices();
  const { data: operators = [] } = useOperators();
  const { budgets } = useBudgets();
  const { data: invoices = [] } = usePurchaseInvoices();

  const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfYear(new Date()));
  const [dateTo, setDateTo] = useState<Date | undefined>(endOfYear(new Date()));

  const filtered = useMemo(() => {
    if (!dateFrom) return services;
    const from = dateFrom;
    const to = dateTo ?? dateFrom;
    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);
    return services.filter((s) => {
      try {
        return isWithinInterval(parseISO(s.receivedAt), { start: from, end: toEnd });
      } catch { return false; }
    });
  }, [services, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const finalized = filtered.filter((s) => s.status === "Finalizado" || s.status === "Liquidado").length;
    const inProgress = filtered.filter((s) => s.status === "En_Curso").length;
    const totalRevenue = filtered.reduce((a, s) => a + (s.budgetTotal ?? 0), 0);
    const filteredInvoices = invoices.filter((inv) => {
      if (!dateFrom) return true;
      try {
        const d = parseISO(inv.invoiceDate ?? inv.createdAt);
        const toEnd = new Date(dateTo ?? dateFrom);
        toEnd.setHours(23, 59, 59, 999);
        return isWithinInterval(d, { start: dateFrom, end: toEnd });
      } catch { return true; }
    });
    const totalCosts = filteredInvoices.reduce((a, i) => a + (i.total ?? 0), 0);
    const margin = totalRevenue - totalCosts;
    const marginPct = totalRevenue > 0 ? ((margin / totalRevenue) * 100).toFixed(1) : "—";

    // Per operator stats
    const activeOps = operators.filter((o) => o.status === "Activo");
    const opStats = activeOps.map((op) => {
      const opServices = filtered.filter((s) =>
        s.operatorId === op.id || s.operators?.some((o) => o.id === op.id)
      );
      const opFinalized = opServices.filter((s) => s.status === "Finalizado" || s.status === "Liquidado");
      const opRevenue = opServices.reduce((a, s) => a + (s.budgetTotal ?? 0), 0);
      return {
        id: op.id,
        name: op.name,
        specialty: op.specialty,
        totalServices: opServices.length,
        finalized: opFinalized.length,
        active: opServices.filter((s) => s.status === "En_Curso" || s.status === "Agendado" || s.status === "Asignado").length,
        revenue: opRevenue,
        nps: op.npsMean,
        avgRevenuePerService: opFinalized.length > 0 ? Math.round(opRevenue / opFinalized.length) : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Monthly evolution
    const monthlyMap: Record<string, { servicios: number; ingresos: number; costes: number }> = {};
    if (dateFrom && dateTo) {
      const months = eachMonthOfInterval({ start: dateFrom, end: dateTo });
      months.forEach((m) => {
        monthlyMap[format(m, "yyyy-MM")] = { servicios: 0, ingresos: 0, costes: 0 };
      });
    }
    filtered.forEach((s) => {
      const m = s.receivedAt?.slice(0, 7);
      if (m && monthlyMap[m] !== undefined) {
        monthlyMap[m].servicios++;
        monthlyMap[m].ingresos += s.budgetTotal ?? 0;
      }
    });
    filteredInvoices.forEach((inv) => {
      const m = (inv.invoiceDate ?? inv.createdAt)?.slice(0, 7);
      if (m && monthlyMap[m] !== undefined) {
        monthlyMap[m].costes += inv.total ?? 0;
      }
    });
    const monthly = Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => ({
        label: format(parseISO(key + "-01"), "MMM yy", { locale: es }),
        servicios: v.servicios,
        ingresos: Math.round(v.ingresos),
        costes: Math.round(v.costes),
        margen: Math.round(v.ingresos - v.costes),
      }));

    return {
      total, finalized, inProgress, totalRevenue, totalCosts, margin, marginPct,
      opStats, monthly,
      avgServiceValue: finalized > 0 ? Math.round(totalRevenue / finalized) : 0,
      servicesPerOp: activeOps.length > 0 ? (total / activeOps.length).toFixed(1) : "—",
    };
  }, [filtered, operators, invoices, dateFrom, dateTo]);

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
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard Avanzado</h1>
          <p className="text-muted-foreground text-sm mt-1">Métricas sensibles de rendimiento y facturación</p>
        </div>
        <DatePresetSelect
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
        />
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Servicios totales" value={stats.total} icon={Wrench} variant="primary" />
        <KpiCard title="Finalizados" value={stats.finalized} icon={Wrench} variant="success" />
        <KpiCard title="Facturación" value={`${(stats.totalRevenue / 1000).toFixed(1)}k €`} icon={Euro} variant="success" />
        <KpiCard title="Costes" value={`${(stats.totalCosts / 1000).toFixed(1)}k €`} icon={TrendingDown} variant="warning" />
        <KpiCard title="Margen" value={`${(stats.margin / 1000).toFixed(1)}k €`} icon={TrendingUp} variant={stats.margin >= 0 ? "info" : "warning"} />
        <KpiCard title="% Margen" value={`${stats.marginPct}%`} icon={DollarSign} variant="primary" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard title="Ticket medio" value={`${stats.avgServiceValue.toLocaleString()} €`} icon={BarChart3} variant="default" />
        <KpiCard title="Servicios/Operario" value={stats.servicesPerOp} icon={HardHat} variant="info" />
        <KpiCard title="En curso" value={stats.inProgress} icon={Clock} variant="warning" />
        <KpiCard title="Operarios activos" value={operators.filter((o) => o.status === "Activo").length} icon={Users} variant="success" />
      </div>

      {/* Monthly evolution */}
      {stats.monthly.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Evolución mensual: Ingresos vs Costes vs Margen</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("es-ES")} €`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="ingresos" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.15} name="Ingresos" />
                <Area type="monotone" dataKey="costes" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.15} name="Costes" />
                <Area type="monotone" dataKey="margen" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} name="Margen" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Revenue per operator */}
      {stats.opStats.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Facturación por operario (Top 10)</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.opStats.slice(0, 10)} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("es-ES")} €`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Full operator table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Rendimiento por operario (periodo seleccionado)</CardTitle>
          <Button variant="outline" size="sm" onClick={() => {
            exportCsv("rendimiento-operarios.csv",
              ["Operario", "Especialidad", "Servicios", "Finalizados", "Activos", "Ingresos", "Ticket Medio", "NPS"],
              stats.opStats.map((o) => [
                o.name, o.specialty, String(o.totalServices), String(o.finalized),
                String(o.active), String(o.revenue), String(o.avgRevenuePerService),
                o.nps > 0 ? String(o.nps) : "—",
              ])
            );
          }}>
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Operario</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Especialidad</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Servicios</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Finalizados</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Activos</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ingresos</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ticket medio</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">NPS</th>
                </tr>
              </thead>
              <tbody>
                {stats.opStats.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Sin datos para el periodo seleccionado</td></tr>
                ) : (
                  stats.opStats.map((o) => (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-3 font-medium text-foreground">{o.name}</td>
                      <td className="py-2 px-3 text-muted-foreground">{o.specialty}</td>
                      <td className="py-2 px-3 text-right text-foreground">{o.totalServices}</td>
                      <td className="py-2 px-3 text-right text-foreground">{o.finalized}</td>
                      <td className="py-2 px-3 text-right text-foreground">{o.active}</td>
                      <td className="py-2 px-3 text-right font-medium text-foreground">{o.revenue.toLocaleString("es-ES")} €</td>
                      <td className="py-2 px-3 text-right text-foreground">{o.avgRevenuePerService.toLocaleString("es-ES")} €</td>
                      <td className="py-2 px-3 text-right text-foreground">{o.nps > 0 ? o.nps.toFixed(1) : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {stats.opStats.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border font-semibold">
                    <td className="py-2 px-3 text-foreground">Total</td>
                    <td />
                    <td className="py-2 px-3 text-right text-foreground">{stats.total}</td>
                    <td className="py-2 px-3 text-right text-foreground">{stats.finalized}</td>
                    <td className="py-2 px-3 text-right text-foreground">{stats.inProgress}</td>
                    <td className="py-2 px-3 text-right text-foreground">{stats.totalRevenue.toLocaleString("es-ES")} €</td>
                    <td className="py-2 px-3 text-right text-foreground">{stats.avgServiceValue.toLocaleString("es-ES")} €</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
