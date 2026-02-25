import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Circle, Camera, Phone, UserCheck, ClipboardCheck, Star, Receipt } from "lucide-react";
import type { Service } from "@/types/urbango";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  service: Service;
}

interface CheckItem {
  id: string;
  label: string;
  detail?: string;
  icon: React.ElementType;
  warning?: boolean;
}

export default function ServiceProtocolChecklist({ service }: Props) {
  const isFinalized = service.status === "Finalizado" || service.status === "Liquidado";

  const allItems: CheckItem[] = [
    {
      id: "contact",
      icon: Phone,
      label: "Contacto con cliente (SLA 12h)",
      detail: service.contactedAt ? "Contactado" : "Pendiente",
    },
    {
      id: "diagnosis",
      icon: Camera,
      label: "Diagnóstico multimedia",
      detail: (service.media?.length ?? 0) > 0 ? `${service.media!.length} archivo(s) recibido(s)` : "Sin material multimedia",
    },
    {
      id: "operator",
      icon: UserCheck,
      label: "Técnico asignado (por cluster y especialidad)",
      detail: service.operatorName ? `${service.operatorName} · Cluster ${service.clusterId}` : "Sin asignar",
    },
    {
      id: "materials",
      icon: ClipboardCheck,
      label: "Material preparado",
      detail: (service.materials?.length ?? 0) > 0 ? `${service.materials!.length} artículo(s)` : "Sin materiales registrados",
    },
  ];

  if (service.serviceType === "Presupuesto") {
    allItems.push({
      id: "budget",
      icon: Receipt,
      label: "Presupuesto gestionado",
      detail: service.budgetStatus ?? "Sin presupuesto",
    });
  }

  if (isFinalized) {
    allItems.push({
      id: "nps",
      icon: Star,
      label: "NPS recogido",
      warning: service.nps !== null && service.nps < 7,
      detail: service.nps !== null
        ? `${service.nps}/10${service.nps < 7 ? " — Requiere revisión del gestor antes del cierre" : ""}`
        : "Pendiente de encuesta",
    });
  }

  // Manager-controlled check state (local for now — will persist to DB)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    // Pre-check items that are obviously done
    const initial = new Set<string>();
    if (service.contactedAt) initial.add("contact");
    if (service.diagnosisComplete) initial.add("diagnosis");
    if (service.operatorId) initial.add("operator");
    if ((service.materials?.length ?? 0) > 0 || service.serviceType === "Reparación_Directa") initial.add("materials");
    if (service.budgetStatus === "Aprobado" || service.budgetStatus === "Enviado") initial.add("budget");
    if (service.nps !== null) initial.add("nps");
    return initial;
  });

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completed = allItems.filter((c) => checkedItems.has(c.id) && !c.warning).length;
  const total = allItems.length;

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
                  onCheckedChange={() => toggleItem(check.id)}
                  className={cn(
                    "transition-colors",
                    isDone && !check.warning ? "data-[state=checked]:bg-success data-[state=checked]:border-success" :
                    check.warning ? "data-[state=checked]:bg-warning data-[state=checked]:border-warning" : ""
                  )}
                />
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleItem(check.id)}>
                <p className={cn(
                  "text-sm font-medium transition-colors",
                  isDone && !check.warning ? "text-card-foreground" : "text-muted-foreground"
                )}>
                  {check.label}
                </p>
                {check.detail && (
                  <p className={cn(
                    "text-xs mt-0.5",
                    check.warning ? "text-warning" : "text-muted-foreground"
                  )}>
                    {check.detail}
                  </p>
                )}
              </div>
              <check.icon className={cn(
                "w-4 h-4 mt-0.5 shrink-0",
                isDone && !check.warning ? "text-success" :
                check.warning ? "text-warning" : "text-muted-foreground"
              )} />
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground italic pt-2 border-t border-border">
          El gestor marca cada paso manualmente según el avance del servicio. Los puntos del protocolo se configuran en Ajustes.
        </p>
      </CardContent>
    </Card>
  );
}
