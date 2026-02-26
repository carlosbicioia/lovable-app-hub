import { useParams, useNavigate } from "react-router-dom";
import { useServices } from "@/hooks/useServices";
import { useBudgets } from "@/hooks/useBudgets";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { ArrowLeft, FileText, Pencil, Clock, Package, Euro, Trash2, MoreVertical, Loader2, ShoppingCart, AlertTriangle as AlertTriangleIcon } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { ClaimStatus } from "@/types/urbango";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const claimStatusConfig: Record<ClaimStatus, { label: string; className: string; tooltip: string }> = {
  Abierto: { label: "Abierto", className: "bg-info/15 text-info border-info/30", tooltip: "Reclamación abierta por el cliente o colaborador" },
  En_Valoración: { label: "En Valoración", className: "bg-warning/15 text-warning border-warning/30", tooltip: "Reclamación en proceso de valoración interna" },
  Aceptado: { label: "Aceptado", className: "bg-success/15 text-success border-success/30", tooltip: "Reclamación aceptada — se procede con la solución" },
  Rechazado: { label: "Rechazado", className: "bg-destructive/15 text-destructive border-destructive/30", tooltip: "Reclamación rechazada tras valoración" },
  Cerrado: { label: "Cerrado", className: "bg-muted text-muted-foreground border-border", tooltip: "Reclamación cerrada y resuelta" },
};

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { services, loading: servicesLoading } = useServices();
  const service = services.find((s) => s.id === id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const { budgets } = useBudgets();
  const linkedBudget = budgets.find((b) => b.serviceId === service.id);

  const { data: allPurchaseOrders = [] } = usePurchaseOrders();
  const linkedOrders = allPurchaseOrders.filter((o) => o.serviceId === service.id);

  const getSlaStatus = () => {
    if (service.contactedAt) return null;
    const hours = differenceInHours(new Date(), new Date(service.receivedAt));
    if (hours >= 12) return "expired";
    if (hours >= 8) return "warning";
    return "ok";
  };

  const sla = getSlaStatus();
  const claimCfg = claimStatusConfig[service.claimStatus];

  const handleDeleteService = () => {
    toast.success("Servicio eliminado correctamente");
    navigate("/servicios");
  };

  const handleDeleteBudget = () => {
    toast.success("Presupuesto eliminado correctamente");
  };

  return (
    <TooltipProvider>
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-help", claimCfg.className)}>
                    {claimCfg.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">{claimCfg.tooltip}</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-help",
                    service.serviceType === "Presupuesto"
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "bg-accent text-accent-foreground border-accent-foreground/20"
                  )}>
                    {service.serviceType === "Presupuesto" ? "📋 Con Presupuesto" : "🔧 Reparación Directa"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {service.serviceType === "Presupuesto"
                      ? "Requiere presupuesto previo aprobado por el cliente"
                      : "El técnico repara directamente sin presupuesto previo"}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-help",
                    service.serviceCategory === "Plan_Preventivo"
                      ? "bg-info/15 text-info border-info/30"
                      : "bg-muted text-muted-foreground border-border"
                  )}>
                    {service.serviceCategory === "Plan_Preventivo" ? "🛡 Plan Preventivo" : "🔨 Correctivo"}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {service.serviceCategory === "Plan_Preventivo"
                      ? "Servicio programado dentro del plan de mantenimiento del cliente"
                      : "Servicio reactivo por avería o incidencia reportada"}
                  </p>
                </TooltipContent>
              </Tooltip>
              {sla === "expired" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive animate-pulse-soft px-2.5 py-0.5 rounded-full border border-destructive/30 bg-destructive/15 cursor-help">
                      ⏰ SLA Vencido
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Han pasado más de 12h sin contactar al cliente</p></TooltipContent>
                </Tooltip>
              )}
              {sla === "warning" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-warning px-2.5 py-0.5 rounded-full border border-warning/30 bg-warning/15 cursor-help">
                      ⚠ SLA Próximo
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Quedan menos de 4h para que venza el SLA de primer contacto</p></TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">{service.specialty} · {service.origin} · Cluster {service.clusterId}</p>
          </div>
          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/servicios/${service.id}/editar`)}>
                <Pencil className="w-4 h-4 mr-2" /> Modificar servicio
              </DropdownMenuItem>
              {service.serviceType === "Presupuesto" && !linkedBudget && (
                <DropdownMenuItem onClick={() => navigate(`/presupuestos/nuevo?serviceId=${service.id}`)}>
                  <FileText className="w-4 h-4 mr-2" /> Crear presupuesto
                </DropdownMenuItem>
              )}
              {linkedBudget && (
                <DropdownMenuItem onClick={() => navigate(`/presupuestos/${linkedBudget.id}`)}>
                  <FileText className="w-4 h-4 mr-2" /> Ver presupuesto
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar servicio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="overview" className="text-sm">Visión general</TabsTrigger>
            <TabsTrigger value="details" className="text-sm">Detalles del servicio</TabsTrigger>
            <TabsTrigger value="budget" className="text-sm">Presupuesto</TabsTrigger>
          </TabsList>

          {/* Tab: Visión general */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            <ServiceInfoCards service={service} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ServiceDescription service={service} />
                <ServiceProtocolChecklist service={service} />

                {/* Linked purchase orders */}
                {linkedOrders.length > 0 && (
                  <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                        Órdenes de compra ({linkedOrders.length})
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/compras/nueva?serviceId=${service.id}`)}>
                        Nueva OC
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y divide-border">
                        {linkedOrders.map((o) => {
                          const statusCfg: Record<string, { label: string; cls: string }> = {
                            Borrador: { label: "Borrador", cls: "bg-muted text-muted-foreground" },
                            Pendiente_Aprobación: { label: "Pte. Aprobación", cls: "bg-warning/15 text-warning border-warning/30" },
                            Aprobada: { label: "Aprobada", cls: "bg-info/15 text-info border-info/30" },
                            Recogida: { label: "Recogida", cls: "bg-primary/15 text-primary border-primary/30" },
                            Conciliada: { label: "Conciliada", cls: "bg-success/15 text-success border-success/30" },
                          };
                          const sc = statusCfg[o.status] ?? statusCfg.Borrador;
                          return (
                            <div
                              key={o.id}
                              className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-1 px-1 rounded transition-colors cursor-pointer"
                              onClick={() => navigate(`/compras/${o.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", sc.cls)}>
                                  {sc.label}
                                </span>
                                {o.isEmergency && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/15 text-destructive border border-destructive/30">
                                    <AlertTriangleIcon className="w-3 h-3" /> Emergencia
                                  </span>
                                )}
                                <span className="text-sm text-foreground">{o.supplierName}</span>
                                <span className="text-xs text-muted-foreground">{o.lines.length} material(es)</span>
                              </div>
                              <span className="text-sm font-semibold text-foreground">€{o.totalCost.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
                <ServiceTimeline service={service} />
              </div>
              <ServiceSidebar service={service} />
            </div>
          </TabsContent>

          {/* Tab: Detalles */}
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

          {/* Tab: Presupuesto */}
          <TabsContent value="budget" className="space-y-6 mt-4">
            {service.serviceType === "Presupuesto" ? (
              <>
                <ServiceMaterials service={service} />

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
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate(`/presupuestos/${linkedBudget.id}`)}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar presupuesto
                        </Button>
                        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleDeleteBudget}>
                          <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
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
                        linkedBudget?.status === "Aprobado" ? "text-success" :
                        linkedBudget?.status === "Borrador" || linkedBudget?.status === "Enviado" ? "text-warning" :
                        linkedBudget?.status === "Rechazado" ? "text-destructive" :
                        linkedBudget?.status === "Pte_Facturación" ? "text-info" : "text-muted-foreground"
                      )}>
                        {linkedBudget ? (linkedBudget.status === "Pte_Facturación" ? "Pte. Facturación" : linkedBudget.status) : "—"}
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
              /* Reparación directa — Hours, materials and economic summary */
              <>
                <ServiceMaterials service={service} />

                {/* Hours worked by the technician */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" /> Horas del industrial
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Horas registradas</p>
                        <p className="text-lg font-bold text-card-foreground">
                          {service.realHours != null ? `${service.realHours}h` : "Sin registrar"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Técnico</p>
                        <p className="text-sm font-medium text-card-foreground">
                          {service.operatorName ?? "Sin asignar"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Materiales usados</p>
                        <p className="text-sm font-medium text-card-foreground">
                          {(service.materials?.length ?? 0) > 0 ? `${service.materials!.length} artículo(s)` : "Ninguno"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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

        {/* Delete confirmation dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar servicio {service.id}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente el servicio, sus comentarios, archivos multimedia y el presupuesto asociado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteService}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
