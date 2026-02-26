import { useState, useEffect, useMemo, useCallback, useRef, DragEvent } from "react";
import { mockOperators } from "@/data/mockData";
import { useServices } from "@/hooks/useServices";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  getHours,
  getMinutes,
  differenceInCalendarDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  User,
  Droplets,
  Zap,
  Wind,
  ChevronDown,
  Plus,
  Clock,
  PlayCircle,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import type { Service, Operator, Specialty, ServiceStatus } from "@/types/urbango";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ViewMode = "day" | "week" | "month";

const specialtyIcon: Record<Specialty, React.ReactNode> = {
  "Fontanería/Agua": <Droplets className="w-3 h-3" />,
  "Electricidad/Luz": <Zap className="w-3 h-3" />,
  Clima: <Wind className="w-3 h-3" />,
};

const specialtyColor: Record<Specialty, string> = {
  "Fontanería/Agua": "bg-info/15 text-info border-info/30",
  "Electricidad/Luz": "bg-warning/15 text-warning border-warning/30",
  Clima: "bg-success/15 text-success border-success/30",
};

const statusLabels: Record<string, string> = {
  Pendiente_Contacto: "Pendiente contacto",
  Agendado: "Agendado",
  En_Curso: "En curso",
  Finalizado: "Finalizado",
  Liquidado: "Liquidado",
};

function getOperatorColor(operatorId: string | null): { bg: string; text: string; border: string } {
  if (!operatorId) return { bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))", border: "hsl(var(--border))" };
  const op = mockOperators.find((o) => o.id === operatorId);
  if (!op) return { bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))", border: "hsl(var(--border))" };
  return {
    bg: `hsl(${op.color} / 0.15)`,
    text: `hsl(${op.color})`,
    border: `hsl(${op.color} / 0.35)`,
  };
}

function getServicesForDate(services: Service[], date: Date): Service[] {
  return services.filter((s) => {
    if (!s.scheduledAt) return false;
    const start = new Date(s.scheduledAt);
    if (s.scheduledEndAt) {
      const end = new Date(s.scheduledEndAt);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return dayStart >= startDay && dayStart <= endDay;
    }
    return isSameDay(start, date);
  });
}

// ─── DRAG & DROP HELPERS ───────────────────────────────────
function handleDragStart(e: DragEvent, service: Service) {
  e.dataTransfer.setData("text/plain", service.id);
  e.dataTransfer.effectAllowed = "move";
}

function DroppableCell({
  date,
  children,
  className,
  onDropService,
  style,
}: {
  date: Date;
  children: React.ReactNode;
  className?: string;
  onDropService: (serviceId: string, targetDate: Date) => void;
  style?: React.CSSProperties;
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={cn(className, over && "ring-2 ring-primary/50 bg-primary/5")}
      style={style}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const serviceId = e.dataTransfer.getData("text/plain");
        if (serviceId) onDropService(serviceId, date);
      }}
    >
      {children}
    </div>
  );
}

