import { Users, Wrench, AlertTriangle, TrendingUp, Clock, Handshake, Star, Euro } from "lucide-react";
import KpiCard from "@/components/shared/KpiCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { mockServices } from "@/data/mockData";

export default function Dashboard() {
  const pendingContact = mockServices.filter((s) => s.status === "Pendiente_Contacto").length;
  const inProgress = mockServices.filter((s) => s.status === "En_Curso").length;
  const urgent = mockServices.filter((s) => s.urgency !== "Estándar").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Panel de Control</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen operativo de UrbanGO</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Servicios Activos" value={mockServices.length} subtitle="Total en sistema" icon={Wrench} variant="primary" trend={{ value: "12% vs mes ant.", positive: true }} />
        <KpiCard title="Pte. Contacto" value={pendingContact} subtitle="SLA 12h activo" icon={Clock} variant="warning" />
        <KpiCard title="En Curso" value={inProgress} subtitle="Técnicos asignados" icon={TrendingUp} variant="info" />
        <KpiCard title="Urgencias" value={urgent} subtitle="24h o inmediato" icon={AlertTriangle} variant="warning" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Clientes Totales" value={8} icon={Users} variant="default" />
        <KpiCard title="Colaboradores" value={5} icon={Handshake} variant="success" />
        <KpiCard title="NPS Medio" value="8.6" icon={Star} variant="primary" />
        <KpiCard title="Facturación Mes" value="€12.4k" icon={Euro} variant="success" trend={{ value: "8% vs mes ant.", positive: true }} />
      </div>

      {/* Recent services table */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-5 border-b border-border">
          <h2 className="font-display font-semibold text-card-foreground">Servicios Recientes</h2>
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
              {mockServices.slice(0, 5).map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
