import { mockServices } from "@/data/mockData";
import { Search, Plus, Filter, Image, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { useState } from "react";
import { differenceInHours, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useBudgets } from "@/hooks/useBudgets";
import type { BudgetStatus } from "@/types/urbango";

export default function Services() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { budgets } = useBudgets();

  const getBudgetStatusForService = (serviceId: string): BudgetStatus | null => {
    const budget = budgets.find((b) => b.serviceId === serviceId);
    return budget?.status ?? null;
  };

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

  const mediaCount = (s: typeof filtered[0]) => {
    const photos = s.media?.filter(m => m.type === "photo").length ?? 0;
    const videos = s.media?.filter(m => m.type === "video").length ?? 0;
    return { photos, videos };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Servicios</h1>
          <p className="text-muted-foreground text-sm mt-1">{mockServices.length} servicios en sistema</p>
        </div>
        <Button onClick={() => navigate("/servicios/nuevo")}>
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
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha Alta</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha Prevista</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">SLA</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Urgencia</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Media</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Presupuesto</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const sla = getSlaStatus(s.receivedAt, s.contactedAt);
                const { photos, videos } = mediaCount(s);
                return (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/servicios/${s.id}`)}
                  >
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
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {format(new Date(s.receivedAt), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {s.scheduledAt ? (
                        <span className="text-card-foreground font-medium">
                          {format(new Date(s.scheduledAt), "dd MMM yyyy · HH:mm", { locale: es })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sin agendar</span>
                      )}
                    </td>
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {photos > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Image className="w-3.5 h-3.5" /> {photos}
                          </span>
                        )}
                        {videos > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Video className="w-3.5 h-3.5" /> {videos}
                          </span>
                        )}
                        {photos === 0 && videos === 0 && "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {(() => {
                        const bStatus = getBudgetStatusForService(s.id);
                        if (!bStatus) return "—";
                        return (
                          <span className={cn(
                            "text-xs font-medium",
                            bStatus === "Aprobado" ? "text-success" :
                            bStatus === "Borrador" || bStatus === "Enviado" ? "text-warning" :
                            bStatus === "Rechazado" ? "text-destructive" :
                            bStatus === "Pte_Facturación" ? "text-info" : "text-muted-foreground"
                          )}>
                            {bStatus === "Pte_Facturación" ? "Pte. Facturación" : bStatus}
                          </span>
                        );
                      })()}
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
