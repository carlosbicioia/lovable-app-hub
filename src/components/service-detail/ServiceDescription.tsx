import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, AlertCircle, CalendarIcon, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

export default function ServiceDescription({ service, onUpdate }: Props) {
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = async (date: Date | undefined) => {
    if (!date || !onUpdate) return;
    const updates: Record<string, any> = {
      scheduled_at: date.toISOString(),
    };
    // Auto-transition to Agendado if currently pending
    if (service.status === "Pendiente_Contacto") {
      updates.status = "Agendado";
      updates.contacted_at = new Date().toISOString();
    }
    await onUpdate(updates);
    setScheduling(false);
  };

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
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-card-foreground">
                  {format(new Date(service.scheduledAt), "dd MMM yyyy · HH:mm", { locale: es })}
                </p>
                {onUpdate && (
                  <Popover open={scheduling} onOpenChange={setScheduling}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <CalendarPlus className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(service.scheduledAt)}
                        onSelect={handleSchedule}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            ) : (
              <Popover open={scheduling} onOpenChange={setScheduling}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                    <CalendarPlus className="w-3.5 h-3.5" /> Agendar cita
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    onSelect={handleSchedule}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
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
