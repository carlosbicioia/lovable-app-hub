import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClients } from "@/hooks/useClients";
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

export default function ClientsReport() {
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const { services } = useServices();

  const stats = useMemo(() => {
    const total = clients.length;

    // By type
    const typeMap: Record<string, number> = {};
    clients.forEach((c) => { typeMap[c.clientType] = (typeMap[c.clientType] || 0) + 1; });
    const byType = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

    // By origin
    const origMap: Record<string, number> = {};
    clients.forEach((c) => { origMap[c.origin] = (origMap[c.origin] || 0) + 1; });
    const byOrigin = Object.entries(origMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    // By plan
    const planMap: Record<string, number> = {};
    clients.forEach((c) => { planMap[c.planType] = (planMap[c.planType] || 0) + 1; });
    const byPlan = Object.entries(planMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

    // By province (top 10)
    const provMap: Record<string, number> = {};
    clients.forEach((c) => { if (c.province) provMap[c.province] = (provMap[c.province] || 0) + 1; });
    const byProvince = Object.entries(provMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));

    // Monthly growth
    const monthMap: Record<string, number> = {};
    clients.forEach((c) => {
      // clients don't have createdAt in the hook, use id ordering as proxy
    });

    // Clients with services (recurrence)
    const clientServiceCount: Record<string, number> = {};
    services.forEach((s) => { clientServiceCount[s.clientId] = (clientServiceCount[s.clientId] || 0) + 1; });
    const withServices = Object.keys(clientServiceCount).length;
    const recurring = Object.values(clientServiceCount).filter((c) => c > 1).length;
    const singleService = Object.values(clientServiceCount).filter((c) => c === 1).length;
    const noServices = total - withServices;

    // Top clients by services
    const topClients = Object.entries(clientServiceCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, count]) => {
      const client = clients.find((c) => c.id === id);
      return { name: client?.fullName || id, value: count };
    });

    // Collaborator distribution
    const collabMap: Record<string, number> = {};
    clients.forEach((c) => {
      const key = c.collaboratorName || "Sin colaborador";
      collabMap[key] = (collabMap[key] || 0) + 1;
    });
    const byCollaborator = Object.entries(collabMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));

    return { total, byType, byOrigin, byPlan, byProvince, withServices, recurring, singleService, noServices, topClients, byCollaborator };
  }, [clients, services]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/informes")}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Informe de clientes</h1>
          <p className="text-sm text-muted-foreground">{stats.total} clientes registrados</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard title="Total clientes" value={stats.total} icon={Users} variant="primary" />
        <KpiCard title="Con servicios" value={stats.withServices} icon={Users} variant="success" />
        <KpiCard title="Recurrentes" value={stats.recurring} icon={Users} variant="info" />
        <KpiCard title="Un servicio" value={stats.singleService} icon={Users} variant="warning" />
        <KpiCard title="Sin servicios" value={stats.noServices} icon={Users} variant="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By type */}
        <Card>
          <CardHeader><CardTitle className="text-base">Por tipo de cliente</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
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
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By plan */}
        <Card>
          <CardHeader><CardTitle className="text-base">Por tipo de plan</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byPlan} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.byPlan.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By province */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 provincias</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byProvince} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--info))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top clients */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 clientes por nº de servicios</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topClients} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} name="Servicios" />
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
      </div>

      {/* Export */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Exportar datos de clientes</CardTitle>
          <Button variant="outline" size="sm" onClick={() => {
            exportCsv("clientes.csv", ["Nombre", "Tipo", "Origen", "Plan", "Provincia", "Colaborador"],
              clients.map((c) => [c.fullName, c.clientType, c.origin, c.planType, c.province, c.collaboratorName || ""]));
          }}><Download className="w-4 h-4 mr-1.5" /> Exportar CSV</Button>
        </CardHeader>
      </Card>
    </div>
  );
}
