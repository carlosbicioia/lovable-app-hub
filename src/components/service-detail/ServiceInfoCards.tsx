import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Wrench, Zap, Activity, CalendarClock, ClipboardList, ShieldAlert, AlertTriangle, ChevronRight, FileText, Pencil, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useOperators } from "@/hooks/useOperators";
import { useCollaborators } from "@/hooks/useCollaborators";
import type { Service } from "@/types/urbango";
import { useServices } from "@/hooks/useServices";
import { useCreateSalesOrder } from "@/hooks/useSalesOrders";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProtocolChecks } from "@/hooks/useProtocolChecks";
import { useEnabledProtocolSteps } from "@/hooks/useProtocolSteps";

interface Props {
  service: Service;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  Pte_Aceptacion: ["Pendiente_Contacto", "Pte_Asignacion"],
  Pendiente_Contacto: ["Pte_Asignacion", "Asignado", "Agendado"],
  Pte_Asignacion: ["Pendiente_Contacto", "Asignado", "Agendado"],
  Asignado: ["Pte_Asignacion", "Agendado"],
  Agendado: ["Asignado"],
  En_Curso: ["Agendado", "Finalizado"],
  Finalizado: ["En_Curso", "Liquidado"],
  Liquidado: [],
};

const CONFIRM_STATUSES = ["Finalizado", "Liquidado"];

const STATUS_PIPELINE = [
  { key: "Pte_Aceptacion", label: "Pte. Aceptación", short: "Pte.Ac" },
  { key: "Pendiente_Contacto", label: "Pte. Contacto", short: "Pte.C" },
  { key: "Pte_Asignacion", label: "Pte. Asignación", short: "Pte.A" },
  { key: "Asignado", label: "Asignado", short: "Asig." },
  { key: "Agendado", label: "Agendado", short: "Agend." },
  { key: "En_Curso", label: "En Curso", short: "Curso" },
  { key: "Finalizado", label: "Finalizado", short: "Final." },
  { key: "Liquidado", label: "Liquidado", short: "Liq." },
];

interface BudgetData {
  id: string;
  client_name: string;
  client_address: string;
  collaborator_name: string | null;
  lines: { concept: string; description: string | null; units: number; cost_price: number; margin: number; tax_rate: number; sort_order: number }[];
}

