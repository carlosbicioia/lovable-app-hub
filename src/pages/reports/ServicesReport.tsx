import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useServices } from "@/hooks/useServices";
import KpiCard from "@/components/shared/KpiCard";
import { exportCsv } from "@/lib/exportCsv";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = [
  "hsl(211,86%,50%)", "hsl(152,60%,42%)", "hsl(38,92%,50%)",
  "hsl(0,84%,60%)", "hsl(340,75%,55%)", "hsl(25,95%,53%)",
  "hsl(210,80%,52%)", "hsl(280,60%,50%)",
];

export default function ServicesReport() {
  const navigate = useNavigate();
  const { services } = useServices();

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => !["Finalizado", "Liquidado"].includes(s.status)).length;
    const completed = services.filter((s) => ["Finalizado", "Liquidado"].includes(s.status)).length;
    const withNps = services.filter((s) => s.nps != null);
    const avgNps = withNps.length ? (withNps.reduce((a, s) => a + (s.nps || 0), 0) / withNps.length).toFixed(1) : "—";
    const avgHours = services.filter((s) => s.realHours).length
      ? (services.filter((s) => s.realHours).reduce((a, s) => a + (s.realHours || 0), 0) / services.filter((s) => s.realHours).length).toFixed(1)
      : "—";
    const totalRevenue = services.reduce((a, s) => a + (s.budgetTotal || 0), 0);

    // By status
    const statusMap: Record<string, number> = {};
    services.forEach((s) => { statusMap[s.status] = (statusMap[s.status] || 0) + 1; });
    const byStatus = Object.entries(statusMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

    // By specialty
    const specMap: Record<string, number> = {};
    services.forEach((s) => { specMap[s.specialty] = (specMap[s.specialty] || 0) + 1; });
    const bySpecialty = Object.entries(specMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    // By urgency
    const urgMap: Record<string, number> = {};
    services.forEach((s) => { urgMap[s.urgency] = (urgMap[s.urgency] || 0) + 1; });
    const byUrgency = Object.entries(urgMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    // By origin
    const origMap: Record<string, number> = {};
    services.forEach((s) => { origMap[s.origin] = (origMap[s.origin] || 0) + 1; });
    const byOrigin = Object.entries(origMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    // By month
    const monthMap: Record<string, number> = {};
    services.forEach((s) => {
      const m = s.receivedAt ? s.receivedAt.slice(0, 7) : "Sin fecha";
      monthMap[m] = (monthMap[m] || 0) + 1;
    });
    const byMonth = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0])).map(([name, value]) => ({ name, value }));

    return { total, active, completed, avgNps, avgHours, totalRevenue, byStatus, bySpecialty, byUrgency, byOrigin, byMonth };
  }, [services]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/informes")}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Informe de servicios</h1>
          <p className="text-sm text-muted-foreground">{stats.total} servicios totales</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total" value={stats.total} icon={Wrench} variant="default" />
        <KpiCard title="Activos" value={stats.active} icon={Wrench} variant="primary" />
        <KpiCard title="Completados" value={stats.completed} icon={Wrench} variant="success" />
        <KpiCard title="NPS medio" value={stats.avgNps} icon={Wrench} variant="info" />
        <KpiCard title="Horas medias" value={stats.avgHours} icon={Wrench} variant="warning" />
        <KpiCard title="Facturación" value={`${(stats.totalRevenue / 1000).toFixed(1)}k €`} icon={Wrench} variant="success" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Por estado</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byStatus} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By specialty */}
        <Card>
          <CardHeader><CardTitle className="text-base">Por especialidad</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.bySpecialty} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {stats.bySpecialty.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By urgency */}
        <Card>
          <CardHeader><CardTitle className="text-base">Por urgencia</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byUrgency} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.byUrgency.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By origin */}
        <Card>
          <CardHeader><CardTitle className="text-base">Por origen</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byOrigin} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader><CardTitle className="text-base">Evolución mensual</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Servicios" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Full table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Detalle por estado</CardTitle>
          <Button variant="outline" size="sm" onClick={() => {
            exportCsv("servicios-por-estado.csv", ["Estado", "Cantidad", "% del total"],
              stats.byStatus.map((s) => [s.name, String(s.value), ((s.value / stats.total) * 100).toFixed(1) + "%"]));
          }}>
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </Button>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-right py-2 px-3 font-medium text-muted-foreground">Cantidad</th>
              <th className="text-right py-2 px-3 font-medium text-muted-foreground">% del total</th>
            </tr></thead>
            <tbody>
              {stats.byStatus.map((s) => (
                <tr key={s.name} className="border-b border-border/50">
                  <td className="py-2 px-3 text-foreground">{s.name}</td>
                  <td className="py-2 px-3 text-right font-medium text-foreground">{s.value}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{((s.value / stats.total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
