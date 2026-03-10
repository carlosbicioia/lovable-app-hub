import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Download, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServices } from "@/hooks/useServices";
import { useBudgets } from "@/hooks/useBudgets";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import KpiCard from "@/components/shared/KpiCard";
import { exportCsv } from "@/lib/exportCsv";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from "recharts";

const COLORS = [
  "hsl(211,86%,50%)", "hsl(152,60%,42%)", "hsl(38,92%,50%)",
  "hsl(0,84%,60%)", "hsl(340,75%,55%)", "hsl(25,95%,53%)",
];

export default function FinancialReport() {
  const navigate = useNavigate();
  const { services } = useServices();
  const { budgets } = useBudgets();
  const { data: invoices = [] } = usePurchaseInvoices();

  const stats = useMemo(() => {
    const totalRevenue = services.reduce((a, s) => a + (s.budgetTotal || 0), 0);
    const totalPurchases = invoices.reduce((a, i) => a + (i.total || 0), 0);
    const margin = totalRevenue - totalPurchases;
    const marginPct = totalRevenue > 0 ? ((margin / totalRevenue) * 100).toFixed(1) : "—";

    // Budget status
    const budgetStatusMap: Record<string, number> = {};
    budgets.forEach((b) => { budgetStatusMap[b.status] = (budgetStatusMap[b.status] || 0) + 1; });
    const byBudgetStatus = Object.entries(budgetStatusMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

    // Budget amounts by status
    const budgetAmounts: Record<string, number> = {};
    budgets.forEach((b) => {
      const svc = services.find((s) => s.id === b.serviceId);
      const total = svc?.budgetTotal || 0;
      budgetAmounts[b.status] = (budgetAmounts[b.status] || 0) + total;
    });
    const byBudgetAmount = Object.entries(budgetAmounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

    // Invoice status
    const invStatusMap: Record<string, number> = {};
    invoices.forEach((i) => { invStatusMap[i.status] = (invStatusMap[i.status] || 0) + 1; });
    const byInvoiceStatus = Object.entries(invStatusMap).map(([name, value]) => ({ name, value }));

    // Monthly revenue vs purchases
    const monthlyMap: Record<string, { revenue: number; purchases: number }> = {};
    services.forEach((s) => {
      const m = s.receivedAt?.slice(0, 7) || "Sin fecha";
      if (!monthlyMap[m]) monthlyMap[m] = { revenue: 0, purchases: 0 };
      monthlyMap[m].revenue += s.budgetTotal || 0;
    });
    invoices.forEach((i) => {
      const m = i.invoiceDate?.slice(0, 7) || i.createdAt?.slice(0, 7) || "Sin fecha";
      if (!monthlyMap[m]) monthlyMap[m] = { revenue: 0, purchases: 0 };
      monthlyMap[m].purchases += i.total || 0;
    });
    const monthly = Object.entries(monthlyMap).sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, v]) => ({ name, ingresos: Math.round(v.revenue), compras: Math.round(v.purchases), margen: Math.round(v.revenue - v.purchases) }));

    // Top suppliers
    const supplierMap: Record<string, number> = {};
    invoices.forEach((i) => { supplierMap[i.supplierName] = (supplierMap[i.supplierName] || 0) + i.total; });
    const topSuppliers = Object.entries(supplierMap).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    const approvedBudgets = budgets.filter((b) => ["Aprobado", "Finalizado", "Pte_Facturación"].includes(b.status)).length;
    const approvalRate = budgets.length > 0 ? ((approvedBudgets / budgets.length) * 100).toFixed(0) : "—";

    return { totalRevenue, totalPurchases, margin, marginPct, approvalRate, byBudgetStatus, byBudgetAmount, byInvoiceStatus, monthly, topSuppliers };
  }, [services, budgets, invoices]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/informes")}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Informe financiero</h1>
          <p className="text-sm text-muted-foreground">Resumen de ingresos, costes y márgenes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Ingresos" value={`${(stats.totalRevenue / 1000).toFixed(1)}k €`} icon={TrendingUp} variant="success" />
        <KpiCard title="Compras" value={`${(stats.totalPurchases / 1000).toFixed(1)}k €`} icon={TrendingDown} variant="warning" />
        <KpiCard title="Margen" value={`${(stats.margin / 1000).toFixed(1)}k €`} icon={DollarSign} variant="primary" />
        <KpiCard title="% Margen" value={`${stats.marginPct}%`} icon={DollarSign} variant="info" />
        <KpiCard title="Presupuestos" value={budgets.length} icon={DollarSign} variant="default" />
        <KpiCard title="Tasa aprob." value={`${stats.approvalRate}%`} icon={DollarSign} variant="success" />
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader><CardTitle className="text-base">Evolución mensual: Ingresos vs Compras</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString("es-ES")} €`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="ingresos" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.15} name="Ingresos" />
              <Area type="monotone" dataKey="compras" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.15} name="Compras" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Presupuestos por estado</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byBudgetStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.byBudgetStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top suppliers */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 proveedores por gasto</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topSuppliers} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("es-ES")} €`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Gasto" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Facturas de compra por estado</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byInvoiceStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.byInvoiceStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget amounts */}
        <Card>
          <CardHeader><CardTitle className="text-base">Volumen económico por estado de presupuesto</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byBudgetAmount} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("es-ES")} €`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Importe" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
