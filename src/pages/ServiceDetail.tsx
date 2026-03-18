import { useParams, useNavigate } from "react-router-dom";
import { useServices } from "@/hooks/useServices";
import { useBudgets } from "@/hooks/useBudgets";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, FileText, Pencil, Clock, Euro, Trash2, MoreVertical, Loader2, ShoppingCart, AlertTriangle as AlertTriangleIcon, ClipboardList, MessageSquare, Image, BarChart3, User, MapPin, Phone, Building2, Copy, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { differenceInHours, format } from "date-fns";

// Convert decimal hours to HH:MM string
function hoursToHHMM(h: number): string {
  const totalMinutes = Math.round(h * 60);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
import { es } from "date-fns/locale";
import ServiceInfoCards from "@/components/service-detail/ServiceInfoCards";
import ServiceDescription from "@/components/service-detail/ServiceDescription";
import ServiceTimeline from "@/components/service-detail/ServiceTimeline";
import ServiceMediaUpload from "@/components/service-detail/ServiceMediaUpload";
import ServiceComments from "@/components/service-detail/ServiceComments";
import ServiceSidebar from "@/components/service-detail/ServiceSidebar";
import ServiceProtocolChecklist from "@/components/service-detail/ServiceProtocolChecklist";
import ServicePurchases from "@/components/service-detail/ServicePurchases";
import ServiceSalesOrders from "@/components/service-detail/ServiceSalesOrders";
import { useSalesOrders } from "@/hooks/useSalesOrders";
import ServiceMaterials from "@/components/service-detail/ServiceMaterials";
import ServiceHistory from "@/components/service-detail/ServiceHistory";
import ServiceTimeRecords from "@/components/service-detail/ServiceTimeRecords";
import ProtocolBreadcrumb from "@/components/service-detail/ProtocolBreadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { ClaimStatus } from "@/types/urbango";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { logServiceAction } from "@/hooks/useServiceAuditLog";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { services, loading: servicesLoading, updateService } = useServices();
  const { budgets, refetch: refetchBudgets } = useBudgets();
  const { data: allPurchaseOrders = [] } = usePurchaseOrders(id);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteBudgetDialog, setShowDeleteBudgetDialog] = useState(false);
  const { data: salesOrders = [] } = useSalesOrders(id);

  // Real-time hours from time_records
  const { data: totalHours = 0 } = useQuery({
    queryKey: ["service_total_hours", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_records")
        .select("hours")
        .eq("service_id", id!);
      if (error) throw error;
      return (data ?? []).reduce((sum, r) => sum + Number(r.hours), 0);
    },
  });

  // Real-time materials count
  const { data: materialsCount = 0 } = useQuery({
    queryKey: ["service_materials_count", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_materials_used")
        .select("id")
        .eq("service_id", id!);
      if (error) throw error;
      return (data ?? []).length;
    },
  });

  const service = services.find((s) => s.id === id);
  const linkedBudget = budgets.find((b) => b.serviceId === id);
  const linkedOrders = allPurchaseOrders;
  const isFinalized = service?.status === "Finalizado" || service?.status === "Liquidado";

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
  const purchaseCount = linkedOrders.length;
  const salesCount = (linkedBudget ? 1 : 0) + salesOrders.length;

  const handleDeleteService = async () => {
    try {
      if (linkedBudget) {
        await supabase.from("budget_lines").delete().eq("budget_id", linkedBudget.id);
        await supabase.from("budgets").delete().eq("id", linkedBudget.id);
      }
      await supabase.from("service_media").delete().eq("service_id", service.id);
      const { error } = await supabase.from("services").delete().eq("id", service.id);
      if (error) throw error;
      await logServiceAction(service.id, "Servicio eliminado");
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
      await logServiceAction(service.id, "Presupuesto eliminado");
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
              {!isFinalized && (
                <DropdownMenuItem onClick={() => navigate(`/servicios/${service.id}/editar`)}>
                  <Pencil className="w-4 h-4 mr-2" /> Modificar servicio
                </DropdownMenuItem>
              )}
              {!isFinalized && service.serviceType === "Presupuesto" && !linkedBudget && (
                <DropdownMenuItem onClick={() => navigate(`/presupuestos/nuevo?serviceId=${service.id}`)}>
                  <FileText className="w-4 h-4 mr-2" /> Crear presupuesto
                </DropdownMenuItem>
              )}
              {linkedBudget && (
                <DropdownMenuItem onClick={() => navigate(`/presupuestos/${linkedBudget.id}`)}>
                  <FileText className="w-4 h-4 mr-2" /> Ver presupuesto
                </DropdownMenuItem>
              )}
              {!isFinalized && (
                <DropdownMenuItem onClick={() => navigate(`/compras/nueva?serviceId=${service.id}`)}>
                  <ShoppingCart className="w-4 h-4 mr-2" /> Nueva orden de compra
                </DropdownMenuItem>
              )}
              {!isFinalized && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar servicio
                  </DropdownMenuItem>
                </>
              )}
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
            <TabsTrigger value="purchases" className="text-xs gap-1 h-8">
              <ShoppingCart className="w-3 h-3" /> Compras
              {purchaseCount > 0 && (
                <span className="px-1 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold">{purchaseCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sales" className="text-xs gap-1 h-8">
              <Euro className="w-3 h-3" /> Ventas
              {salesCount > 0 && (
                <span className="px-1 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-bold">{salesCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="hours" className="text-xs gap-1 h-8">
              <Clock className="w-3 h-3" /> Horas
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1 h-8">
              <History className="w-3 h-3" /> Historial
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: RESUMEN */}
          <TabsContent value="overview" forceMount className="space-y-4 mt-3 data-[state=inactive]:hidden">
            {/* Protocol breadcrumb */}
            <ProtocolBreadcrumb serviceId={service.id} readOnly={isFinalized} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <ServiceDescription service={service} onUpdate={isFinalized ? undefined : (updates) => updateService(service.id, updates)} />

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
          <TabsContent value="operations" forceMount className="space-y-4 mt-3 data-[state=inactive]:hidden">
            <ServiceProtocolChecklist service={service} readOnly={isFinalized} />
            <ServiceTimeline service={service} />
            <ServiceMediaUpload serviceId={service.id} />
            <ServiceMaterials serviceId={service.id} readOnly={isFinalized} />
          </TabsContent>

          {/* Tab 3: NOTAS */}
          <TabsContent value="notes" forceMount className="space-y-4 mt-3 data-[state=inactive]:hidden">
            <ServiceComments
              serviceId={service.id}
              title="Comentarios internos"
              description="Solo visibles para el equipo interno"
              variant="internal"
              field="internal_notes"
              initialText={service.internalNotes ?? ""}
              onSave={isFinalized ? undefined : async (text) => { await updateService(service.id, { internal_notes: text }); }}
              readOnly={isFinalized}
            />
            <ServiceComments
              serviceId={service.id}
              title="Notas para el colaborador"
              description="Visibles para el colaborador desde el backoffice"
              variant="manager"
              field="collaborator_notes"
              initialText={service.collaboratorNotes ?? ""}
              onSave={isFinalized ? undefined : async (text) => { await updateService(service.id, { collaborator_notes: text }); }}
              readOnly={isFinalized}
            />
          </TabsContent>

          {/* Tab 4: COMPRAS */}
          <TabsContent value="purchases" forceMount className="space-y-4 mt-3 data-[state=inactive]:hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-muted-foreground" /> Órdenes de compra
                {purchaseCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">{purchaseCount}</span>
                )}
              </h3>
              {!isFinalized && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(`/compras/nueva?serviceId=${service.id}`)}>
                  <ShoppingCart className="w-3 h-3 mr-1" /> Nueva orden
                </Button>
              )}
            </div>
            <ServicePurchases serviceId={service.id} />
          </TabsContent>

          {/* Tab 5: VENTAS */}
          <TabsContent value="sales" forceMount className="space-y-4 mt-3 data-[state=inactive]:hidden">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Importe</p>
                  <p className="text-2xl font-bold text-foreground">
                    {linkedBudget && linkedBudget.lines.length > 0
                      ? `€${linkedBudget.lines.reduce((sum, l) => {
                          const salePrice = Math.round(l.costPrice * (1 + l.margin / 100) * 100) / 100;
                          const subtotal = Math.round(salePrice * l.units * 100) / 100;
                          return sum + subtotal + Math.round(subtotal * (l.taxRate / 100) * 100) / 100;
                        }, 0).toFixed(2)}`
                      : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Horas</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalHours > 0 ? `${totalHours.toFixed(1)}h` : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Materiales</p>
                  <p className="text-2xl font-bold text-foreground">
                    {materialsCount > 0 ? materialsCount : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Órdenes venta</p>
                  <p className="text-2xl font-bold text-foreground">{salesOrders.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Coste/hora</p>
                  <p className="text-2xl font-bold text-foreground">
                    {linkedBudget && linkedBudget.lines.length > 0 && totalHours > 0
                      ? (() => {
                          const total = linkedBudget.lines.reduce((sum, l) => {
                            const salePrice = Math.round(l.costPrice * (1 + l.margin / 100) * 100) / 100;
                            const subtotal = Math.round(salePrice * l.units * 100) / 100;
                            return sum + subtotal + Math.round(subtotal * (l.taxRate / 100) * 100) / 100;
                          }, 0);
                          return `€${(total / totalHours).toFixed(2)}`;
                        })()
                      : "—"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="presupuestos">
              <TabsList>
                <TabsTrigger value="presupuestos" className="gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Presupuestos
                  <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold ml-1">
                    {linkedBudget ? 1 : 0}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="ordenes" className="gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" /> Órdenes de venta
                  <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold ml-1">
                    {salesOrders.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="resumen" className="gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" /> Resumen económico
                </TabsTrigger>
              </TabsList>

              {/* Presupuestos sub-tab */}
              <TabsContent value="presupuestos">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" /> Presupuestos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {service.serviceType === "Presupuesto" ? (
                      linkedBudget ? (
                        <div className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-semibold text-foreground">{linkedBudget.id}</span>
                              <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                                linkedBudget.status === "Finalizado" ? "bg-success/15 text-success border-success/30" :
                                linkedBudget.status === "Aprobado" ? "bg-info/15 text-info border-info/30" :
                                linkedBudget.status === "Rechazado" ? "bg-destructive/15 text-destructive border-destructive/30" :
                                "bg-muted text-muted-foreground border-border"
                              )}>
                                {linkedBudget.status}
                              </span>
                            </div>
                            <span className="text-lg font-bold text-foreground">
                              {service.budgetTotal ? `€${service.budgetTotal.toLocaleString()}` : "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <span>{linkedBudget.clientName}</span>
                            <span>{new Date(linkedBudget.createdAt).toLocaleDateString("es-ES")}</span>
                          </div>
                          {linkedBudget.lines.length > 0 && (
                            <div className="bg-muted/30 rounded-md overflow-hidden mt-3">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left px-3 py-2 text-muted-foreground font-medium">Concepto</th>
                                    <th className="text-center px-3 py-2 text-muted-foreground font-medium">Uds.</th>
                                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Coste</th>
                                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Margen</th>
                                    <th className="text-right px-3 py-2 text-muted-foreground font-medium">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {linkedBudget.lines.map((line) => {
                                    const salePrice = Math.round(line.costPrice * (1 + line.margin / 100) * 100) / 100;
                                    const subtotal = Math.round(salePrice * line.units * 100) / 100;
                                    const total = subtotal + Math.round(subtotal * (line.taxRate / 100) * 100) / 100;
                                    return (
                                      <tr key={line.id} className="border-b border-border/50 last:border-0">
                                        <td className="px-3 py-1.5 text-foreground">
                                          {line.concept}
                                          {line.description && <span className="block text-[10px] text-muted-foreground">{line.description}</span>}
                                        </td>
                                        <td className="px-3 py-1.5 text-center text-muted-foreground">{line.units}</td>
                                        <td className="px-3 py-1.5 text-right text-muted-foreground">{line.costPrice.toFixed(2)} €</td>
                                        <td className="px-3 py-1.5 text-right text-muted-foreground">{line.margin}%</td>
                                        <td className="px-3 py-1.5 text-right font-medium text-foreground">{total.toFixed(2)} €</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <div className="flex gap-2 pt-3">
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate(`/presupuestos/${linkedBudget.id}`)}>
                              <Pencil className="w-3 h-3 mr-1" /> Editar
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setShowDeleteBudgetDialog(true)}>
                              <Trash2 className="w-3 h-3 mr-1" /> Eliminar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm font-medium text-foreground">Sin presupuesto vinculado</p>
                          <p className="text-xs text-muted-foreground mt-1">Este servicio requiere presupuesto.</p>
                          <Button className="mt-3" size="sm" onClick={() => navigate(`/presupuestos/nuevo?serviceId=${service.id}`)}>
                            <FileText className="w-3.5 h-3.5 mr-1.5" /> Crear Presupuesto
                          </Button>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-10">
                        <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium text-foreground">Reparación directa</p>
                        <p className="text-xs text-muted-foreground mt-1">Sin presupuesto requerido</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Órdenes de venta sub-tab */}
              <TabsContent value="ordenes">
                <ServiceSalesOrders serviceId={service.id} />
              </TabsContent>

              {/* Resumen económico sub-tab */}
              <TabsContent value="resumen">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" /> Resumen económico
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {/* Importe presupuestado */}
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Importe presupuestado</p>
                        <p className="text-2xl font-bold text-foreground">
                          {service.budgetTotal ? `€${service.budgetTotal.toLocaleString()}` : "—"}
                        </p>
                      </div>

                      {/* Total OV pendiente */}
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">OV Pendiente</p>
                        <p className="text-2xl font-bold text-warning">
                          €{salesOrders.filter(o => o.status === "Pendiente").reduce((s, o) => s + o.total, 0).toFixed(2)}
                        </p>
                      </div>

                      {/* Total OV liquidada */}
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">OV Liquidada</p>
                        <p className="text-2xl font-bold text-success">
                          €{salesOrders.filter(o => o.status === "Liquidada").reduce((s, o) => s + o.total, 0).toFixed(2)}
                        </p>
                      </div>

                      {/* Horas reales */}
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Horas reales</p>
                        <p className="text-2xl font-bold text-foreground">
                          {service.realHours != null ? `${service.realHours}h` : "—"}
                        </p>
                      </div>

                      {/* Coste/hora */}
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Coste / hora</p>
                        <p className="text-2xl font-bold text-foreground">
                          {service.budgetTotal && service.realHours
                            ? `€${(service.budgetTotal / service.realHours).toFixed(2)}`
                            : "—"}
                        </p>
                        {service.budgetTotal && service.realHours && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">Importe / horas reales</p>
                        )}
                      </div>

                      {/* NPS */}
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">NPS</p>
                        {service.nps !== null ? (
                          <p className={cn(
                            "text-2xl font-bold",
                            service.nps >= 9 ? "text-success" : service.nps >= 7 ? "text-warning" : "text-destructive"
                          )}>
                            {service.nps}/10
                          </p>
                        ) : (
                          <p className="text-2xl font-bold text-muted-foreground">—</p>
                        )}
                      </div>

                      {/* Estado presupuesto */}
                      <div className="rounded-lg border border-border p-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Estado presupuesto</p>
                        <p className="text-lg font-semibold text-foreground">
                          {linkedBudget ? linkedBudget.status : "Sin presupuesto"}
                        </p>
                      </div>

                      {/* Margen medio */}
                      {linkedBudget && linkedBudget.lines.length > 0 && (
                        <div className="rounded-lg border border-border p-4">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Margen medio</p>
                          <p className="text-2xl font-bold text-foreground">
                            {(linkedBudget.lines.reduce((s, l) => s + l.margin, 0) / linkedBudget.lines.length).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Tab 6: HORAS */}
          <TabsContent value="hours" forceMount className="space-y-4 mt-3 data-[state=inactive]:hidden">
            <ServiceTimeRecords serviceId={service.id} readOnly={isFinalized} />
          </TabsContent>

          {/* Tab 7: HISTORIAL */}
          <TabsContent value="history" forceMount className="space-y-4 mt-3 data-[state=inactive]:hidden">
            <ServiceHistory serviceId={service.id} />
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
