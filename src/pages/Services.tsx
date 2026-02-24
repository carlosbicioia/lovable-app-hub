import { mockServices } from "@/data/mockData";
import { Search, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { useState } from "react";
import { differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";

export default function Services() {
  const [search, setSearch] = useState("");
  const filtered = mockServices.filter(
    (s) =>
      s.clientName.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
  );

  const getSlaStatus = (receivedAt: string, contactedAt: string | null) => {
    if (contactedAt) return null;
    const hours = differenceInHours(new Date(), new Date(receivedAt));
    if (hours >= 12) return "expired";
    if (hours >= 8) return "warning";
    return "ok";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Servicios</h1>
          <p className="text-muted-foreground text-sm mt-1">{mockServices.length} servicios en sistema</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Servicio
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">ID</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Origen</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Cliente</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Especialidad</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Técnico</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">SLA</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Urgencia</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Presupuesto</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const sla = getSlaStatus(s.receivedAt, s.contactedAt);
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {s.origin}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-card-foreground">{s.clientName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.specialty}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.operatorName ?? "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3">
                      {sla === "expired" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive animate-pulse-soft">
                          ⏰ Vencido
                        </span>
                      )}
                      {sla === "warning" && (
                        <span className="text-xs font-medium text-warning">⚠ Próximo</span>
                      )}
                      {sla === "ok" && (
                        <span className="text-xs text-muted-foreground">✓ OK</span>
                      )}
                      {!sla && <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3"><StatusBadge urgency={s.urgency} /></td>
                    <td className="px-5 py-3">
                      {s.budgetStatus ? (
                        <span className={cn(
                          "text-xs font-medium",
                          s.budgetStatus === "Aprobado" ? "text-success" :
                          s.budgetStatus === "Pendiente" ? "text-warning" :
                          s.budgetStatus === "Rechazado" ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {s.budgetStatus}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">
                      {s.budgetTotal ? `€${s.budgetTotal.toLocaleString()}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
