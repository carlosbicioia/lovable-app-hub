import { useState, useMemo } from "react";
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
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Service, Operator, Specialty } from "@/types/urbango";
import { useNavigate } from "react-router-dom";

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
      // Check if date falls within [start, end] range (by day)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return dayStart >= startDay && dayStart <= endDay;
    }
    return isSameDay(start, date);
  });
}

function ServiceChip({ service, showTime = false }: { service: Service; showTime?: boolean }) {
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
          onClick={() => navigate(`/servicios/${service.id}`)}
          className="w-full text-left px-2 py-1 rounded-md text-xs font-medium truncate border transition-colors hover:ring-1 hover:ring-ring cursor-pointer"
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

// ─── DAY VIEW ──────────────────────────────────────────────
function DayView({ date }: { date: Date }) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 7);
  const { services } = useServices();
  const scheduledServices = services.filter(
    (s) => s.scheduledAt && isSameDay(new Date(s.scheduledAt), date)
  );

  // Group by operator
  const operators = mockOperators;
  const unassigned = scheduledServices.filter((s) => !s.operatorId);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header row */}
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

        {/* Hour rows */}
        {hours.map((hour) => (
          <div
            key={hour}
            className={cn(
              "grid gap-0 border-b border-border min-h-[56px]",
              isToday(date) && getHours(new Date()) === hour && "bg-primary/5"
            )}
            style={{ gridTemplateColumns: `80px repeat(${operators.length + (unassigned.length ? 1 : 0)}, 1fr)` }}
          >
            <div className="p-2 text-xs text-muted-foreground border-r border-border font-mono">
              {String(hour).padStart(2, "0")}:00
            </div>
            {operators.map((op) => {
              const opServices = scheduledServices.filter(
                (s) => s.operatorId === op.id && s.scheduledAt && getHours(new Date(s.scheduledAt)) === hour
              );
              return (
                <div key={op.id} className="p-1 border-r border-border last:border-r-0 space-y-0.5">
                  {opServices.map((s) => (
                    <ServiceChip key={s.id} service={s} />
                  ))}
                </div>
              );
            })}
            {unassigned.length > 0 && (
              <div className="p-1 space-y-0.5">
                {unassigned
                  .filter((s) => s.scheduledAt && getHours(new Date(s.scheduledAt)) === hour)
                  .map((s) => (
                    <ServiceChip key={s.id} service={s} />
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WEEK VIEW ─────────────────────────────────────────────
function WeekView({ date }: { date: Date }) {
  const { services } = useServices();
  const weekStart = startOfWeek(date, { locale: es, weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const hours = Array.from({ length: 12 }, (_, i) => i + 7);



  return (
    <div className="h-full flex flex-col">
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
      {/* Hour rows */}
      <div className="flex-1 overflow-y-auto">
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid gap-0 border-b border-border min-h-[52px]"
            style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}
          >
            <div className="p-1 text-[10px] text-muted-foreground border-r border-border font-mono text-right pr-2">
              {String(hour).padStart(2, "0")}:00
            </div>
            {days.map((day) => {
              const dayServices = services.filter(
                (s) => {
                  if (!s.scheduledAt) return false;
                  const start = new Date(s.scheduledAt);
                  const isMultiDay = s.scheduledEndAt && !isSameDay(start, new Date(s.scheduledEndAt));
                  if (isMultiDay) {
                    // Multi-day: show on the start hour for every spanned day
                    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                    const endDay = new Date(new Date(s.scheduledEndAt!).getFullYear(), new Date(s.scheduledEndAt!).getMonth(), new Date(s.scheduledEndAt!).getDate());
                    const target = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                    return target >= startDay && target <= endDay && getHours(start) === hour;
                  }
                  return isSameDay(start, day) && getHours(start) === hour;
                }
              );
              return (
                <div key={day.toISOString()} className="p-0.5 border-r border-border last:border-r-0 space-y-0.5">
                  {dayServices.map((s) => (
                    <ServiceChip key={s.id} service={s} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
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
  colStart: number; // 1-based grid column
  colEnd: number;   // 1-based grid column (exclusive)
  row: number;      // stacking row (0-based)
}

function computeBarSegments(weekDays: Date[], services: Service[]): BarSegment[] {
  const multiDayServices = services.filter(isMultiDay);
  const segments: BarSegment[] = [];
  const rowTaken: number[][] = []; // rowTaken[row] = list of occupied columns

  for (const service of multiDayServices) {
    const sStart = new Date(service.scheduledAt!);
    const sEnd = new Date(service.scheduledEndAt!);
    const startDay = new Date(sStart.getFullYear(), sStart.getMonth(), sStart.getDate());
    const endDay = new Date(sEnd.getFullYear(), sEnd.getMonth(), sEnd.getDate());

    // Find which columns of this week the service occupies
    let colStart = -1;
    let colEnd = -1;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekDays[i].getFullYear(), weekDays[i].getMonth(), weekDays[i].getDate());
      if (d >= startDay && d <= endDay) {
        if (colStart === -1) colStart = i + 1;
        colEnd = i + 2; // exclusive
      }
    }
    if (colStart === -1) continue;

    // Find a free row
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

function MonthView({ date }: { date: Date }) {
  const { services } = useServices();
  const navigate = useNavigate();
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { locale: es, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: es, weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Group into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  // Get all services that appear in the calendar range
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
                {weekDays.map((day, di) => {
                  const isCurrentMonth = isSameMonth(day, date);
                  const dayServices = getServicesForDate(rangeServices, day);
                  return (
                    <div
                      key={day.toISOString()}
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
                    </div>
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
                                  onClick={() => navigate(`/servicios/${bar.service.id}`)}
                                  className={cn(
                                    "h-[18px] flex items-center gap-1 text-[10px] font-semibold truncate border cursor-pointer transition-colors hover:ring-1 hover:ring-ring px-1.5",
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
                    <div
                      key={day.toISOString()}
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
                    </div>
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
function OperatorSummary({ date, view }: { date: Date; view: ViewMode }) {
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
      {mockOperators.map((op) => {
        const assignedCount = services.filter(
          (s) =>
            s.operatorId === op.id &&
            s.scheduledAt &&
            days.some((d) => isSameDay(new Date(s.scheduledAt!), d))
        ).length;
        return (
          <div key={op.id} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50">
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
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────
export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date("2026-02-24"));
  const [view, setView] = useState<ViewMode>("week");

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

  const goToday = () => setCurrentDate(new Date("2026-02-25"));

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Calendario</h1>
          <p className="text-sm text-muted-foreground">Disponibilidad de operarios y servicios agendados</p>
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
            <Button variant="outline" size="sm" className="gap-1.5">
              <User className="w-4 h-4" />
              Operarios
              <ChevronDown className="w-3 h-3 transition-transform [[data-state=open]>&]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="absolute z-50 mt-1 w-80 rounded-lg border border-border bg-popover p-3 shadow-lg">
            <OperatorSummary date={currentDate} view={view} />
          </CollapsibleContent>
        </Collapsible>

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
          {view === "day" && <DayView date={currentDate} />}
          {view === "week" && <WeekView date={currentDate} />}
          {view === "month" && <MonthView date={currentDate} />}
        </CardContent>
      </Card>
    </div>
  );
}
