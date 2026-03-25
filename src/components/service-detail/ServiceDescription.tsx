import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { VoiceTextarea as Textarea } from "@/components/ui/voice-textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, AlertCircle, CalendarIcon, CalendarPlus, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Service } from "@/types/urbango";

interface Props {
  service: Service;
  onUpdate?: (updates: Record<string, any>) => Promise<{ error: any } | void>;
}

const statusLabels: Record<string, string> = {
  Pendiente_Contacto: "Pte. Contacto",
  Asignado: "Asignado",
  Agendado: "Agendado",
  En_Curso: "En Curso",
  Finalizado: "Finalizado",
  Liquidado: "Liquidado",
};

export default function ServiceDescription({ service, onUpdate }: Props) {
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(service.description || "");
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    service.scheduledAt ? new Date(service.scheduledAt) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    service.scheduledEndAt ? new Date(service.scheduledEndAt) : undefined
  );
  const [startTime, setStartTime] = useState(
    service.scheduledAt ? format(new Date(service.scheduledAt), "HH:mm") : "09:00"
  );
  const [endTime, setEndTime] = useState(
    service.scheduledEndAt ? format(new Date(service.scheduledEndAt), "HH:mm") : "10:00"
  );

  const handleSave = async () => {
    if (!startDate || !onUpdate) return;
    const [sh, sm] = startTime.split(":").map(Number);
    const scheduled = new Date(startDate);
    scheduled.setHours(sh, sm, 0, 0);

    const updates: Record<string, any> = {
      scheduled_at: scheduled.toISOString(),
    };

    if (endDate) {
      const [eh, em] = endTime.split(":").map(Number);
      const end = new Date(endDate);
      end.setHours(eh, em, 0, 0);
      updates.scheduled_end_at = end.toISOString();
    }

    if (service.status === "Pendiente_Contacto") {
      updates.status = "Agendado";
      updates.contacted_at = new Date().toISOString();
    }

    await onUpdate(updates);
    setEditing(false);
  };

  const formatRange = () => {
    if (!service.scheduledAt) return null;
    const start = format(new Date(service.scheduledAt), "dd MMM yyyy · HH:mm", { locale: es });
    if (!service.scheduledEndAt) return start;
    const sameDay =
      format(new Date(service.scheduledAt), "dd MMM yyyy", { locale: es }) ===
      format(new Date(service.scheduledEndAt), "dd MMM yyyy", { locale: es });
    const end = sameDay
      ? format(new Date(service.scheduledEndAt), "HH:mm", { locale: es })
      : format(new Date(service.scheduledEndAt), "dd MMM yyyy · HH:mm", { locale: es });
    return `${start} — ${end}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" /> Descripción del servicio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!editingDesc ? (
          <div className="flex items-start gap-2 group">
            <p className="text-sm text-card-foreground leading-relaxed flex-1">
              {service.description || "Sin descripción disponible."}
            </p>
            {onUpdate && (
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => { setDescDraft(service.description || ""); setEditingDesc(true); }}>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)} className="text-sm min-h-[80px]" />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={async () => { if (onUpdate) { await onUpdate({ description: descDraft }); setEditingDesc(false); } }}>Guardar</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingDesc(false)}>Cancelar</Button>
            </div>
          </div>
        )}

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

            {!editing ? (
              <div className="flex items-center gap-2">
                {service.scheduledAt ? (
                  <p className="text-sm font-medium text-card-foreground">{formatRange()}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Sin agendar</p>
                )}
                {onUpdate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 rounded-md border border-border p-3 bg-muted/30">
                {/* Start */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Inicio</Label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5 flex-1 justify-start", !startDate && "text-muted-foreground")}>
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {startDate ? format(startDate, "dd MMM yyyy", { locale: es }) : "Seleccionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={es} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-8 w-24 text-xs" />
                  </div>
                </div>
                {/* End */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fin</Label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5 flex-1 justify-start", !endDate && "text-muted-foreground")}>
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {endDate ? format(endDate, "dd MMM yyyy", { locale: es }) : "Seleccionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={es} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8 w-24 text-xs" />
                  </div>
                </div>
                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={!startDate}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Estado del servicio</span>
            </div>
            <p className="text-sm font-medium text-card-foreground">
              {statusLabels[service.status] ?? service.status}
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