export default function ServiceInfoCards({ service }: Props) {
  const navigate = useNavigate();
  const { updateService } = useServices();
  const { data: operators = [] } = useOperators();
  const { collaborators } = useCollaborators();
  const createSalesOrder = useCreateSalesOrder();
  const { checkedItems: protocolChecked } = useProtocolChecks(service.id);
  const { data: protocolSteps = [] } = useEnabledProtocolSteps();
  const protocolTotal = protocolSteps.length;
  const protocolDone = protocolSteps.filter((s) => protocolChecked.has(s.stepId)).length;
  const protocolComplete = protocolTotal > 0 && protocolDone === protocolTotal;
  const [saving, setSaving] = useState<string | null>(null);
  const [showBudgetPrompt, setShowBudgetPrompt] = useState(false);
  const [hasBudget, setHasBudget] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  const [showFinalizadoPrompt, setShowFinalizadoPrompt] = useState(false);
  const [creatingSalesOrder, setCreatingSalesOrder] = useState(false);

  useEffect(() => {
    async function fetchBudget() {
      const { data: budgets } = await supabase
        .from("budgets")
        .select("id, client_name, client_address, collaborator_name")
        .eq("service_id", service.id)
        .limit(1);
      if (budgets && budgets.length > 0) {
        setHasBudget(true);
        const b = budgets[0];
        const { data: lines } = await supabase
          .from("budget_lines")
          .select("concept, description, units, cost_price, margin, tax_rate, sort_order")
          .eq("budget_id", b.id)
          .order("sort_order");
        setBudgetData({ ...b, lines: lines ?? [] });
      } else {
        setHasBudget(false);
        setBudgetData(null);
      }
    }
    fetchBudget();
  }, [service.id]);

  const handleUpdate = async (field: string, value: string | null) => {
    setSaving(field);
    const updates: Record<string, any> = { [field]: value };
    if (field === "operator_id") {
      const op = operators.find((o) => o.id === value);
      updates.operator_name = op?.name ?? null;
    }
    if (field === "collaborator_id") {
      const col = collaborators.find((c) => c.id === value);
      updates.collaborator_name = col?.companyName ?? null;
    }
    await updateService(service.id, updates);
    setSaving(null);
  };

  const handleStatusChange = (newStatus: string) => {
    const allowed = VALID_TRANSITIONS[service.status] || [];
    if (!allowed.includes(newStatus)) {
      toast.error(`No se puede cambiar de "${statusLabel(service.status)}" a "${statusLabel(newStatus)}".`);
      return;
    }
    // Block finalization if protocol is incomplete
    if (newStatus === "Finalizado" && protocolTotal > 0 && !protocolComplete) {
      toast.error(`No se puede finalizar: el protocolo de gestión está incompleto (${protocolDone}/${protocolTotal}).`);
      return;
    }
    // Special flow: En_Curso → Finalizado with budget
    if (newStatus === "Finalizado" && service.status === "En_Curso" && hasBudget && budgetData) {
      setShowFinalizadoPrompt(true);
      return;
    }
    if (CONFIRM_STATUSES.includes(newStatus)) {
      setPendingStatusChange(newStatus);
      return;
    }
    handleUpdate("status", newStatus);
  };

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      handleUpdate("status", pendingStatusChange);
      setPendingStatusChange(null);
    }
  };

  const handleCreateSalesOrderAndFinalize = async () => {
    if (!budgetData) return;
    setCreatingSalesOrder(true);
    try {
      // Check if sales order already exists for this service
      const { data: existing } = await supabase
        .from("sales_orders")
        .select("id")
        .eq("service_id", service.id)
        .limit(1);
      if (existing && existing.length > 0) {
        toast.error("Ya existe una orden de venta para este servicio.");
        setShowFinalizadoPrompt(false);
        setCreatingSalesOrder(false);
        return;
      }

      // Generate sales order ID
      const timestamp = Date.now().toString(36).toUpperCase();
      const salesOrderId = `OV-${service.id.replace("SRV-", "")}-${timestamp}`;

      // Calculate total from budget lines
      const total = budgetData.lines.reduce((sum, line) => {
        const salePrice = Math.round(line.cost_price * (1 + line.margin / 100) * 100) / 100;
        const subtotal = Math.round(salePrice * line.units * 100) / 100;
        return sum + subtotal + Math.round(subtotal * (line.tax_rate / 100) * 100) / 100;
      }, 0);

      await createSalesOrder.mutateAsync({
        id: salesOrderId,
        budgetId: budgetData.id,
        serviceId: service.id,
        clientName: budgetData.client_name,
        clientAddress: budgetData.client_address,
        collaboratorName: budgetData.collaborator_name,
        total: Math.round(total * 100) / 100,
        lines: budgetData.lines.map((l, i) => ({
          concept: l.concept,
          description: l.description,
          units: l.units,
          costPrice: l.cost_price,
          margin: l.margin,
          taxRate: l.tax_rate,
          sortOrder: i,
        })),
      });

      // Now finalize the service
      await handleUpdate("status", "Finalizado");
      toast.success(`Orden de venta ${salesOrderId} creada y servicio finalizado.`);
      setShowFinalizadoPrompt(false);
    } catch (err: any) {
      toast.error(err.message || "Error al crear la orden de venta");
    } finally {
      setCreatingSalesOrder(false);
    }
  };

  const handleModifyBudgetAndCancel = () => {
    setShowFinalizadoPrompt(false);
    if (budgetData) {
      navigate(`/presupuestos/${budgetData.id}/editar`);
    }
  };

  const [showSkipReasonPrompt, setShowSkipReasonPrompt] = useState(false);
  const [skipReason, setSkipReason] = useState("");

  const handleFinalizeWithoutSalesOrder = () => {
    setShowFinalizadoPrompt(false);
    setShowSkipReasonPrompt(true);
  };

  const handleConfirmSkipReason = async () => {
    if (!skipReason.trim()) {
      toast.error("Debes indicar un motivo");
      return;
    }
    setShowSkipReasonPrompt(false);
    await handleUpdate("status", "Finalizado");
    await updateService(service.id, { skip_sales_order_reason: skipReason.trim() } as any);
    setSkipReason("");
  };

  const statusLabel = (s: string) => STATUS_PIPELINE.find(p => p.key === s)?.label ?? s;

  const isLocked = service.status === "Liquidado" || service.status === "Finalizado";
  const currentIdx = STATUS_PIPELINE.findIndex(p => p.key === service.status);

  return (
    <div className="space-y-4">
      {/* Status Pipeline - visual stepper */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_PIPELINE.map((step, idx) => {
            const isPast = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isFuture = idx > currentIdx;
            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => {
                    if (!isLocked && step.key !== service.status) handleStatusChange(step.key);
                  }}
                  disabled={isLocked}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap",
                    isCurrent && "bg-primary text-primary-foreground shadow-md",
                    isPast && "bg-success/15 text-success",
                    isFuture && "bg-muted text-muted-foreground",
                    !isLocked && !isCurrent && "hover:bg-muted/80 cursor-pointer",
                    isLocked && "cursor-not-allowed opacity-60"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border",
                    isCurrent && "bg-primary-foreground text-primary border-primary-foreground/30",
                    isPast && "bg-success text-success-foreground border-success",
                    isFuture && "bg-muted border-border text-muted-foreground"
                  )}>
                    {isPast ? "✓" : idx + 1}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.short}</span>
                </button>
                {idx < STATUS_PIPELINE.length - 1 && (
                  <ChevronRight className={cn("w-3.5 h-3.5 mx-0.5 shrink-0", isPast ? "text-success" : "text-border")} />
                )}
              </div>
            );
          })}
        </div>
        {isLocked && (
          <p className="text-[10px] text-muted-foreground mt-2 text-center">🔒 Servicio {service.status === "Liquidado" ? "liquidado" : "finalizado"} — no se puede modificar</p>
        )}
      </div>

      {/* Info grid — compact horizontal layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Cita */}
        <div className="bg-card rounded-lg border border-border p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <CalendarClock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Cita</span>
          </div>
          {service.scheduledAt ? (() => {
            const start = new Date(service.scheduledAt);
            const end = service.scheduledEndAt ? new Date(service.scheduledEndAt) : null;
            return (
              <div>
                <span className={cn("inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold mb-0.5", "bg-success/15 text-success border border-success/30")}>
                  Citado
                </span>
                <p className="text-xs font-medium text-card-foreground">{format(start, "d MMM", { locale: es })}</p>
                <p className="text-[10px] text-muted-foreground">{format(start, "HH:mm")}{end ? ` – ${format(end, "HH:mm")}` : ""}</p>
              </div>
            );
          })() : (
            <span className={cn("inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold", "bg-warning/15 text-warning border border-warning/30")}>
              Sin cita
            </span>
          )}
        </div>

        {/* Especialidad */}
        <div className="bg-card rounded-lg border border-border p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Wrench className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Especialidad</span>
          </div>
          <Select value={service.specialty} onValueChange={(v) => handleUpdate("specialty", v)} disabled={saving === "specialty" || isLocked}>
            <SelectTrigger className="h-6 border-none shadow-none px-0 text-xs font-medium text-card-foreground bg-transparent focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="Fontanería/Agua">Fontanería / Agua</SelectItem>
              <SelectItem value="Electricidad/Luz">Electricidad / Luz</SelectItem>
              <SelectItem value="Clima">Clima</SelectItem>
              <SelectItem value="Carpintería_Metálica">Carpintería Metálica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Origen */}
        <div className="bg-card rounded-lg border border-border p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Origen</span>
          </div>
          <Select value={service.origin} onValueChange={(v) => handleUpdate("origin", v)} disabled={saving === "origin" || isLocked}>
            <SelectTrigger className="h-6 border-none shadow-none px-0 text-xs font-medium text-card-foreground bg-transparent focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="Directo">Directo</SelectItem>
              <SelectItem value="B2B">B2B</SelectItem>
              <SelectItem value="App">App</SelectItem>
              <SelectItem value="API_Externa">API Externa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo */}
        <div className="bg-card rounded-lg border border-border p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <ClipboardList className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Tipo</span>
          </div>
          <Select
            value={service.serviceType}
            onValueChange={(v) => {
              if (v === "Presupuesto" && !hasBudget) {
                handleUpdate("service_type", v);
                setShowBudgetPrompt(true);
              } else if (v === "Reparación_Directa" && hasBudget) {
                toast.error("No puedes cambiar a Reparación Directa mientras exista un presupuesto vinculado.");
              } else {
                handleUpdate("service_type", v);
              }
            }}
            disabled={saving === "service_type" || isLocked}
          >
            <SelectTrigger className="h-6 border-none shadow-none px-0 text-xs font-medium text-card-foreground bg-transparent focus:ring-0">
              <SelectValue>{service.serviceType === "Reparación_Directa" ? "Rep. Directa" : "Presupuesto"}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="Reparación_Directa">Reparación Directa</SelectItem>
              <SelectItem value="Presupuesto">Presupuesto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Urgencia */}
        <div className="bg-card rounded-lg border border-border p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Urgencia</span>
          </div>
          <Select value={service.urgency} onValueChange={(v) => handleUpdate("urgency", v)} disabled={saving === "urgency" || isLocked}>
            <SelectTrigger className="h-6 border-none shadow-none px-0 text-xs font-medium text-card-foreground bg-transparent focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="Estándar">Estándar</SelectItem>
              <SelectItem value="Urgente">Urgente</SelectItem>
              <SelectItem value="Emergencia">Emergencia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Siniestro */}
        <div className="bg-card rounded-lg border border-border p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Siniestro</span>
          </div>
          <Select value={service.claimStatus} onValueChange={(v) => handleUpdate("claim_status", v)} disabled={isLocked}>
            <SelectTrigger className="h-6 border-none shadow-none px-0 text-xs font-medium text-card-foreground bg-transparent focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="Abierto">Abierto</SelectItem>
              <SelectItem value="En_Valoración">En valoración</SelectItem>
              <SelectItem value="Aceptado">Aceptado</SelectItem>
              <SelectItem value="Rechazado">Rechazado</SelectItem>
              <SelectItem value="Cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budget prompt */}
      <AlertDialog open={showBudgetPrompt} onOpenChange={setShowBudgetPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Crear presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Has cambiado el tipo a "Requiere presupuesto". ¿Quieres crear el presupuesto ahora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Más tarde</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(`/presupuestos/nuevo?serviceId=${service.id}`)}>
              Crear presupuesto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finalizado prompt — create sales order or modify budget */}
      <AlertDialog open={showFinalizadoPrompt} onOpenChange={setShowFinalizadoPrompt}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Finalizar servicio {service.id}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  El servicio tiene un presupuesto vinculado (<strong>{budgetData?.id}</strong>).
                  ¿Qué deseas hacer antes de finalizar?
                </p>
                {budgetData && budgetData.lines.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-2.5 text-xs space-y-1">
                    <p className="font-medium text-card-foreground">Resumen del presupuesto:</p>
                    <p className="text-muted-foreground">{budgetData.lines.length} línea(s) · Total: €{
                      budgetData.lines.reduce((sum, l) => {
                        const sp = Math.round(l.cost_price * (1 + l.margin / 100) * 100) / 100;
                        const sub = Math.round(sp * l.units * 100) / 100;
                        return sum + sub + Math.round(sub * (l.tax_rate / 100) * 100) / 100;
                      }, 0).toFixed(2)
                    }</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="font-medium text-card-foreground">Protocolo:</span>
                      <span className={cn(
                        "font-semibold",
                        protocolComplete ? "text-success" : "text-warning"
                      )}>
                        {protocolDone}/{protocolTotal} {protocolComplete ? "✓ Completo" : "⚠ Pendiente"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              onClick={handleCreateSalesOrderAndFinalize}
              disabled={creatingSalesOrder}
              className="w-full justify-start gap-2"
            >
              <FileText className="w-4 h-4" />
              {creatingSalesOrder ? "Creando orden de venta..." : "Crear orden de venta y finalizar"}
            </Button>
            <Button
              variant="outline"
              onClick={handleModifyBudgetAndCancel}
              className="w-full justify-start gap-2"
            >
              <Pencil className="w-4 h-4" />
              Quiero modificar el presupuesto antes
            </Button>
            <Button
              variant="ghost"
              onClick={handleFinalizeWithoutSalesOrder}
              className="w-full justify-start gap-2 text-muted-foreground"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar sin crear orden de venta
            </Button>
          </div>
          <AlertDialogFooter className="mt-1">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status confirmation dialog (for Liquidado and Finalizado without budget) */}
      <AlertDialog open={!!pendingStatusChange} onOpenChange={(open) => { if (!open) setPendingStatusChange(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Confirmar cambio de estado
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Vas a cambiar el servicio <strong>{service.id}</strong> de{" "}
                  <strong>{statusLabel(service.status)}</strong> a{" "}
                  <strong>{statusLabel(pendingStatusChange ?? "")}</strong>.
                </p>
                {pendingStatusChange === "Liquidado" && (
                  <p className="text-destructive font-medium">
                    ⚠️ Esta acción es irreversible. Una vez liquidado, el servicio quedará bloqueado y no se podrá modificar.
                  </p>
                )}
                {pendingStatusChange === "Finalizado" && !hasBudget && service.serviceType === "Presupuesto" && (
                  <p className="text-warning font-medium">
                    ⚠️ Este servicio requiere presupuesto pero no tiene uno vinculado.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirmar cambio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Skip sales order reason dialog */}
      <AlertDialog open={showSkipReasonPrompt} onOpenChange={(open) => { if (!open) { setShowSkipReasonPrompt(false); setSkipReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Motivo de finalización sin orden de venta</AlertDialogTitle>
            <AlertDialogDescription>
              Indica por qué este servicio se finaliza sin generar una orden de venta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            placeholder="Ej: Servicio sin coste, garantía, trabajo interno..."
            rows={3}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSkipReason} disabled={!skipReason.trim()}>
              Finalizar servicio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
