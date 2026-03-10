import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBudgets } from "@/hooks/useBudgets";
import { useServices } from "@/hooks/useServices";
import KpiCard from "@/components/shared/KpiCard";
import { exportCsv } from "@/lib/exportCsv";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";

const COLORS = [
  "hsl(211,86%,50%)", "hsl(152,60%,42%)", "hsl(38,92%,50%)",
  "hsl(0,84%,60%)", "hsl(340,75%,55%)", "hsl(25,95%,53%)",
];

export default function BudgetsReport() {
  const navigate = useNavigate();
  const { budgets } = useBudgets();
  const { services } = useServices();

  const stats = useMemo(() => {
    const total = budgets.length;
    const approved = budgets.filter((b) => ["Aprobado", "Finalizado", "Pte_Facturación"].includes(b.status)).length;
    const rejected = budgets.filter((b) => b.status === "Rechazado").length;
    const pending = budgets.filter((b) => ["Borrador", "Enviado"].includes(b.status)).length;
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(0) : "—";

    // Total amounts
    const totalAmount = budgets.reduce((acc, b) => {
      const svc = services.find((s) => s.id === b.serviceId);
      return acc + (svc?.budgetTotal || 0);
    }, 0);
    const approvedAmount = budgets.filter((b) => ["Aprobado", "Finalizado", "Pte_Facturación"].includes(b.status)).reduce((acc, b) => {
      const svc = services.find((s) => s.id === b.serviceId);
      return acc + (svc?.budgetTotal || 0);
    }, 0);

    // By status
    const statusMap: Record<string, number> = {};
    budgets.forEach((b) => { statusMap[b.status] = (statusMap[b.status] || 0) + 1; });
    const byStatus = Object.entries(statusMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

    // Amount by status
    const amountMap: Record<string, number> = {};
    budgets.forEach((b) => {
      const svc = services.find((s) => s.id === b.serviceId);
      const key = b.status.replace(/_/g, " ");
      amountMap[key] = (amountMap[key] || 0) + (svc?.budgetTotal || 0);
    });
    const byAmount = Object.entries(amountMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    // Monthly trend
    const monthMap: Record<string, { count: number; amount: number }> = {};
    budgets.forEach((b) => {
      const m = b.createdAt?.slice(0, 7) || "Sin fecha";
      if (!monthMap[m]) monthMap[m] = { count: 0, amount: 0 };
      monthMap[m].count++;
      const svc = services.find((s) => s.id === b.serviceId);
      monthMap[m].amount += svc?.budgetTotal || 0;
    });
    const monthly = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, v]) => ({ name, presupuestos: v.count, importe: Math.round(v.amount) }));

    // Proforma stats
    const proformaSent = budgets.filter((b) => b.proformaSent).length;
    const proformaPaid = budgets.filter((b) => b.proformaPaid).length;

    // By collaborator
    const collabMap: Record<string, number> = {};
    budgets.forEach((b) => {
      const key = b.collaboratorName || "Sin colaborador";
      collabMap[key] = (collabMap[key] || 0) + 1;
    });
    const byCollaborator = Object.entries(collabMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));

    return { total, approved, rejected, pending, approvalRate, totalAmount, approvedAmount, byStatus, byAmount, monthly, proformaSent, proformaPaid, byCollaborator };
  }, [budgets, services]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/informes")}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Informe de presupuestos</h1>
          <p className="text-sm text-muted-foreground">{stats.total} presupuestos totales</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total" value={stats.total} icon={FileText} variant="default" />
        <KpiCard title="Aprobados" value={stats.approved} icon={FileText} variant="success" />
        <KpiCard title="Pendientes" value={stats.pending} icon={FileText} variant="warning" />
        <KpiCard title="Rechazados" value={stats.rejected} icon={FileText} variant="destructive" />
        <KpiCard title="Tasa aprob." value={`${stats.approvalRate}%`} icon={FileText} variant="info" />
        <KpiCard title="Vol. aprobado" value={`${(stats.approvedAmount / 1000).toFixed(1)}k €`} icon={FileText} variant="primary" />
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader><CardTitle className="text-base">Evolución mensual</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar yAxisId="left" dataKey="presupuestos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Cantidad" />
              <Bar yAxisId="right" dataKey="importe" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Importe (€)" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Distribución por estado</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Amount by status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Volumen económico por estado</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byAmount} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("es-ES")} €`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Importe" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By collaborator */}
        <Card>
          <CardHeader><CardTitle className="text-base">Por colaborador</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCollaborator} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Proforma stats */}
        <Card>
          <CardHeader><CardTitle className="text-base">Proformas</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 border border-border">
                <span className="text-3xl font-bold text-foreground">{stats.proformaSent}</span>
                <span className="text-xs text-muted-foreground mt-1">Enviadas</span>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-muted/50 border border-border">
                <span className="text-3xl font-bold text-foreground">{stats.proformaPaid}</span>
                <span className="text-xs text-muted-foreground mt-1">Cobradas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Exportar presupuestos</CardTitle>
          <Button variant="outline" size="sm" onClick={() => {
            exportCsv("presupuestos.csv", ["ID", "Servicio", "Cliente", "Estado", "Colaborador", "Fecha"],
              budgets.map((b) => [b.id, b.serviceName, b.clientName, b.status, b.collaboratorName || "", b.createdAt?.slice(0, 10) || ""]));
          }}><Download className="w-4 h-4 mr-1.5" /> CSV</Button>
        </CardHeader>
      </Card>
    </div>
  );
}
