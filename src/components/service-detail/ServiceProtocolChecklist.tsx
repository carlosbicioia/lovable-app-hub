import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";
import type { Service } from "@/types/urbango";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useProtocolChecks } from "@/hooks/useProtocolChecks";
import { useEnabledProtocolSteps } from "@/hooks/useProtocolSteps";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  service: Service;
  readOnly?: boolean;
}

export default function ServiceProtocolChecklist({ service, readOnly }: Props) {
  const { checkedItems, toggleItem, loading: checksLoading } = useProtocolChecks(service.id);
  const { data: steps, isLoading: stepsLoading } = useEnabledProtocolSteps();

  const loading = checksLoading || stepsLoading;

  const allItems = (steps ?? []).map((step) => ({
    id: step.stepId,
    label: step.label,
    description: step.description,
  }));

  const completed = allItems.filter((c) => checkedItems.has(c.id)).length;
  const total = allItems.length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-muted-foreground" /> Protocolo de Gestión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-muted-foreground" /> Protocolo de Gestión
          </CardTitle>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            completed === total ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
          )}>
            {completed}/{total} completados
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {allItems.map((check) => {
          const isDone = checkedItems.has(check.id);
          return (
            <div key={check.id} className="flex items-start gap-3 group">
              <div className="mt-0.5 shrink-0">
                <Checkbox
                  checked={isDone}
                  onCheckedChange={() => !readOnly && toggleItem(check.id)}
                  disabled={readOnly}
                  className={cn(
                    "transition-colors",
                    isDone ? "data-[state=checked]:bg-success data-[state=checked]:border-success" : ""
                  )}
                />
              </div>
              <div className={cn("flex-1 min-w-0", !readOnly && "cursor-pointer")} onClick={() => !readOnly && toggleItem(check.id)}>
                <p className={cn(
                  "text-sm font-medium transition-colors",
                  isDone ? "text-card-foreground" : "text-muted-foreground"
                )}>
                  {check.label}
                </p>
                {check.description && (
                  <p className="text-xs mt-0.5 text-muted-foreground">
                    {check.description}
                  </p>
                )}
              </div>
              <ClipboardCheck className={cn(
                "w-4 h-4 mt-0.5 shrink-0",
                isDone ? "text-success" : "text-muted-foreground"
              )} />
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground italic pt-2 border-t border-border">
          El gestor marca cada paso manualmente según el avance del servicio. Los cambios se guardan automáticamente.
        </p>
      </CardContent>
    </Card>
  );
}
