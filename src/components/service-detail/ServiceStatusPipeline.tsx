import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Service, ServiceStatus } from "@/types/urbango";
import { useProtocolChecks } from "@/hooks/useProtocolChecks";

interface StatusStep {
  id: ServiceStatus;
  label: string;
  description: string;
  check: (service: Service, protocolChecks: Set<string>) => boolean;
}

const STATUS_STEPS: StatusStep[] = [
  {
    id: "Pte_Aceptacion",
    label: "Aceptación",
    description: "Servicio aceptado en el protocolo",
    check: (_s, checks) => checks.has("servicio_aceptado"),
  },
  {
    id: "Pendiente_Contacto",
    label: "Contacto",
    description: "Cumplimiento SLA de contacto",
    check: (_s, checks) => checks.has("contact"),
  },
  {
    id: "Pte_Asignacion",
    label: "Asignación",
    description: "Técnico asignado al servicio",
    check: (s) => !!s.operatorId || (s.operators && s.operators.length > 0),
  },
  {
    id: "Agendado",
    label: "Agendado",
    description: "Cita programada con el cliente",
    check: (s) => !!s.scheduledAt,
  },
  {
    id: "En_Curso",
    label: "En curso",
    description: "La cita ha comenzado",
    check: (s) => {
      if (!s.scheduledAt) return false;
      return new Date(s.scheduledAt) <= new Date();
    },
  },
  {
    id: "Finalizado",
    label: "Finalizado",
    description: "Servicio cerrado",
    check: (s) => s.status === "Finalizado" || s.status === "Liquidado",
  },
];

interface Props {
  service: Service;
}

export default function ServiceStatusPipeline({ service }: Props) {
  const { checkedItems, loading } = useProtocolChecks(service.id);

  if (loading) return null;

  // Find the index of the furthest completed step
  const stepResults = STATUS_STEPS.map((step) => step.check(service, checkedItems));

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          Estado del servicio
        </p>
        <StatusBadgeInline status={service.status} />
      </div>
      <div className="flex items-center gap-0.5 overflow-x-auto">
        {STATUS_STEPS.map((step, idx) => {
          const done = stepResults[idx];
          // Current = first not-done step (or last if all done)
          const isCurrent = !done && (idx === 0 || stepResults[idx - 1]);

          return (
            <div key={step.id} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap",
                      done
                        ? "bg-success/15 text-success"
                        : isCurrent
                          ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border shrink-0",
                        done
                          ? "bg-success text-success-foreground border-success"
                          : isCurrent
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted border-border text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                  <p className="font-medium">{step.label}</p>
                  <p className="text-muted-foreground mt-0.5">{step.description}</p>
                  <p className={cn("mt-0.5 font-semibold", done ? "text-success" : isCurrent ? "text-primary" : "text-warning")}>
                    {done ? "✓ Completado" : isCurrent ? "● En curso" : "Pendiente"}
                  </p>
                </TooltipContent>
              </Tooltip>
              {idx < STATUS_STEPS.length - 1 && (
                <ChevronRight
                  className={cn(
                    "w-3 h-3 mx-0.5 shrink-0",
                    done ? "text-success" : "text-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadgeInline({ status }: { status: string }) {
  const isFinalized = status === "Finalizado" || status === "Liquidado";
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
        isFinalized ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
