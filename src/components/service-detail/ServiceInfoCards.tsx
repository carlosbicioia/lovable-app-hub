import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Wrench, Zap, Activity, CalendarClock, ClipboardList, ShieldAlert, AlertTriangle, ChevronRight } from "lucide-react";
import { useOperators } from "@/hooks/useOperators";
import { useCollaborators } from "@/hooks/useCollaborators";
import type { Service } from "@/types/urbango";
import { useServices } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  service: Service;
}

// Define valid forward transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  Pendiente_Contacto: ["Pte_Asignacion", "Asignado", "Agendado", "En_Curso"],
  Pte_Asignacion: ["Pendiente_Contacto", "Asignado", "Agendado", "En_Curso"],
  Asignado: ["Pte_Asignacion", "Agendado", "En_Curso"],
  Agendado: ["Asignado", "En_Curso", "Finalizado"],
  En_Curso: ["Agendado", "Finalizado"],
  Finalizado: ["En_Curso", "Liquidado"],
  Liquidado: [],
};

const CONFIRM_STATUSES = ["Finalizado", "Liquidado"];

const STATUS_PIPELINE = [
  { key: "Pendiente_Contacto", label: "Pte. Contacto", short: "Pte.C" },
  { key: "Pte_Asignacion", label: "Pte. Asignación", short: "Pte.A" },
  { key: "Asignado", label: "Asignado", short: "Asig." },
  { key: "Agendado", label: "Agendado", short: "Agend." },
  { key: "En_Curso", label: "En Curso", short: "Curso" },
  { key: "Finalizado", label: "Finalizado", short: "Final." },
  { key: "Liquidado", label: "Liquidado", short: "Liq." },
];

export default function ServiceInfoCards({ service }: Props) {
  const navigate = useNavigate();
  const { updateService } = useServices();
  const { data: operators = [] } = useOperators();
  const { collaborators } = useCollaborators();
  const [saving, setSaving] = useState<string | null>(null);
  const [showBudgetPrompt, setShowBudgetPrompt] = useState(false);
  const [hasBudget, setHasBudget] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("budgets").select("id").eq("service_id", service.id).limit(1)
      .then(({ data }) => setHasBudget((data?.length ?? 0) > 0));
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

  const statusLabel = (s: string) => STATUS_PIPELINE.find(p => p.key === s)?.label ?? s;

  const isLocked = service.status === "Liquidado";
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
          <p className="text-[10px] text-muted-foreground mt-2 text-center">🔒 Servicio liquidado — no se puede modificar</p>
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

      {/* Status confirmation dialog */}
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
    </div>
  );
}
