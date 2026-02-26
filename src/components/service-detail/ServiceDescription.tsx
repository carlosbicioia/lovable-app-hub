import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, CalendarIcon, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Service } from "@/types/urbango";

interface Props {
  service: Service;
  onUpdate?: (updates: Record<string, any>) => Promise<{ error: any } | void>;
}

const claimStatusLabels: Record<string, string> = {
  Abierto: "Abierto",
  En_Valoración: "En Valoración",
  Aceptado: "Aceptado",
  Rechazado: "Rechazado",
  Cerrado: "Cerrado",
};

export default function ServiceDescription({ service }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" /> Descripción del servicio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-card-foreground leading-relaxed">
          {service.description || "Sin descripción disponible."}
        </p>

        {/* Dates row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Fecha de creación</span>
            </div>
            <p className="text-sm font-medium text-card-foreground">
              {format(new Date(service.receivedAt), "dd MMM yyyy · HH:mm", { locale: es })}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarPlus className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Fecha de cita</span>
            </div>
            {service.scheduledAt ? (
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-card-foreground">
                  {format(new Date(service.scheduledAt), "dd MMM yyyy · HH:mm", { locale: es })}
                  {service.scheduledEndAt && (
                    <>
                      {" — "}
                      {format(new Date(service.scheduledAt), "dd MMM yyyy", { locale: es }) ===
                      format(new Date(service.scheduledEndAt), "dd MMM yyyy", { locale: es })
                        ? format(new Date(service.scheduledEndAt), "HH:mm", { locale: es })
                        : format(new Date(service.scheduledEndAt), "dd MMM yyyy · HH:mm", { locale: es })}
                    </>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground italic">Solo editable desde el calendario</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin agendar — programa desde el calendario</p>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Estado del siniestro</span>
            </div>
            <p className="text-sm font-medium text-card-foreground">
              {claimStatusLabels[service.claimStatus] ?? service.claimStatus}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Tipo de servicio</span>
            </div>
            <p className="text-sm font-medium text-card-foreground">
              {service.serviceType === "Presupuesto" ? "Con presupuesto" : "Reparación directa"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
