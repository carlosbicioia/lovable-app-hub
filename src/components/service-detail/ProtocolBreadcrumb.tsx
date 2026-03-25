import { cn } from "@/lib/utils";
import { useProtocolChecks } from "@/hooks/useProtocolChecks";
import { useEnabledProtocolSteps } from "@/hooks/useProtocolSteps";
import { Check, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import type { Service } from "@/types/urbango";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBudgets } from "@/hooks/useBudgets";

/** Step IDs that are auto-computed */
const AUTO_COMPUTED_STEPS = new Set(["diagnosis", "operator", "budget", "servicio_realizado"]);

interface Props {
  service: Service;
  readOnly?: boolean;
}

export default function ProtocolBreadcrumb({ service, readOnly }: Props) {
  const { checkedItems, toggleItem } = useProtocolChecks(service.id);
  const { data: steps = [], isLoading } = useEnabledProtocolSteps();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const noMediaAvailable = service.noMediaAvailable ?? false;
  const [mediaCount, setMediaCount] = useState<number | null>(null);
  const { budgets } = useBudgets();
  const serviceBudgets = budgets.filter(b => b.serviceId === service.id);
  const hasBudget = serviceBudgets.length > 0;
  const isPresupuestoType = service.serviceType === "Presupuesto";

  useEffect(() => {
    const fetchMediaCount = async () => {
      const { count } = await supabase
        .from("service_media")
        .select("id", { count: "exact", head: true })
        .eq("service_id", service.id);
      setMediaCount(count ?? 0);
    };
    fetchMediaCount();

    const channel = supabase
      .channel(`breadcrumb-media-${service.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_media", filter: `service_id=eq.${service.id}` },
        () => { fetchMediaCount(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [service.id]);

  if (isLoading || steps.length === 0) return null;

  const completed = steps.filter((s) => checkedItems.has(s.stepId)).length;
  const total = steps.length;
  const allDone = completed === total;

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Protocolo de gestión</p>
        <span className={cn(
          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
          allDone ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
        )}>
          {completed}/{total}
        </span>
      </div>
      <div className="flex items-center gap-0.5 overflow-x-auto">
        {steps.map((step, idx) => {
           const isAutoCompleted = step.stepId === "diagnosis" && mediaCount !== null && mediaCount > 0;
            // Budget step: if service type is "Presupuesto" and no budget exists, force not-done
            const isBudgetWithoutPresupuesto = step.stepId === "budget" && isPresupuestoType && !hasBudget;
            const done = isBudgetWithoutPresupuesto ? false : (isAutoCompleted || checkedItems.has(step.stepId));
          const isAuto = AUTO_COMPUTED_STEPS.has(step.stepId);
          const isDiagnosisWarning = step.stepId === "diagnosis" && !isAutoCompleted && noMediaAvailable;
          const isBudgetWarning = isBudgetWithoutPresupuesto && !done;
          // Gestor cannot toggle auto-computed steps, only admin can
          const canToggle = !readOnly && (!isAuto || isAdmin);

          return (
            <div key={step.stepId} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => canToggle && toggleItem(step.stepId)}
                    disabled={!canToggle}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap",
                      isDiagnosisWarning || isBudgetWarning
                        ? "bg-warning/15 text-warning"
                        : done
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground",
                      canToggle && "hover:opacity-80 cursor-pointer",
                      !canToggle && "cursor-default"
                    )}
                  >
                    <span className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border shrink-0",
                      isDiagnosisWarning
                        ? "bg-warning text-warning-foreground border-warning"
                        : done
                          ? "bg-success text-success-foreground border-success"
                          : "bg-muted border-border text-muted-foreground"
                    )}>
                      {done ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                  <p className="font-medium">{step.label}</p>
                  {step.description && <p className="text-muted-foreground mt-0.5">{step.description}</p>}
                  {isDiagnosisWarning ? (
                    <p className="mt-0.5 font-semibold text-warning">⚠ No es posible obtener multimedia</p>
                  ) : (
                    <p className={cn("mt-0.5 font-semibold", done ? "text-success" : "text-warning")}>
                      {done ? "✓ Completado" : "Pendiente"}
                    </p>
                  )}
                  {isAuto && !isAdmin && (
                    <p className="mt-0.5 text-muted-foreground">Este paso es automático</p>
                  )}
                </TooltipContent>
              </Tooltip>
              {idx < steps.length - 1 && (
                <ChevronRight className={cn(
                  "w-3 h-3 mx-0.5 shrink-0",
                  done ? "text-success" : "text-border"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
