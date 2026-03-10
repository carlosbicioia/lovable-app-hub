import { useParams, useNavigate } from "react-router-dom";
import { useServices } from "@/hooks/useServices";
import { useBudgets } from "@/hooks/useBudgets";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText, Pencil, Clock, Euro, Trash2, MoreVertical, Loader2, ShoppingCart, AlertTriangle as AlertTriangleIcon, ClipboardList, MessageSquare, Image, BarChart3, User, MapPin, Phone, Building2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { differenceInHours, format } from "date-fns";
import { es } from "date-fns/locale";
import ServiceInfoCards from "@/components/service-detail/ServiceInfoCards";
import ServiceDescription from "@/components/service-detail/ServiceDescription";
import ServiceTimeline from "@/components/service-detail/ServiceTimeline";
import ServiceMedia from "@/components/service-detail/ServiceMedia";
import ServiceComments from "@/components/service-detail/ServiceComments";
import ServiceSidebar from "@/components/service-detail/ServiceSidebar";
import ServiceProtocolChecklist from "@/components/service-detail/ServiceProtocolChecklist";
import ServicePurchases from "@/components/service-detail/ServicePurchases";
import ServiceSalesOrders from "@/components/service-detail/ServiceSalesOrders";
import { useSalesOrders } from "@/hooks/useSalesOrders";
import ServiceMaterials from "@/components/service-detail/ServiceMaterials";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { ClaimStatus } from "@/types/urbango";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { services, loading: servicesLoading, updateService } = useServices();
  const { budgets, refetch: refetchBudgets } = useBudgets();
  const { data: allPurchaseOrders = [] } = usePurchaseOrders(id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteBudgetDialog, setShowDeleteBudgetDialog] = useState(false);
  const { data: salesOrders = [] } = useSalesOrders(id);

  const service = services.find((s) => s.id === id);
  const linkedBudget = budgets.find((b) => b.serviceId === id);
  const linkedOrders = allPurchaseOrders;

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

  const getSlaStatus = () => {
    if (service.contactedAt) return null;
    const hours = differenceInHours(new Date(), new Date(service.receivedAt));
    if (hours >= 12) return "expired";
    if (hours >= 8) return "warning";
    return "ok";
  };

  const sla = getSlaStatus();
  const financialCount = (linkedBudget ? 1 : 0) + linkedOrders.length + salesOrders.length;

  const handleDeleteService = async () => {
    try {
      if (linkedBudget) {
        await supabase.from("budget_lines").delete().eq("budget_id", linkedBudget.id);
        await supabase.from("budgets").delete().eq("id", linkedBudget.id);
      }
      await supabase.from("service_media").delete().eq("service_id", service.id);
      const { error } = await supabase.from("services").delete().eq("id", service.id);
      if (error) throw error;
      toast.success("Servicio eliminado correctamente");
      navigate("/servicios");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar el servicio");
    }
  };

  const handleDeleteBudget = async () => {
    if (!linkedBudget) return;
    try {
      await supabase.from("budget_lines").delete().eq("budget_id", linkedBudget.id);
      const { error } = await supabase.from("budgets").delete().eq("id", linkedBudget.id);
      if (error) throw error;
      await updateService(service.id, { service_type: "Reparación_Directa" });
      await refetchBudgets();
      toast.success("Presupuesto eliminado. El servicio ha pasado a Reparación Directa.");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar el presupuesto");
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(service.id);
    toast.success("ID copiado");
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Compact header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" onClick={() => navigate("/servicios")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-bold text-foreground">{service.id}</h1>
              <Button variant="ghost" size="icon" className="w-6 h-6" onClick={copyId}>
                <Copy className="w-3 h-3" />
              </Button>
              <StatusBadge urgency={service.urgency} />
              {sla === "expired" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive animate-pulse-soft px-1.5 py-0.5 rounded-full border border-destructive/30 bg-destructive/15 cursor-help">
                      ⏰ SLA Vencido
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Más de 12h sin contactar al cliente</p></TooltipContent>
                </Tooltip>
              )}
              {sla === "warning" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-warning px-1.5 py-0.5 rounded-full border border-warning/30 bg-warning/15">
                  ⚠ SLA Próximo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span className="font-medium text-card-foreground">{service.clientName}</span>
              <span>·</span>
              <span>{service.specialty}</span>
              <span>·</span>
              <span>{service.origin}</span>
              <span>·</span>
              <span>{service.serviceCategory === "Plan_Preventivo" ? "🛡 Preventivo" : "🔨 Correctivo"}</span>
              <span>·</span>
              <span>{service.serviceType === "Presupuesto" ? "📋 Presupuesto" : "🔧 Rep. Directa"}</span>
              <span>·</span>
              <span className="text-muted-foreground/60">Cluster {service.clusterId}</span>
            </div>
          </div>
          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
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
              <DropdownMenuItem onClick={() => navigate(`/compras/nueva?serviceId=${service.id}`)}>
                <ShoppingCart className="w-4 h-4 mr-2" /> Nueva orden de compra
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar servicio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status pipeline + Info Cards */}
        <ServiceInfoCards service={service} />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start bg-muted/50 p-0.5 h-auto flex-wrap gap-0.5">
            <TabsTrigger value="overview" className="text-xs gap-1 h-8">
              <BarChart3 className="w-3 h-3" /> Resumen
            </TabsTrigger>
            <TabsTrigger value="operations" className="text-xs gap-1 h-8">
              <ClipboardList className="w-3 h-3" /> Operativa
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs gap-1 h-8">
              <MessageSquare className="w-3 h-3" /> Notas
            </TabsTrigger>
            <TabsTrigger value="financial" className="text-xs gap-1 h-8">
              <Euro className="w-3 h-3" /> Económico
              {financialCount > 0 && (
                <span className="px-1 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold">{financialCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: RESUMEN */}
          <TabsContent value="overview" className="space-y-4 mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <ServiceDescription service={service} onUpdate={(updates) => updateService(service.id, updates)} />

                {/* Quick KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-card rounded-lg border border-border p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Importe</p>
                    <p className="text-base font-bold text-card-foreground">
                      {service.budgetTotal ? `€${service.budgetTotal.toLocaleString()}` : "—"}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Horas</p>
                    <p className="text-base font-bold text-card-foreground">
                      {service.realHours != null ? `${service.realHours}h` : "—"}
                    </p>
                  </div>
                  <div className="bg-card rounded-lg border border-border p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Materiales</p>
                    <p className="text-base font-bold text-card-foreground">
                      {(service.materials?.length ?? 0) > 0 ? service.materials!.length : "—"}
                    </p>
                  </div>
                  {service.nps !== null && (
                    <div className="bg-card rounded-lg border border-border p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">NPS</p>
                      <p className={cn(
                        "text-base font-bold",
                        service.nps >= 9 ? "text-success" : service.nps >= 7 ? "text-warning" : "text-destructive"
                      )}>
                        {service.nps}/10
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <ServiceSidebar service={service} />
            </div>
          </TabsContent>

          {/* Tab 2: OPERATIVA */}
          <TabsContent value="operations" className="space-y-4 mt-3">
            <ServiceProtocolChecklist service={service} />
            <ServiceTimeline service={service} />
            <ServiceMedia service={service} />
            <ServiceMaterials service={service} />
          </TabsContent>

          {/* Tab 3: NOTAS */}
          <TabsContent value="notes" className="space-y-4 mt-3">
            <ServiceComments
              title="Comentarios internos"
              description="Solo visibles para el equipo interno"
              comments={service.internalComments ?? []}
              variant="internal"
              initialText={service.internalNotes ?? ""}
              onTextChange={(text) => updateService(service.id, { internal_notes: text })}
            />
            <ServiceComments
              title="Notas para el colaborador"
              description="Visibles para el colaborador desde el backoffice"
              comments={service.managerComments ?? []}
              variant="manager"
              initialText={service.collaboratorNotes ?? ""}
              onTextChange={(text) => updateService(service.id, { collaborator_notes: text })}
            />
          </TabsContent>

          {/* Tab 4: ECONÓMICO */}
          <TabsContent value="financial" className="space-y-4 mt-3">
            {/* Budget section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" /> Presupuesto
              </h3>
              {service.serviceType === "Presupuesto" ? (
                linkedBudget ? (
                  <Card>
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          Presupuesto {linkedBudget.id}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(linkedBudget.createdAt).toLocaleDateString("es-ES")} · {linkedBudget.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate(`/presupuestos/${linkedBudget.id}`)}>
                          <Pencil className="w-3 h-3 mr-1" /> Editar
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setShowDeleteBudgetDialog(true)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-1.5 text-muted-foreground font-medium">Concepto</th>
                            <th className="text-center py-1.5 text-muted-foreground font-medium">Uds.</th>
                            <th className="text-right py-1.5 text-muted-foreground font-medium">Coste</th>
                            <th className="text-right py-1.5 text-muted-foreground font-medium">Margen</th>
                            <th className="text-right py-1.5 text-muted-foreground font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {linkedBudget.lines.map((line) => {
                            const salePrice = Math.round(line.costPrice * (1 + line.margin / 100) * 100) / 100;
                            const subtotal = Math.round(salePrice * line.units * 100) / 100;
                            const total = subtotal + Math.round(subtotal * (line.taxRate / 100) * 100) / 100;
                            return (
                              <tr key={line.id} className="border-b border-border last:border-0">
                                <td className="py-1.5 text-card-foreground">
                                  {line.concept}
                                  {line.description && <span className="block text-[10px] text-muted-foreground">{line.description}</span>}
                                </td>
                                <td className="py-1.5 text-center text-muted-foreground">{line.units}</td>
                                <td className="py-1.5 text-right text-muted-foreground">{line.costPrice.toFixed(2)} €</td>
                                <td className="py-1.5 text-right text-muted-foreground">{line.margin}%</td>
                                <td className="py-1.5 text-right font-medium text-card-foreground">{total.toFixed(2)} €</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-foreground/20">
                            <td colSpan={4} className="py-1.5 font-bold text-card-foreground text-right text-xs">Total:</td>
                            <td className="py-1.5 text-right font-bold text-card-foreground">
                              {service.budgetTotal ? `€${service.budgetTotal.toLocaleString()}` : "—"}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-6 text-center">
                      <FileText className="w-7 h-7 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">Sin presupuesto vinculado</p>
                      <p className="text-xs text-muted-foreground mt-1">Este servicio requiere presupuesto.</p>
                      <Button className="mt-3" size="sm" onClick={() => navigate(`/presupuestos/nuevo?serviceId=${service.id}`)}>
                        <FileText className="w-3.5 h-3.5 mr-1.5" /> Crear Presupuesto
                      </Button>
                    </CardContent>
                  </Card>
                )
              ) : (
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">Reparación directa — sin presupuesto requerido</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Economic summary */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Euro className="w-4 h-4 text-muted-foreground" /> Resumen económico
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-card rounded-lg border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Importe</p>
                  <p className="text-base font-bold text-card-foreground">
                    {service.budgetTotal ? `€${service.budgetTotal.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div className="bg-card rounded-lg border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Horas reales</p>
                  <p className="text-base font-bold text-card-foreground">
                    {service.realHours != null ? `${service.realHours}h` : "—"}
                  </p>
                </div>
                <div className="bg-card rounded-lg border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Coste/hora</p>
                  <p className="text-base font-bold text-card-foreground">
                    {service.budgetTotal && service.realHours
                      ? `€${(service.budgetTotal / service.realHours).toFixed(2)}`
                      : "—"}
                  </p>
                </div>
                {service.nps !== null && (
                  <div className="bg-card rounded-lg border border-border p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">NPS</p>
                    <p className={cn(
                      "text-base font-bold",
                      service.nps >= 9 ? "text-success" : service.nps >= 7 ? "text-warning" : "text-destructive"
                    )}>
                      {service.nps}/10
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Purchase orders */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-muted-foreground" /> Órdenes de compra
                {linkedOrders.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">{linkedOrders.length}</span>
                )}
              </h3>
              <ServicePurchases serviceId={service.id} />
            </div>

            {/* Sales orders */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-muted-foreground" /> Órdenes de venta
                {salesOrders.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">{salesOrders.length}</span>
                )}
              </h3>
              <ServiceSalesOrders serviceId={service.id} />
            </div>
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
        {/* Delete budget confirmation dialog */}
        <AlertDialog open={showDeleteBudgetDialog} onOpenChange={setShowDeleteBudgetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar presupuesto {linkedBudget?.id}?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminarán el presupuesto y todas sus líneas. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteBudget}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
