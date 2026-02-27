import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

export interface ProtocolStep {
  id: string;
  label: string;
}

interface Props {
  steps: ProtocolStep[];
  checkedIds: Set<string>;
  onToggle?: (stepId: string) => void;
}

/** Compact protocol checkboxes with tooltips for table rows */
export default function ProtocolDots({ steps, checkedIds, onToggle }: Props) {
  const completed = steps.filter((s) => checkedIds.has(s.id)).length;

  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step) => {
        const done = checkedIds.has(step.id);
        return (
          <Tooltip key={step.id}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex",
                  onToggle && "cursor-pointer"
                )}
                onClick={(e) => {
                  if (onToggle) {
                    e.stopPropagation();
                    onToggle(step.id);
                  }
                }}
              >
                <Checkbox
                  checked={done}
                  className={cn(
                    "h-4 w-4 transition-colors pointer-events-none",
                    done
                      ? "data-[state=checked]:bg-success data-[state=checked]:border-success"
                      : ""
                  )}
                  tabIndex={-1}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <span className={done ? "text-success" : ""}>
                {step.label}: {done ? "Completado" : "Pendiente"}
              </span>
            </TooltipContent>
          </Tooltip>
        );
      })}
      <span className="text-[10px] text-muted-foreground ml-0.5">
        {completed}/{steps.length}
      </span>
    </div>
  );
}
