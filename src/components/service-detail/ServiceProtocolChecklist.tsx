import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle, Camera, Phone, UserCheck, ClipboardCheck, Star, Receipt } from "lucide-react";
import type { Service } from "@/types/urbango";
import { differenceInHours } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  service: Service;
}

interface CheckItem {
  label: string;
  done: boolean;
  warning?: boolean;
  detail?: string;
  icon: React.ElementType;
}

export default function ServiceProtocolChecklist({ service }: Props) {
  const hoursSinceReceived = differenceInHours(new Date(), new Date(service.receivedAt));
  const contactSlaOk = !!service.contactedAt;
  const contactSlaExpired = !contactSlaOk && hoursSinceReceived >= 12;
  const contactSlaWarning = !contactSlaOk && hoursSinceReceived >= 8 && hoursSinceReceived < 12;

  const hasMedia = (service.media?.length ?? 0) > 0;
  const hasOperator = !!service.operatorId;
  const hasBudget = service.serviceType === "Presupuesto" ? !!service.budgetStatus : true;
  const npsCollected = service.nps !== null;
  const npsOk = service.nps !== null && service.nps >= 7;
  const isFinalized = service.status === "Finalizado" || service.status === "Liquidado";
  const materialsReady = (service.materials?.length ?? 0) > 0 || service.serviceType === "Reparación_Directa";

  const checks: CheckItem[] = [
    {
      icon: Phone,
      label: "Contacto con cliente (SLA 12h)",
      done: contactSlaOk,
      warning: contactSlaWarning,
      detail: contactSlaExpired ? "⏰ SLA vencido" : contactSlaWarning ? "⚠ Próximo a vencer" : contactSlaOk ? "Contactado" : "Pendiente",
    },
    {
      icon: Camera,
      label: "Diagnóstico multimedia",
      done: service.diagnosisComplete,
      detail: hasMedia ? `${service.media!.length} archivo(s) recibido(s)` : "Sin material multimedia",
    },
    {
      icon: UserCheck,
      label: "Técnico asignado (por cluster y especialidad)",
      done: hasOperator,
      detail: hasOperator ? `${service.operatorName} · Cluster ${service.clusterId}` : "Sin asignar",
    },
    {
      icon: ClipboardCheck,
      label: "Material preparado",
      done: materialsReady,
      detail: (service.materials?.length ?? 0) > 0 ? `${service.materials!.length} artículo(s)` : "Sin materiales registrados",
    },
  ];

  if (service.serviceType === "Presupuesto") {
    checks.push({
      icon: Receipt,
      label: "Presupuesto gestionado",
      done: service.budgetStatus === "Aprobado" || service.budgetStatus === "Enviado",
      detail: service.budgetStatus ?? "Sin presupuesto",
    });
  }

  if (isFinalized) {
    checks.push({
      icon: Star,
      label: "NPS recogido",
      done: npsCollected,
      warning: npsCollected && !npsOk,
      detail: npsCollected
        ? `${service.nps}/10${!npsOk ? " — Requiere revisión del gestor antes del cierre" : ""}`
        : "Pendiente de encuesta",
    });
  }

  const completed = checks.filter((c) => c.done && !c.warning).length;
  const total = checks.length;

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
        {checks.map((check, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={cn(
              "mt-0.5 shrink-0",
              check.done && !check.warning ? "text-success" :
              check.warning ? "text-warning" : "text-muted-foreground"
            )}>
              {check.done && !check.warning ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : check.warning ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium",
                check.done && !check.warning ? "text-card-foreground" : "text-muted-foreground"
              )}>
                {check.label}
              </p>
              {check.detail && (
                <p className={cn(
                  "text-xs mt-0.5",
                  check.warning ? "text-warning" :
                  check.done ? "text-muted-foreground" : "text-muted-foreground"
                )}>
                  {check.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
