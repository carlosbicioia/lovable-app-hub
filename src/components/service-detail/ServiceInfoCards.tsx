import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Wrench, Zap, User, Activity, CalendarClock } from "lucide-react";
import { mockCollaborators, mockOperators } from "@/data/mockData";
import type { Service, ServiceOrigin, Specialty, ServiceStatus } from "@/types/urbango";
import { useServices } from "@/hooks/useServices";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  service: Service;
}

export default function ServiceInfoCards({ service }: Props) {
  const { updateService } = useServices();
  const [saving, setSaving] = useState<string | null>(null);

  const handleUpdate = async (field: string, value: string | null) => {
    setSaving(field);
    const updates: Record<string, any> = { [field]: value };

    // Sync related name fields
    if (field === "operator_id") {
      const op = mockOperators.find((o) => o.id === value);
      updates.operator_name = op?.name ?? null;
    }
    if (field === "collaborator_id") {
      const col = mockCollaborators.find((c) => c.id === value);
      updates.collaborator_name = col?.companyName ?? null;
    }

    await updateService(service.id, updates);
    setSaving(null);
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      Pendiente_Contacto: "Pte. Contacto",
      Agendado: "Agendado",
      En_Curso: "En Curso",
      Finalizado: "Finalizado",
      Liquidado: "Liquidado",
    };
    return map[s] ?? s;
  };

  const availableOperators = mockOperators.filter(
    (o) => o.status === "Activo" && o.available
  );
  // Include current operator
  const currentOp = service.operatorId ? mockOperators.find((o) => o.id === service.operatorId) : null;
  const operatorOptions = currentOp && !availableOperators.find((o) => o.id === currentOp.id)
    ? [currentOp, ...availableOperators]
    : availableOperators;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Cita */}
      <Card className="bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Cita</span>
          </div>
          {service.scheduledAt ? (() => {
            const start = new Date(service.scheduledAt);
            const end = service.scheduledEndAt ? new Date(service.scheduledEndAt) : null;
            const isMultiDay = end && !isSameDay(start, end);
            return (
              <div>
                <span className={cn(
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold mb-1",
                  "bg-success/15 text-success border border-success/30"
                )}>
                  Citado
                </span>
                <p className="text-sm font-medium text-card-foreground">
                  {format(start, "d MMM yyyy", { locale: es })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(start, "HH:mm")}
                  {end ? ` – ${format(end, "HH:mm")}` : ""}
                </p>
                {isMultiDay && (
                  <p className="text-xs text-muted-foreground">
                    hasta {format(end, "d MMM", { locale: es })}
                  </p>
                )}
              </div>
            );
          })() : (
            <div>
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold",
                "bg-warning/15 text-warning border border-warning/30"
              )}>
                Pendiente de citar
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Especialidad */}
      <Card className="bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Especialidad</span>
          </div>
          <Select
            value={service.specialty}
            onValueChange={(v) => handleUpdate("specialty", v)}
            disabled={saving === "specialty"}
          >
            <SelectTrigger className="h-7 border-none shadow-none px-0 text-sm font-medium text-card-foreground bg-transparent focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="Fontanería/Agua">Fontanería / Agua</SelectItem>
              <SelectItem value="Electricidad/Luz">Electricidad / Luz</SelectItem>
              <SelectItem value="Clima">Clima</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Origen */}
      <Card className="bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Origen</span>
          </div>
          <Select
            value={service.origin}
            onValueChange={(v) => handleUpdate("origin", v)}
            disabled={saving === "origin"}
          >
            <SelectTrigger className="h-7 border-none shadow-none px-0 text-sm font-medium text-card-foreground bg-transparent focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="Directo">Directo</SelectItem>
              <SelectItem value="B2B">B2B</SelectItem>
              <SelectItem value="App">App</SelectItem>
              <SelectItem value="API_Externa">API Externa</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Técnico */}
      <Card className="bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Técnico</span>
          </div>
          <Select
            value={service.operatorId ?? "none"}
            onValueChange={(v) => handleUpdate("operator_id", v === "none" ? null : v)}
            disabled={saving === "operator_id"}
          >
            <SelectTrigger className="h-7 border-none shadow-none px-0 text-sm font-medium text-card-foreground bg-transparent focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="none">Sin asignar</SelectItem>
              {operatorOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Colaborador */}
      <Card className="bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Colaborador</span>
          </div>
          <Select
            value={service.collaboratorId ?? "none"}
            onValueChange={(v) => handleUpdate("collaborator_id", v === "none" ? null : v)}
            disabled={saving === "collaborator_id"}
          >
            <SelectTrigger className="h-7 border-none shadow-none px-0 text-sm font-medium text-card-foreground bg-transparent focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="none">Sin colaborador</SelectItem>
              {mockCollaborators.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Estado */}
      <Card className="bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Estado</span>
          </div>
          <Select
            value={service.status}
            onValueChange={(v) => handleUpdate("status", v)}
            disabled={saving === "status"}
          >
            <SelectTrigger className="h-7 border-none shadow-none px-0 text-sm font-medium text-card-foreground bg-transparent focus:ring-0">
              <SelectValue>{statusLabel(service.status)}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="Pendiente_Contacto">Pte. Contacto</SelectItem>
              <SelectItem value="Agendado">Agendado</SelectItem>
              <SelectItem value="En_Curso">En Curso</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
              <SelectItem value="Liquidado">Liquidado</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
