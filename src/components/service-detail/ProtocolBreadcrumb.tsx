import { cn } from "@/lib/utils";
import { useProtocolChecks } from "@/hooks/useProtocolChecks";
import { useEnabledProtocolSteps } from "@/hooks/useProtocolSteps";
import { Check, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  serviceId: string;
  readOnly?: boolean;
}

export default function ProtocolBreadcrumb({ serviceId, readOnly }: Props) {
  const { checkedItems, toggleItem } = useProtocolChecks(serviceId);
  const { data: steps = [], isLoading } = useEnabledProtocolSteps();

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
          const done = checkedItems.has(step.stepId);
          return (
            <div key={step.stepId} className="flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !readOnly && toggleItem(step.stepId)}
                    disabled={readOnly}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap",
                      done
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground",
                      !readOnly && "hover:opacity-80 cursor-pointer",
                      readOnly && "cursor-default"
                    )}
                  >
                    <span className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border shrink-0",
                      done
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
                  <p className={cn("mt-0.5 font-semibold", done ? "text-success" : "text-warning")}>
                    {done ? "✓ Completado" : "Pendiente"}
                  </p>
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
