import { useParams, useNavigate } from "react-router-dom";
import { mockServices, mockBudgets } from "@/data/mockData";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { differenceInHours } from "date-fns";
import ServiceInfoCards from "@/components/service-detail/ServiceInfoCards";
import ServiceDescription from "@/components/service-detail/ServiceDescription";
import ServiceTimeline from "@/components/service-detail/ServiceTimeline";
import ServiceMedia from "@/components/service-detail/ServiceMedia";
import ServiceComments from "@/components/service-detail/ServiceComments";
import ServiceSidebar from "@/components/service-detail/ServiceSidebar";
import ServiceProtocolChecklist from "@/components/service-detail/ServiceProtocolChecklist";
import ServiceMaterials from "@/components/service-detail/ServiceMaterials";
import type { ClaimStatus } from "@/types/urbango";
import { cn } from "@/lib/utils";

const claimStatusConfig: Record<ClaimStatus, { label: string; className: string }> = {
  Abierto: { label: "Abierto", className: "bg-info/15 text-info border-info/30" },
  En_Valoración: { label: "En Valoración", className: "bg-warning/15 text-warning border-warning/30" },
  Aceptado: { label: "Aceptado", className: "bg-success/15 text-success border-success/30" },
  Rechazado: { label: "Rechazado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  Cerrado: { label: "Cerrado", className: "bg-muted text-muted-foreground border-border" },
};

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const service = mockServices.find((s) => s.id === id);

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Servicio no encontrado</p>
        <Button variant="outline" onClick={() => navigate("/servicios")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const linkedBudget = mockBudgets.find((b) => b.serviceId === service.id);

  const getSlaStatus = () => {
    if (service.contactedAt) return null;
    const hours = differenceInHours(new Date(), new Date(service.receivedAt));
    if (hours >= 12) return "expired";
    if (hours >= 8) return "warning";
    return "ok";
  };

  const sla = getSlaStatus();
  const claimCfg = claimStatusConfig[service.claimStatus];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/servicios")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-foreground">{service.id}</h1>
            <StatusBadge status={service.status} />
            <StatusBadge urgency={service.urgency} />
            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", claimCfg.className)}>
              {claimCfg.label}
            </span>
            <span className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
              service.serviceType === "Presupuesto"
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-accent text-accent-foreground border-accent-foreground/20"
            )}>
              {service.serviceType === "Presupuesto" ? "📋 Con Presupuesto" : "🔧 Reparación Directa"}
            </span>
            <span className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
              service.serviceCategory === "Plan_Preventivo"
                ? "bg-info/15 text-info border-info/30"
                : "bg-muted text-muted-foreground border-border"
            )}>
              {service.serviceCategory === "Plan_Preventivo" ? "🛡 Plan Preventivo" : "🔨 Correctivo"}
            </span>
            {sla === "expired" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive animate-pulse-soft px-2.5 py-0.5 rounded-full border border-destructive/30 bg-destructive/15">
                ⏰ SLA Vencido
              </span>
            )}
            {sla === "warning" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning px-2.5 py-0.5 rounded-full border border-warning/30 bg-warning/15">
                ⚠ SLA Próximo
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">{service.specialty} · {service.origin} · Cluster {service.clusterId}</p>
        </div>
        {/* Budget actions */}
        {service.serviceType === "Presupuesto" && !linkedBudget && (
          <Button onClick={() => navigate(`/presupuestos/nuevo?serviceId=${service.id}`)}>
            <FileText className="w-4 h-4 mr-2" /> Crear Presupuesto
          </Button>
        )}
        {linkedBudget && (
          <Button variant="outline" onClick={() => navigate(`/presupuestos/${linkedBudget.id}`)}>
            <FileText className="w-4 h-4 mr-2" /> Ver Presupuesto {linkedBudget.id}
          </Button>
        )}
      </div>

      {/* Info cards row */}
      <ServiceInfoCards service={service} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <ServiceProtocolChecklist service={service} />
          <ServiceDescription service={service} />
          <ServiceTimeline service={service} />
          <ServiceMaterials service={service} />
          <ServiceComments
            title="Comentarios internos"
            description="Solo visibles para el equipo interno"
            comments={service.internalComments ?? []}
            variant="internal"
          />
          <ServiceComments
            title="Comentarios del gestor"
            description="Visibles para el colaborador"
            comments={service.managerComments ?? []}
            variant="manager"
          />
          <ServiceMedia service={service} />
        </div>

        {/* Sidebar */}
        <ServiceSidebar service={service} />
      </div>
    </div>
  );
}
