import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Lock, AlertTriangle } from "lucide-react";
import type { Service } from "@/types/urbango";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useProtocolChecks } from "@/hooks/useProtocolChecks";
import { useEnabledProtocolSteps } from "@/hooks/useProtocolSteps";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  service: Service;
  readOnly?: boolean;
}

/** Step IDs that are auto-computed and cannot be toggled manually */
const AUTO_COMPUTED_STEPS = new Set(["diagnosis"]);

export default function ServiceProtocolChecklist({ service, readOnly }: Props) {
  const { checkedItems, toggleItem, loading: checksLoading } = useProtocolChecks(service.id);
  const { data: steps, isLoading: stepsLoading } = useEnabledProtocolSteps();
  const { updateService } = useServices();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [mediaCount, setMediaCount] = useState<number | null>(null);

  const noMediaAvailable = service.noMediaAvailable ?? false;

  // Fetch media count for auto-computing diagnosis step
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
      .channel(`protocol-media-${service.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_media", filter: `service_id=eq.${service.id}` },
        () => { fetchMediaCount(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [service.id]);

  // Auto-sync diagnosis check based on media count OR noMediaAvailable flag
  useEffect(() => {
    if (mediaCount === null || checksLoading) return;
    const shouldBeChecked = mediaCount > 0 || noMediaAvailable;
    const isDiagnosisChecked = checkedItems.has("diagnosis");
    if (shouldBeChecked && !isDiagnosisChecked) {
      toggleItem("diagnosis");
    } else if (!shouldBeChecked && isDiagnosisChecked) {
      toggleItem("diagnosis");
    }
  }, [mediaCount, noMediaAvailable, checksLoading]);

  const handleToggleNoMedia = async () => {
    if (readOnly || !isAdmin) return;
    await updateService(service.id, { no_media_available: !noMediaAvailable });
  };

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
          const isAutoComputed = AUTO_COMPUTED_STEPS.has(check.id);
          const canToggle = !readOnly && !isAutoComputed;
          const isDiagnosisWithNoMedia = check.id === "diagnosis" && noMediaAvailable && mediaCount === 0;

          return (
            <div key={check.id}>
              <div className="flex items-start gap-3 group">
                <div className="mt-0.5 shrink-0">
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={() => canToggle && toggleItem(check.id)}
                    disabled={readOnly || isAutoComputed}
                    className={cn(
                      "transition-colors",
                      isDiagnosisWithNoMedia
                        ? "data-[state=checked]:bg-warning data-[state=checked]:border-warning"
                        : isDone
                          ? "data-[state=checked]:bg-success data-[state=checked]:border-success"
                          : ""
                    )}
                  />
                </div>
                <div className={cn("flex-1 min-w-0", canToggle && "cursor-pointer")} onClick={() => canToggle && toggleItem(check.id)}>
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    isDiagnosisWithNoMedia
                      ? "text-warning"
                      : isDone ? "text-card-foreground" : "text-muted-foreground"
                  )}>
                    {check.label}
                    {isAutoComputed && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Lock className="w-3 h-3 inline ml-1.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>Se marca automáticamente al subir archivos multimedia</TooltipContent>
                      </Tooltip>
                    )}
                  </p>
                  {check.description && (
                    <p className="text-xs mt-0.5 text-muted-foreground">
                      {check.description}
                    </p>
                  )}
                </div>
                {isDiagnosisWithNoMedia ? (
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
                ) : (
                  <ClipboardCheck className={cn(
                    "w-4 h-4 mt-0.5 shrink-0",
                    isDone ? "text-success" : "text-muted-foreground"
                  )} />
                )}
              </div>

              {/* No media available checkbox under diagnosis step */}
              {check.id === "diagnosis" && (
                <div
                  className={cn(
                    "ml-7 mt-1.5 flex items-center gap-2",
                    !readOnly && isAdmin ? "cursor-pointer" : "opacity-60 cursor-default"
                  )}
                  onClick={handleToggleNoMedia}
                >
                  <Checkbox
                    checked={noMediaAvailable}
                    onCheckedChange={handleToggleNoMedia}
                    disabled={readOnly || !isAdmin}
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      noMediaAvailable ? "data-[state=checked]:bg-warning data-[state=checked]:border-warning" : ""
                    )}
                  />
                  <span className={cn(
                    "text-xs",
                    noMediaAvailable ? "text-warning font-medium" : "text-muted-foreground"
                  )}>
                    No es posible obtener archivos multimedia
                  </span>
                </div>
              )}
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