function ServiceChip({
  service,
  showTime = false,
}: {
  service: Service;
  showTime?: boolean;
}) {
  const navigate = useNavigate();
  const colors = getOperatorColor(service.operatorId);

  const timeStr = service.scheduledAt
    ? format(new Date(service.scheduledAt), "HH:mm") +
      (service.scheduledEndAt ? "–" + format(new Date(service.scheduledEndAt), "HH:mm") : "")
    : "";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          draggable
          onDragStart={(e) => handleDragStart(e as any, service)}
          onClick={() => navigate(`/servicios/${service.id}`)}
          className="w-full text-left px-2 py-1 rounded-md text-xs font-medium truncate border transition-colors hover:ring-1 hover:ring-ring cursor-grab active:cursor-grabbing"
          style={{
            backgroundColor: colors.bg,
            color: colors.text,
            borderColor: colors.border,
          }}
        >
          <span className="flex items-center gap-1">
            {specialtyIcon[service.specialty]}
            <span className="truncate">
              {showTime && timeStr ? `${timeStr} ` : ""}{service.id} · {service.operatorName ?? "Sin asignar"}
            </span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold">{service.id} – {service.clientName}</p>
          <p className="text-xs"><span className="text-muted-foreground">Tipo:</span> {service.serviceType === "Presupuesto" ? "Con presupuesto" : "Reparación directa"}</p>
          <p className="text-xs"><span className="text-muted-foreground">Especialidad:</span> {service.specialty}</p>
          <p className="text-xs"><span className="text-muted-foreground">Colaborador:</span> {service.collaboratorName ?? "Sin colaborador"}</p>
          <p className="text-xs"><span className="text-muted-foreground">Estado:</span> {statusLabels[service.status] ?? service.status}</p>
          {timeStr && (
            <p className="text-xs"><span className="text-muted-foreground">Horario:</span> {timeStr}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── CURRENT TIME LINE ─────────────────────────────────────
function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Red line indicating current time. Place inside a relative-positioned hour row container. */
function CurrentTimeLine({ hour, colStart, colSpan }: { hour: number; colStart: number; colSpan: number }) {
  const now = useCurrentTime();
  const currentHour = getHours(now);
  const currentMinute = getMinutes(now);
  if (currentHour !== hour) return null;
  const topPercent = (currentMinute / 60) * 100;

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{
        top: `${topPercent}%`,
        gridColumn: `${colStart} / span ${colSpan}`,
      }}
    >
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-destructive shrink-0 -ml-1" />
        <div className="flex-1 h-[2px] bg-destructive" />
      </div>
    </div>
  );
}

// ─── DAY VIEW ──────────────────────────────────────────────
function DayView({
  date,
  onDropService,
  onHourRangeSelect,
  filteredServices,
  selectedOperatorId,
}: {
  date: Date;
  onDropService: (serviceId: string, targetDate: Date) => void;
  onHourRangeSelect: (day: Date, startHour: number, endHour: number) => void;
  filteredServices?: Service[];
  selectedOperatorId?: string | null;
}) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 7);
  const { services: allServices } = useServices();
  const services = filteredServices ?? allServices;
  const scheduledServices = services.filter(
    (s) => s.scheduledAt && isSameDay(new Date(s.scheduledAt), date)
  );

  const operators = selectedOperatorId
    ? mockOperators.filter((op) => op.id === selectedOperatorId)
    : mockOperators;
  const unassigned = scheduledServices.filter((s) => !s.operatorId);

  // ── Hour range selection state ──
  const [selecting, setSelecting] = useState(false);
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);

  const handleSelMouseDown = (hour: number) => {
    setSelecting(true);
    setSelStart(hour);
    setSelEnd(hour);
  };

  const handleSelMouseEnter = (hour: number) => {
    if (selecting) setSelEnd(hour);
  };

  const handleSelMouseUp = () => {
    if (selecting && selStart !== null && selEnd !== null) {
      const minH = Math.min(selStart, selEnd);
      const maxH = Math.max(selStart, selEnd) + 1;
      onHourRangeSelect(date, minH, maxH);
    }
    setSelecting(false);
    setSelStart(null);
    setSelEnd(null);
  };

  const isHourSelected = (hour: number) => {
    if (!selecting || selStart === null || selEnd === null) return false;
    const minH = Math.min(selStart, selEnd);
    const maxH = Math.max(selStart, selEnd);
    return hour >= minH && hour <= maxH;
  };

  return (
    <div className="overflow-x-auto" onMouseUp={handleSelMouseUp} onMouseLeave={() => { if (selecting) handleSelMouseUp(); }}>
      <div className="min-w-[700px]">
        <div className="grid gap-0 border-b border-border" style={{ gridTemplateColumns: `80px repeat(${operators.length + (unassigned.length ? 1 : 0)}, 1fr)` }}>
          <div className="p-2 text-xs font-medium text-muted-foreground border-r border-border">Hora</div>
          {operators.map((op) => (
            <div key={op.id} className="p-2 text-center border-r border-border last:border-r-0">
              <div className="flex items-center justify-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(${op.color})` }} />
                <span className="text-xs font-semibold text-foreground">{op.name.split(" ")[0]}</span>
              </div>
              <span className={cn("inline-flex items-center gap-0.5 text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full border", specialtyColor[op.specialty])}>
                {specialtyIcon[op.specialty]}
                {op.specialty.split("/")[0]}
              </span>
            </div>
          ))}
          {unassigned.length > 0 && (
            <div className="p-2 text-center">
              <span className="text-xs font-semibold text-destructive">Sin asignar</span>
            </div>
          )}
        </div>

        {hours.map((hour) => (
          <div
            key={hour}
            className={cn(
              "relative grid gap-0 border-b border-border min-h-[56px] select-none",
              isToday(date) && getHours(new Date()) === hour && "bg-primary/5",
              isHourSelected(hour) && "bg-primary/10"
            )}
            style={{ gridTemplateColumns: `80px repeat(${operators.length + (unassigned.length ? 1 : 0)}, 1fr)` }}
            onMouseDown={() => handleSelMouseDown(hour)}
            onMouseEnter={() => handleSelMouseEnter(hour)}
          >
            {isToday(date) && <CurrentTimeLine hour={hour} colStart={2} colSpan={operators.length + (unassigned.length ? 1 : 0)} />}
            <div className="p-2 text-xs text-muted-foreground border-r border-border font-mono pointer-events-none">
              {String(hour).padStart(2, "0")}:00
            </div>
            {operators.map((op) => {
              const opServices = scheduledServices.filter(
                (s) => s.operatorId === op.id && s.scheduledAt && getHours(new Date(s.scheduledAt)) === hour
              );
              return (
                <DroppableCell key={op.id} date={date} onDropService={onDropService} className="p-1 border-r border-border last:border-r-0 space-y-0.5">
                  {opServices.map((s) => (
                    <ServiceChip key={s.id} service={s} />
                  ))}
                </DroppableCell>
              );
            })}
            {unassigned.length > 0 && (
              <DroppableCell date={date} onDropService={onDropService} className="p-1 space-y-0.5">
                {unassigned
                  .filter((s) => s.scheduledAt && getHours(new Date(s.scheduledAt)) === hour)
                  .map((s) => (
                    <ServiceChip key={s.id} service={s} />
                  ))}
              </DroppableCell>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WEEK VIEW ─────────────────────────────────────────────
function WeekView({
  date,
  onDropService,
  onHourRangeSelect,
  filteredServices,
}: {
  date: Date;
  onDropService: (serviceId: string, targetDate: Date) => void;
  onHourRangeSelect: (day: Date, startHour: number, endHour: number) => void;
  filteredServices?: Service[];
}) {
  const { services: allServices } = useServices();
  const navigate = useNavigate();
  const services = filteredServices ?? allServices;
  const weekStart = startOfWeek(date, { locale: es, weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // ── Hour range selection state ──
  const [selecting, setSelecting] = useState(false);
  const [selDay, setSelDay] = useState<number | null>(null);
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);

  const handleSelMouseDown = (dayIdx: number, hour: number) => {
    setSelecting(true);
    setSelDay(dayIdx);
    setSelStart(hour);
    setSelEnd(hour);
  };

  const handleSelMouseEnter = (dayIdx: number, hour: number) => {
    if (selecting && dayIdx === selDay) setSelEnd(hour);
  };

  const handleSelMouseUp = () => {
    if (selecting && selDay !== null && selStart !== null && selEnd !== null) {
      const minH = Math.min(selStart, selEnd);
      const maxH = Math.max(selStart, selEnd) + 1;
      onHourRangeSelect(days[selDay], minH, maxH);
    }
    setSelecting(false);
    setSelDay(null);
    setSelStart(null);
    setSelEnd(null);
  };

  const isHourSelected = (dayIdx: number, hour: number) => {
    if (!selecting || selDay !== dayIdx || selStart === null || selEnd === null) return false;
    const minH = Math.min(selStart, selEnd);
    const maxH = Math.max(selStart, selEnd);
    return hour >= minH && hour <= maxH;
  };

  const weekServices = services.filter((s) => {
    if (!s.scheduledAt) return false;
    const sStart = new Date(s.scheduledAt);
    const startD = new Date(sStart.getFullYear(), sStart.getMonth(), sStart.getDate());
    const endD = s.scheduledEndAt
      ? new Date(new Date(s.scheduledEndAt).getFullYear(), new Date(s.scheduledEndAt).getMonth(), new Date(s.scheduledEndAt).getDate())
      : startD;
    const weekStartD = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
    const weekEndD = new Date(days[6].getFullYear(), days[6].getMonth(), days[6].getDate());
    return endD >= weekStartD && startD <= weekEndD;
  });

  const multiDayServices = weekServices.filter(isMultiDay);
  const singleDayServices = weekServices.filter((s) => !isMultiDay(s));

  const barSegments = computeBarSegments(days, weekServices);
  const maxBarRows = barSegments.length > 0 ? Math.max(...barSegments.map((b) => b.row)) + 1 : 0;

  return (
    <div className="h-full flex flex-col" onMouseUp={handleSelMouseUp} onMouseLeave={() => { if (selecting) handleSelMouseUp(); }}>
      {/* Day headers */}
      <div className="grid gap-0 shrink-0" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="border-b border-r border-border" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "px-2 py-1.5 text-center border-b border-r border-border last:border-r-0",
              isToday(day) && "bg-primary text-primary-foreground"
            )}
          >
            <div className="text-[10px] font-medium uppercase">
              {format(day, "EEE", { locale: es })}
            </div>
            <div className="text-lg font-bold">{format(day, "d")}</div>
          </div>
        ))}
      </div>

      {/* Multi-day bars */}
      {maxBarRows > 0 && (
        <div className="shrink-0 border-b border-border bg-muted/30">
          {Array.from({ length: Math.min(maxBarRows, 4) }, (_, rowIdx) => (
            <div
              key={rowIdx}
              className="grid gap-0 px-0.5"
              style={{ gridTemplateColumns: "56px repeat(7, 1fr)", height: 22 }}
            >
              <div />
              {barSegments
                .filter((b) => b.row === rowIdx)
                .map((bar) => {
                  const colors = getOperatorColor(bar.service.operatorId);
                  const sStart = new Date(bar.service.scheduledAt!);
                  const sEnd = new Date(bar.service.scheduledEndAt!);
                  const startsThisWeek = isSameDay(sStart, days[bar.colStart - 1]) || sStart < days[0];
                  const endsThisWeek = isSameDay(sEnd, days[bar.colEnd - 2]) || sEnd > days[6];

                  return (
                    <Tooltip key={bar.service.id}>
                      <TooltipTrigger asChild>
                        <button
                          draggable
                          onDragStart={(e) => handleDragStart(e as any, bar.service)}
                          onClick={() => navigate(`/servicios/${bar.service.id}`)}
                          className={cn(
                            "h-[20px] flex items-center gap-1 text-[10px] font-semibold truncate border cursor-grab active:cursor-grabbing transition-colors hover:ring-1 hover:ring-ring px-1.5",
                            startsThisWeek ? "rounded-l-md" : "rounded-l-none border-l-0",
                            endsThisWeek ? "rounded-r-md" : "rounded-r-none border-r-0"
                          )}
                          style={{
                            gridColumn: `${bar.colStart + 1} / ${bar.colEnd + 1}`,
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: colors.border,
                          }}
                        >
                          {specialtyIcon[bar.service.specialty]}
                          <span className="truncate">
                            {bar.service.id} · {bar.service.operatorName ?? "Sin asignar"}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">{bar.service.id} – {bar.service.clientName}</p>
                          <p className="text-xs"><span className="text-muted-foreground">Periodo:</span> {format(sStart, "d MMM", { locale: es })} – {format(sEnd, "d MMM", { locale: es })}</p>
                          <p className="text-xs"><span className="text-muted-foreground">Operario:</span> {bar.service.operatorName ?? "Sin asignar"}</p>
                          <p className="text-xs"><span className="text-muted-foreground">Estado:</span> {statusLabels[bar.service.status] ?? bar.service.status}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
            </div>
          ))}
          {maxBarRows > 4 && (
            <p className="text-[10px] text-muted-foreground text-center py-0.5">+{maxBarRows - 4} más</p>
          )}
        </div>
      )}

      {/* Hour rows — with selection support */}
      <div className="flex-1 overflow-y-auto select-none">
        {hours.map((hour) => {
          const hasToday = days.some((d) => isToday(d));
          const todayColIdx = days.findIndex((d) => isToday(d));
          return (
          <div
            key={hour}
            className="relative grid gap-0 border-b border-border min-h-[52px]"
            style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
          >
            {hasToday && <CurrentTimeLine hour={hour} colStart={todayColIdx + 2} colSpan={1} />}
            <div className="p-1 text-[10px] text-muted-foreground border-r border-border font-mono text-right pr-2">
              {String(hour).padStart(2, "0")}:00
            </div>
            {days.map((day, dayIdx) => {
              const dayServices = singleDayServices.filter(
                (s) => {
                  if (!s.scheduledAt) return false;
                  const start = new Date(s.scheduledAt);
                  return isSameDay(start, day) && getHours(start) === hour;
                }
              );
              const selected = isHourSelected(dayIdx, hour);
              return (
                <DroppableCell
                  key={day.toISOString()}
                  date={day}
                  onDropService={onDropService}
                  className={cn(
                    "p-0.5 border-r border-border last:border-r-0 space-y-0.5 cursor-cell",
                    selected && "bg-primary/15 ring-1 ring-inset ring-primary/40"
                  )}
                >
                  <div
                    className="w-full h-full min-h-[44px]"
                    onMouseDown={(e) => {
                      if (e.button === 0 && !(e.target as HTMLElement).closest('[data-service-chip]')) {
                        handleSelMouseDown(dayIdx, hour);
                      }
                    }}
                    onMouseEnter={() => handleSelMouseEnter(dayIdx, hour)}
                  >
                    {dayServices.map((s) => (
                      <div key={s.id} data-service-chip>
                        <ServiceChip service={s} />
                      </div>
                    ))}
                  </div>
                </DroppableCell>
              );
            })}
          </div>
        );
        })}
      </div>
    </div>
  );
}

// ─── MONTH VIEW helpers ────────────────────────────────────
function isMultiDay(s: Service): boolean {
  if (!s.scheduledAt || !s.scheduledEndAt) return false;
  return !isSameDay(new Date(s.scheduledAt), new Date(s.scheduledEndAt));
}

interface BarSegment {
  service: Service;
  colStart: number;
  colEnd: number;
  row: number;
}

function computeBarSegments(weekDays: Date[], services: Service[]): BarSegment[] {
  const multiDayServices = services.filter(isMultiDay);
  const segments: BarSegment[] = [];
  const rowTaken: number[][] = [];

  for (const service of multiDayServices) {
    const sStart = new Date(service.scheduledAt!);
    const sEnd = new Date(service.scheduledEndAt!);
    const startDay = new Date(sStart.getFullYear(), sStart.getMonth(), sStart.getDate());
    const endDay = new Date(sEnd.getFullYear(), sEnd.getMonth(), sEnd.getDate());

    let colStart = -1;
    let colEnd = -1;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekDays[i].getFullYear(), weekDays[i].getMonth(), weekDays[i].getDate());
      if (d >= startDay && d <= endDay) {
        if (colStart === -1) colStart = i + 1;
        colEnd = i + 2;
      }
    }
    if (colStart === -1) continue;

    let row = 0;
    const occupiedCols = Array.from({ length: colEnd - colStart }, (_, i) => colStart + i);
    while (true) {
      if (!rowTaken[row]) rowTaken[row] = [];
      const conflict = occupiedCols.some((c) => rowTaken[row].includes(c));
      if (!conflict) break;
      row++;
    }
    occupiedCols.forEach((c) => rowTaken[row].push(c));

    segments.push({ service, colStart, colEnd, row });
  }
  return segments;
}

function MonthView({ date, onDropService, filteredServices }: { date: Date; onDropService: (serviceId: string, targetDate: Date) => void; filteredServices?: Service[] }) {
  const { services: allServices } = useServices();
  const services = filteredServices ?? allServices;
  const navigate = useNavigate();
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { locale: es, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: es, weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const rangeServices = services.filter((s) => {
    if (!s.scheduledAt) return false;
    const start = new Date(s.scheduledAt);
    const startD = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endD = s.scheduledEndAt
      ? new Date(new Date(s.scheduledEndAt).getFullYear(), new Date(s.scheduledEndAt).getMonth(), new Date(s.scheduledEndAt).getDate())
      : startD;
    const calStartD = new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate());
    const calEndD = new Date(calendarEnd.getFullYear(), calendarEnd.getMonth(), calendarEnd.getDate());
    return endD >= calStartD && startD <= calEndD;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-7 gap-0 border border-border rounded-t-lg overflow-hidden shrink-0">
        {weekDayLabels.map((d) => (
          <div key={d} className="py-1.5 text-center text-xs font-semibold text-muted-foreground border-b border-border bg-muted/50">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="border-x border-b border-border rounded-b-lg overflow-hidden flex-1 flex flex-col">
        {weeks.map((weekDays, wi) => {
          const barSegments = computeBarSegments(weekDays, rangeServices);
          const maxBarRows = barSegments.length > 0 ? Math.max(...barSegments.map((b) => b.row)) + 1 : 0;

          return (
            <div key={wi} className="flex-1 min-h-0 flex flex-col border-b border-border last:border-b-0">
              {/* Day numbers row */}
              <div className="grid grid-cols-7 shrink-0">
                {weekDays.map((day) => {
                  const isCurrentMonth = isSameMonth(day, date);
                  const dayServices = getServicesForDate(rangeServices, day);
                  return (
                    <DroppableCell
                      key={day.toISOString()}
                      date={day}
                      onDropService={onDropService}
                      className={cn(
                        "flex justify-between items-center px-1.5 py-0.5 border-r border-border last:border-r-0",
                        !isCurrentMonth && "opacity-40"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                          isToday(day) && "bg-primary text-primary-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayServices.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">
                          {dayServices.length}
                        </Badge>
                      )}
                    </DroppableCell>
                  );
                })}
              </div>

              {/* Multi-day bars */}
              {maxBarRows > 0 && (
                <div className="shrink-0">
                  {Array.from({ length: Math.min(maxBarRows, 3) }, (_, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-7 gap-0 px-0.5" style={{ height: 20 }}>
                      {barSegments
                        .filter((b) => b.row === rowIdx)
                        .map((bar) => {
                          const colors = getOperatorColor(bar.service.operatorId);
                          const sStart = new Date(bar.service.scheduledAt!);
                          const sEnd = new Date(bar.service.scheduledEndAt!);
                          const startsThisWeek = isSameDay(sStart, weekDays[bar.colStart - 1]) || sStart < weekDays[0];
                          const endsThisWeek = isSameDay(sEnd, weekDays[bar.colEnd - 2]) || sEnd > weekDays[6];

                          return (
                            <Tooltip key={bar.service.id}>
                              <TooltipTrigger asChild>
                                <button
                                  draggable
                                  onDragStart={(e) => handleDragStart(e as any, bar.service)}
                                  onClick={() => navigate(`/servicios/${bar.service.id}`)}
                                  className={cn(
                                    "h-[18px] flex items-center gap-1 text-[10px] font-semibold truncate border cursor-grab active:cursor-grabbing transition-colors hover:ring-1 hover:ring-ring px-1.5",
                                    bar.colStart === 1 ? "rounded-l-md" : startsThisWeek ? "rounded-l-md" : "rounded-l-none border-l-0",
                                    bar.colEnd === 8 ? "rounded-r-md" : endsThisWeek ? "rounded-r-md" : "rounded-r-none border-r-0"
                                  )}
                                  style={{
                                    gridColumn: `${bar.colStart} / ${bar.colEnd}`,
                                    backgroundColor: colors.bg,
                                    color: colors.text,
                                    borderColor: colors.border,
                                  }}
                                >
                                  {specialtyIcon[bar.service.specialty]}
                                  <span className="truncate">
                                    {bar.service.id} · {bar.service.operatorName ?? "Sin asignar"}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-semibold">{bar.service.id} – {bar.service.clientName}</p>
                                  <p className="text-xs"><span className="text-muted-foreground">Periodo:</span> {format(sStart, "d MMM", { locale: es })} – {format(sEnd, "d MMM", { locale: es })}</p>
                                  <p className="text-xs"><span className="text-muted-foreground">Operario:</span> {bar.service.operatorName ?? "Sin asignar"}</p>
                                  <p className="text-xs"><span className="text-muted-foreground">Estado:</span> {statusLabels[bar.service.status] ?? bar.service.status}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                    </div>
                  ))}
                  {maxBarRows > 3 && (
                    <p className="text-[10px] text-muted-foreground text-center">+{maxBarRows - 3} más</p>
                  )}
                </div>
              )}

              {/* Single-day chips */}
              <div className="grid grid-cols-7 gap-0 flex-1 min-h-0 overflow-hidden">
                {weekDays.map((day) => {
                  const isCurrentMonth = isSameMonth(day, date);
                  const singleDayServices = getServicesForDate(rangeServices, day).filter((s) => !isMultiDay(s));
                  return (
                    <DroppableCell
                      key={day.toISOString()}
                      date={day}
                      onDropService={onDropService}
                      className={cn(
                        "px-0.5 pb-0.5 space-y-0.5 overflow-y-auto border-r border-border last:border-r-0",
                        !isCurrentMonth && "opacity-40"
                      )}
                    >
                      {singleDayServices.slice(0, 3).map((s) => (
                        <ServiceChip key={s.id} service={s} showTime />
                      ))}
                      {singleDayServices.length > 3 && (
                        <p className="text-[10px] text-muted-foreground text-center">+{singleDayServices.length - 3} más</p>
                      )}
                    </DroppableCell>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── OPERATOR SUMMARY PANEL ────────────────────────────────
function OperatorSummary({ date, view, selectedOperatorId, onSelectOperator }: { date: Date; view: ViewMode; selectedOperatorId: string | null; onSelectOperator: (id: string | null) => void }) {
  const { services } = useServices();
  const range = useMemo(() => {
    if (view === "day") return { start: date, end: date };
    if (view === "week") {
      const ws = startOfWeek(date, { locale: es, weekStartsOn: 1 });
      return { start: ws, end: addDays(ws, 6) };
    }
    return { start: startOfMonth(date), end: endOfMonth(date) };
  }, [date, view]);

  const days = eachDayOfInterval(range);

  return (
    <div className="space-y-2">
      <button
        onClick={() => onSelectOperator(null)}
        className={cn(
          "w-full flex items-center justify-between py-1.5 px-2 rounded-md transition-colors",
          selectedOperatorId === null ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/50 hover:bg-muted"
        )}
      >
        <span className="text-sm font-medium text-foreground">Todos los operarios</span>
      </button>
      {mockOperators.map((op) => {
        const assignedCount = services.filter(
          (s) =>
            s.operatorId === op.id &&
            s.scheduledAt &&
            days.some((d) => isSameDay(new Date(s.scheduledAt!), d))
        ).length;
        const isSelected = selectedOperatorId === op.id;
        return (
          <button
            key={op.id}
            onClick={() => onSelectOperator(isSelected ? null : op.id)}
            className={cn(
              "w-full flex items-center justify-between py-1.5 px-2 rounded-md transition-colors",
              isSelected ? "bg-primary/10 ring-1 ring-primary/30" : "bg-muted/50 hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(${op.color})` }} />
              <span className="text-sm font-medium text-foreground">{op.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border", specialtyColor[op.specialty])}>
                {specialtyIcon[op.specialty]}
              </span>
              <Badge variant={assignedCount > 0 ? "default" : "secondary"} className="text-[10px] h-5">
                {assignedCount} srv
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────
export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date("2026-02-24"));
  const [view, setView] = useState<ViewMode>("week");
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ServiceStatus | null>(null);
  const { services, refetch } = useServices();
  const { toast } = useToast();
  const routerNavigate = useNavigate();

  const filteredServices = useMemo(() => {
    const hasOperator = !!selectedOperatorId;
    const hasSpecialty = !!selectedSpecialty;
    const hasStatus = !!selectedStatus;
    if (!hasOperator && !hasSpecialty && !hasStatus) return undefined;
    return services.filter((s) => {
      if (hasOperator && s.operatorId !== selectedOperatorId) return false;
      if (hasSpecialty && s.specialty !== selectedSpecialty) return false;
      if (hasStatus && s.status !== selectedStatus) return false;
      return true;
    });
  }, [services, selectedOperatorId, selectedSpecialty, selectedStatus]);

  const selectedOperatorName = selectedOperatorId
    ? mockOperators.find((o) => o.id === selectedOperatorId)?.name ?? null
    : null;

  // ── Create-from-calendar dialog state ──
  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    day: Date;
    startHour: number;
    endHour: number;
  }>({ open: false, day: new Date(), startHour: 9, endHour: 10 });

  const handleHourRangeSelect = useCallback((day: Date, startHour: number, endHour: number) => {
    setCreateDialog({ open: true, day, startHour, endHour });
  }, []);

  const handleConfirmCreate = () => {
    const { day, startHour, endHour } = createDialog;
    const dateStr = format(day, "yyyy-MM-dd");
    const startTime = `${String(startHour).padStart(2, "0")}:00`;
    const endTime = `${String(endHour).padStart(2, "0")}:00`;
    setCreateDialog((prev) => ({ ...prev, open: false }));
    routerNavigate(`/servicios/nuevo?date=${dateStr}&startTime=${startTime}&endTime=${endTime}`);
  };

  const handleDropService = useCallback(async (serviceId: string, targetDate: Date) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service || !service.scheduledAt) return;

    const oldStart = new Date(service.scheduledAt);
    const dayDelta = differenceInCalendarDays(targetDate, new Date(oldStart.getFullYear(), oldStart.getMonth(), oldStart.getDate()));
    if (dayDelta === 0) return;

    const newStart = addDays(oldStart, dayDelta);
    const updates: Record<string, string> = {
      scheduled_at: newStart.toISOString(),
    };
    if (service.scheduledEndAt) {
      const oldEnd = new Date(service.scheduledEndAt);
      updates.scheduled_end_at = addDays(oldEnd, dayDelta).toISOString();
    }

    const { error } = await supabase.from("services").update(updates).eq("id", serviceId);
    if (error) {
      toast({
        title: "Error al mover servicio",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Servicio reagendado",
        description: `${serviceId} movido al ${format(targetDate, "d MMM yyyy", { locale: es })}`,
      });
      refetch();
    }
  }, [services, refetch, toast]);

  const navigate = (dir: -1 | 1) => {
    if (view === "day") setCurrentDate((d) => (dir === 1 ? addDays(d, 1) : subDays(d, 1)));
    if (view === "week") setCurrentDate((d) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
    if (view === "month") setCurrentDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
  };

  const title = useMemo(() => {
    if (view === "day") return format(currentDate, "EEEE d 'de' MMMM yyyy", { locale: es });
    if (view === "week") {
      const ws = startOfWeek(currentDate, { locale: es, weekStartsOn: 1 });
      const we = addDays(ws, 6);
      return `${format(ws, "d MMM", { locale: es })} – ${format(we, "d MMM yyyy", { locale: es })}`;
    }
    return format(currentDate, "MMMM yyyy", { locale: es });
  }, [currentDate, view]);

  const goToday = () => setCurrentDate(new Date());

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Calendario</h1>
          <p className="text-sm text-muted-foreground">Disponibilidad de operarios y servicios agendados · Arrastra para reagendar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            Hoy
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-sm font-semibold text-foreground capitalize min-w-[200px] text-center">
            {title}
          </span>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ViewMode)} className="border border-border rounded-lg">
            <ToggleGroupItem value="day" className="text-xs px-3 h-8">Día</ToggleGroupItem>
            <ToggleGroupItem value="week" className="text-xs px-3 h-8">Semana</ToggleGroupItem>
            <ToggleGroupItem value="month" className="text-xs px-3 h-8">Mes</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Collapsible panels */}
      <div className="flex flex-wrap gap-3 shrink-0 mt-3">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className={cn("gap-1.5", selectedOperatorId && "border-primary text-primary")}>
              <User className="w-4 h-4" />
              {selectedOperatorName ?? "Operarios"}
              {selectedOperatorId && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              <ChevronDown className="w-3 h-3 transition-transform [[data-state=open]>&]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="absolute z-50 mt-1 w-80 rounded-lg border border-border bg-popover p-3 shadow-lg">
            <OperatorSummary date={currentDate} view={view} selectedOperatorId={selectedOperatorId} onSelectOperator={setSelectedOperatorId} />
          </CollapsibleContent>
        </Collapsible>

        {/* Specialty filter */}
        <div className="flex items-center gap-1.5">
          {(Object.entries(specialtyColor) as [Specialty, string][]).map(([key, cls]) => {
            const isActive = selectedSpecialty === key;
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={cn("text-xs h-8 gap-1", !isActive && cls)}
                onClick={() => setSelectedSpecialty(isActive ? null : key)}
              >
                {specialtyIcon[key]}
                {key.split("/")[0]}
              </Button>
            );
          })}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          {([
            { key: "Pendiente_Contacto" as ServiceStatus, label: "Pendiente", icon: <Phone className="w-3 h-3" />, cls: "bg-warning/15 text-warning border-warning/30" },
            { key: "Agendado" as ServiceStatus, label: "Agendado", icon: <Clock className="w-3 h-3" />, cls: "bg-info/15 text-info border-info/30" },
            { key: "En_Curso" as ServiceStatus, label: "En curso", icon: <PlayCircle className="w-3 h-3" />, cls: "bg-primary/15 text-primary border-primary/30" },
            { key: "Finalizado" as ServiceStatus, label: "Finalizado", icon: <CheckCircle2 className="w-3 h-3" />, cls: "bg-success/15 text-success border-success/30" },
          ]).map(({ key, label, icon, cls }) => {
            const isActive = selectedStatus === key;
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={cn("text-xs h-8 gap-1", !isActive && cls)}
                onClick={() => setSelectedStatus(isActive ? null : key)}
              >
                {icon}
                {label}
              </Button>
            );
          })}
        </div>

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarIcon className="w-4 h-4" />
              Leyenda
              <ChevronDown className="w-3 h-3 transition-transform [[data-state=open]>&]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="absolute z-50 mt-1 w-72 rounded-lg border border-border bg-popover p-3 shadow-lg">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Operarios</p>
            <div className="space-y-1.5">
              {mockOperators.map((op) => (
                <div key={op.id} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(${op.color})` }} />
                  <span className="text-xs text-foreground">{op.name}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-muted" />
                <span className="text-xs text-muted-foreground">Sin asignar</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Especialidades</p>
              {(Object.entries(specialtyColor) as [Specialty, string][]).map(([key, cls]) => (
                <div key={key} className="flex items-center gap-2">
                  {specialtyIcon[key]}
                  <span className="text-xs text-muted-foreground">{key}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Calendar full width & height */}
      <Card className="mt-3 flex-1 min-h-0">
        <CardContent className="p-3 h-full overflow-auto">
          {view === "day" && <DayView date={currentDate} onDropService={handleDropService} onHourRangeSelect={handleHourRangeSelect} filteredServices={filteredServices} selectedOperatorId={selectedOperatorId} />}
          {view === "week" && <WeekView date={currentDate} onDropService={handleDropService} onHourRangeSelect={handleHourRangeSelect} filteredServices={filteredServices} />}
          {view === "month" && <MonthView date={currentDate} onDropService={handleDropService} filteredServices={filteredServices} />}
        </CardContent>
      </Card>

      {/* Confirmation dialog for creating service from calendar */}
      <AlertDialog open={createDialog.open} onOpenChange={(open) => setCreateDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Crear nuevo servicio
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas crear un nuevo servicio para el{" "}
              <span className="font-semibold text-foreground">
                {format(createDialog.day, "EEEE d 'de' MMMM", { locale: es })}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-foreground">
                {String(createDialog.startHour).padStart(2, "0")}:00
              </span>{" "}
              a{" "}
              <span className="font-semibold text-foreground">
                {String(createDialog.endHour).padStart(2, "0")}:00
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreate}>
              Crear servicio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
