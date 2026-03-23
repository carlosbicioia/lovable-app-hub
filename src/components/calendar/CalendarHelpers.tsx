import { useState, useEffect, DragEvent } from "react";
import { format, getHours, getMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import type { Service } from "@/types/urbango";
import { type CalendarService, specialtyIcon, statusLabels, getOperatorColor } from "./calendarUtils";

export function handleDragStart(e: DragEvent, service: Service) {
  e.dataTransfer.setData("text/plain", service.id);
  e.dataTransfer.effectAllowed = "move";
}

export function DroppableCell({
  date, children, className, onDropService, style,
}: {
  date: Date; children: React.ReactNode; className?: string;
  onDropService: (serviceId: string, targetDate: Date) => void; style?: React.CSSProperties;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={cn(className, over && "ring-2 ring-primary/50 bg-primary/5")}
      style={style}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const id = e.dataTransfer.getData("text/plain"); if (id) onDropService(id, date); }}
    >
      {children}
    </div>
  );
}

export function ServiceChip({ service, showTime = false, spanHeight }: { service: CalendarService; showTime?: boolean; spanHeight?: number }) {
  const router = useRouter();
  const colors = getOperatorColor(service._displayOperatorId ?? service.operatorId);
  const timeStr = service.scheduledAt
    ? format(new Date(service.scheduledAt), "HH:mm") + (service.scheduledEndAt ? "–" + format(new Date(service.scheduledEndAt), "HH:mm") : "")
    : "";
  const isSpanning = spanHeight !== undefined && spanHeight > 30;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          draggable
          onDragStart={(e) => handleDragStart(e as any, service)}
          onClick={() => router.push(`/servicios/${service.id}`)}
          className={cn(
            "w-full text-left px-2 py-1 rounded-md text-xs font-medium border transition-colors hover:ring-1 hover:ring-ring cursor-grab active:cursor-grabbing",
            isSpanning ? "h-full flex flex-col overflow-hidden" : "truncate"
          )}
          style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
        >
          <span className="flex items-center gap-1">
            {specialtyIcon[service.specialty]}
            <span className="truncate">{showTime && timeStr ? `${timeStr} ` : ""}{service.id} · {service._displayOperatorName ?? service.operatorName ?? "Sin asignar"}</span>
          </span>
          {isSpanning && (
            <>
              <span className="truncate text-[10px] opacity-80 mt-0.5">{service.clientName} · {service.specialty}</span>
              {service.address && (
                <span className="truncate text-[10px] opacity-60 flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />{service.address}
                </span>
              )}
            </>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold">{service.id} – {service.clientName}</p>
          <p className="text-xs"><span className="text-muted-foreground">Tipo:</span> {service.serviceType === "Presupuesto" ? "Con presupuesto" : "Reparación directa"}</p>
          <p className="text-xs"><span className="text-muted-foreground">Especialidad:</span> {service.specialty}</p>
          <p className="text-xs"><span className="text-muted-foreground">Operarios:</span> {service.operators.length > 0 ? service.operators.map(o => o.name).join(", ") : service.operatorName ?? "Sin asignar"}</p>
          <p className="text-xs"><span className="text-muted-foreground">Colaborador:</span> {service.collaboratorName ?? "Sin colaborador"}</p>
          {service.address && <p className="text-xs"><span className="text-muted-foreground">Dirección:</span> {service.address}</p>}
          <p className="text-xs"><span className="text-muted-foreground">Estado:</span> {statusLabels[service.status] ?? service.status}</p>
          {timeStr && <p className="text-xs"><span className="text-muted-foreground">Horario:</span> {timeStr}</p>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function CurrentTimeLine({ hour, colStart, colSpan }: { hour: number; colStart: number; colSpan: number }) {
  const now = useCurrentTime();
  if (getHours(now) !== hour) return null;
  const topPercent = (getMinutes(now) / 60) * 100;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${topPercent}%`, gridColumn: `${colStart} / span ${colSpan}` }}>
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-destructive shrink-0 -ml-1" />
        <div className="flex-1 h-[2px] bg-destructive" />
      </div>
    </div>
  );
}
