import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HardHat, Download, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOperators } from "@/hooks/useOperators";
import KpiCard from "@/components/shared/KpiCard";
import { exportCsv } from "@/lib/exportCsv";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const COLORS = [
  "hsl(211,86%,50%)", "hsl(152,60%,42%)", "hsl(38,92%,50%)",
  "hsl(0,84%,60%)", "hsl(340,75%,55%)", "hsl(25,95%,53%)",
];

export default function OperatorsReport() {
  const navigate = useNavigate();
  const { data: operators = [] } = useOperators();

  const stats = useMemo(() => {
    const active = operators.filter((o) => o.status === "Activo");
    const totalRevenue = active.reduce((a, o) => a + o.totalRevenue, 0);
    const totalCompleted = active.reduce((a, o) => a + o.completedServices, 0);
    const totalActive = active.reduce((a, o) => a + o.activeServices, 0);
    const withNps = active.filter((o) => o.npsMean > 0);
    const avgNps = withNps.length ? (withNps.reduce((a, o) => a + o.npsMean, 0) / withNps.length).toFixed(1) : "—";

    // By specialty
    const specMap: Record<string, number> = {};
    active.forEach((o) => { specMap[o.specialty] = (specMap[o.specialty] || 0) + 1; });
    const bySpecialty = Object.entries(specMap).map(([name, value]) => ({ name, value }));

    // Revenue ranking (top 10)
    const revenueRanking = [...active].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10)
      .map((o) => ({ name: o.name, value: o.totalRevenue }));

    // Completed ranking (top 10)
    const completedRanking = [...active].sort((a, b) => b.completedServices - a.completedServices).slice(0, 10)
      .map((o) => ({ name: o.name, value: o.completedServices }));

    // NPS ranking
    const npsRanking = [...active].filter((o) => o.npsMean > 0).sort((a, b) => b.npsMean - a.npsMean).slice(0, 10)
      .map((o) => ({ name: o.name, value: o.npsMean }));

    // Radar data for top 5
    const top5 = [...active].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
    const radarData = top5.map((o) => ({
      name: o.name.split(" ")[0],
      completados: o.completedServices,
      ingresos: Math.round(o.totalRevenue / 1000),
      nps: o.npsMean * 10,
      activos: o.activeServices,
    }));

    return { active: active.length, inactive: operators.length - active.length, totalRevenue, totalCompleted, totalActive, avgNps, bySpecialty, revenueRanking, completedRanking, npsRanking, radarData, allActive: active };
  }, [operators]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/informes")}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Informe de operarios</h1>
          <p className="text-sm text-muted-foreground">{operators.length} operarios registrados</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Activos" value={stats.active} icon={HardHat} variant="success" />
        <KpiCard title="Inactivos" value={stats.inactive} icon={HardHat} variant="default" />
        <KpiCard title="Completados" value={stats.totalCompleted} icon={HardHat} variant="primary" />
        <KpiCard title="En curso" value={stats.totalActive} icon={HardHat} variant="warning" />
        <KpiCard title="NPS medio" value={stats.avgNps} icon={TrendingUp} variant="info" />
        <KpiCard title="Ingresos" value={`${(stats.totalRevenue / 1000).toFixed(0)}k €`} icon={HardHat} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue ranking */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 por ingresos</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueRanking} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("es-ES")} €`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completed ranking */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 por servicios completados</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.completedRanking} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Completados" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By specialty */}
        <Card>
          <CardHeader><CardTitle className="text-base">Distribución por especialidad</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.bySpecialty} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.bySpecialty.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* NPS ranking */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 por NPS</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.npsRanking} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 10]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} name="NPS" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Full table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Tabla completa de operarios activos</CardTitle>
          <Button variant="outline" size="sm" onClick={() => {
            exportCsv("operarios.csv", ["Operario", "Especialidad", "Completados", "Activos", "Ingresos", "NPS"],
              stats.allActive.sort((a, b) => b.completedServices - a.completedServices)
                .map((o) => [o.name, o.specialty, String(o.completedServices), String(o.activeServices), String(o.totalRevenue), String(o.npsMean)]));
          }}><Download className="w-4 h-4 mr-1.5" /> CSV</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Operario</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Especialidad</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Completados</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Activos</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ingresos</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">NPS</th>
              </tr></thead>
              <tbody>
                {stats.allActive.sort((a, b) => b.completedServices - a.completedServices).map((o) => (
                  <tr key={o.id} className="border-b border-border/50">
                    <td className="py-2 px-3 font-medium text-foreground">{o.name}</td>
                    <td className="py-2 px-3 text-foreground">{o.specialty}</td>
                    <td className="py-2 px-3 text-right text-foreground">{o.completedServices}</td>
                    <td className="py-2 px-3 text-right text-foreground">{o.activeServices}</td>
                    <td className="py-2 px-3 text-right text-foreground">{o.totalRevenue.toLocaleString("es-ES")} €</td>
                    <td className="py-2 px-3 text-right text-foreground">{o.npsMean > 0 ? o.npsMean.toFixed(1) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
