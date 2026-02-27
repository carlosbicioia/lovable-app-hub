import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Circle } from "lucide-react";

export interface ProtocolStep {
  id: string;
  label: string;
}

interface Props {
  steps: ProtocolStep[];
  checkedIds: Set<string>;
}

/** Compact protocol check dots with tooltips for table rows */
export default function ProtocolDots({ steps, checkedIds }: Props) {
  const completed = steps.filter((s) => checkedIds.has(s.id)).length;

  return (
    <div className="flex items-center gap-1">
      {steps.map((step) => {
        const done = checkedIds.has(step.id);
        return (
          <Tooltip key={step.id}>
            <TooltipTrigger asChild>
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              )}
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <span className={done ? "text-success" : ""}>
                {step.label}: {done ? "Completado" : "Pendiente"}
              </span>
            </TooltipContent>
          </Tooltip>
        );
      })}
      <span className="text-[10px] text-muted-foreground ml-1">
        {completed}/{steps.length}
      </span>
    </div>
  );
}
