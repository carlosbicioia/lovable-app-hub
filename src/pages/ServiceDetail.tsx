import { useParams, useNavigate } from "react-router-dom";
import { mockServices, mockBudgets } from "@/data/mockData";
import { ArrowLeft, FileText, Pencil, Clock, Package, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="text-sm">Visión general</TabsTrigger>
          <TabsTrigger value="details" className="text-sm">Detalles del servicio</TabsTrigger>
          <TabsTrigger value="budget" className="text-sm">Presupuesto</TabsTrigger>
        </TabsList>

        {/* Tab: Visión general — ALL information */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <ServiceInfoCards service={service} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ServiceDescription service={service} />
              <ServiceProtocolChecklist service={service} />
              <ServiceTimeline service={service} />
            </div>
            <ServiceSidebar service={service} />
          </div>
        </TabsContent>

        {/* Tab: Detalles — Comments (with add), Photos/Videos, Documents */}
        <TabsContent value="details" className="space-y-6 mt-4">
          <ServiceComments
            title="Comentarios internos"
            description="Solo visibles para el equipo interno"
            comments={service.internalComments ?? []}
            variant="internal"
            onAddComment={(text) => console.log("Internal comment:", text)}
          />
          <ServiceComments
            title="Comentarios del gestor"
            description="Visibles para el colaborador"
            comments={service.managerComments ?? []}
            variant="manager"
            onAddComment={(text) => console.log("Manager comment:", text)}
          />
          <ServiceMedia service={service} />
        </TabsContent>

        {/* Tab: Presupuesto — Materials + Budget detail OR economic summary */}
        <TabsContent value="budget" className="space-y-6 mt-4">
          {service.serviceType === "Presupuesto" ? (
            <>
              {/* Materials & purchases */}
              <ServiceMaterials service={service} />

              {/* Budget detail */}
              {linkedBudget ? (
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Presupuesto {linkedBudget.id}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Creado el {new Date(linkedBudget.createdAt).toLocaleDateString("es-ES")} · Estado: {linkedBudget.status}
                      </p>
                    </div>
                    <Button onClick={() => navigate(`/presupuestos/${linkedBudget.id}`)}>
                      <Pencil className="w-4 h-4 mr-2" /> Modificar presupuesto
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {/* Budget lines table */}
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-muted-foreground font-medium">Concepto</th>
                          <th className="text-center py-2 text-muted-foreground font-medium">Uds.</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Coste</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Margen</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">IVA</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linkedBudget.lines.map((line) => {
                          const subtotal = line.units * line.costPrice * (1 + line.margin / 100);
                          const total = subtotal * (1 + line.taxRate / 100);
                          return (
                            <tr key={line.id} className="border-b border-border last:border-0">
                              <td className="py-2 text-card-foreground">
                                {line.concept}
                                {line.description && (
                                  <span className="block text-xs text-muted-foreground">{line.description}</span>
                                )}
                              </td>
                              <td className="py-2 text-center text-muted-foreground">{line.units}</td>
                              <td className="py-2 text-right text-muted-foreground">{line.costPrice.toFixed(2)} €</td>
                              <td className="py-2 text-right text-muted-foreground">{line.margin}%</td>
                              <td className="py-2 text-right text-muted-foreground">{line.taxRate}%</td>
                              <td className="py-2 text-right font-medium text-card-foreground">{total.toFixed(2)} €</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-foreground/20">
                          <td colSpan={5} className="py-2 font-bold text-card-foreground text-right">Total presupuesto:</td>
                          <td className="py-2 text-right font-bold text-card-foreground text-lg">
                            {service.budgetTotal ? `€${service.budgetTotal.toLocaleString()}` : "—"}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">Sin presupuesto vinculado</p>
                    <p className="text-xs text-muted-foreground mt-1">Este servicio requiere presupuesto pero aún no se ha creado uno.</p>
                    <Button className="mt-4" onClick={() => navigate(`/presupuestos/nuevo?serviceId=${service.id}`)}>
                      <FileText className="w-4 h-4 mr-2" /> Crear Presupuesto
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Estado</p>
                    <p className={cn(
                      "text-sm font-semibold",
                      service.budgetStatus === "Aprobado" ? "text-success" :
                      service.budgetStatus === "Pendiente" ? "text-warning" :
                      service.budgetStatus === "Rechazado" ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {service.budgetStatus ?? "—"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Importe total</p>
                    <p className="text-lg font-bold text-card-foreground">
                      {service.budgetTotal ? `€${service.budgetTotal.toLocaleString()}` : "—"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Horas reales</p>
                    <p className="text-lg font-bold text-card-foreground">
                      {service.realHours != null ? `${service.realHours}h` : "—"}
                    </p>
                  </CardContent>
                </Card>
                {service.nps !== null && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">NPS</p>
                      <p className={cn(
                        "text-lg font-bold",
                        service.nps >= 9 ? "text-success" : service.nps >= 7 ? "text-warning" : "text-destructive"
                      )}>
                        {service.nps}/10
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            /* Reparación directa — Economic summary */
            <>
              <ServiceMaterials service={service} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Euro className="w-4 h-4 text-muted-foreground" /> Resumen económico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Importe</p>
                      <p className="text-lg font-bold text-card-foreground">
                        {service.budgetTotal ? `€${service.budgetTotal.toLocaleString()}` : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Horas reales</p>
                      <p className="text-lg font-bold text-card-foreground">
                        {service.realHours != null ? `${service.realHours}h` : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Coste/hora</p>
                      <p className="text-lg font-bold text-card-foreground">
                        {service.budgetTotal && service.realHours
                          ? `€${(service.budgetTotal / service.realHours).toFixed(2)}`
                          : "—"}
                      </p>
                    </div>
                    {service.nps !== null && (
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">NPS</p>
                        <p className={cn(
                          "text-lg font-bold",
                          service.nps >= 9 ? "text-success" : service.nps >= 7 ? "text-warning" : "text-destructive"
                        )}>
                          {service.nps}/10
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
