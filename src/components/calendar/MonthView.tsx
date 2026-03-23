import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useServices } from "@/hooks/useServices";
import { useRouter } from "next/navigation";
import type { Service } from "@/types/urbango";
import { specialtyIcon, statusLabels, getOperatorColor, getServicesForDate, isMultiDay, computeBarSegments } from "./calendarUtils";
import { handleDragStart, DroppableCell, ServiceChip } from "./CalendarHelpers";

interface MonthViewProps {
  date: Date;
  onDropService: (serviceId: string, targetDate: Date) => void;
  filteredServices?: Service[];
}

export default function MonthView({ date, onDropService, filteredServices }: MonthViewProps) {
  const { services: allServices } = useServices();
  const services = filteredServices ?? allServices;
  const router = useRouter();
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { locale: es, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: es, weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7));

  const rangeServices = services.filter((s) => {
    if (!s.scheduledAt) return false;
    const start = new Date(s.scheduledAt);
    const startD = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endD = s.scheduledEndAt ? new Date(new Date(s.scheduledEndAt).getFullYear(), new Date(s.scheduledEndAt).getMonth(), new Date(s.scheduledEndAt).getDate()) : startD;
    const calStartD = new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate());
    const calEndD = new Date(calendarEnd.getFullYear(), calendarEnd.getMonth(), calendarEnd.getDate());
    return endD >= calStartD && startD <= calEndD;
  });

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 gap-0 border border-border rounded-t-lg overflow-hidden shrink-0">
        {weekDayLabels.map((d) => (
          <div key={d} className="py-1.5 text-center text-xs font-semibold text-muted-foreground border-b border-border bg-muted/50">{d}</div>
        ))}
      </div>
      <div className="border-x border-b border-border rounded-b-lg overflow-hidden flex-1 flex flex-col">
        {weeks.map((weekDays, wi) => {
          const barSegments = computeBarSegments(weekDays, rangeServices);
          const maxBarRows = barSegments.length > 0 ? Math.max(...barSegments.map((b) => b.row)) + 1 : 0;
          return (
            <div key={wi} className="flex-1 min-h-0 flex flex-col border-b border-border last:border-b-0">
              <div className="grid grid-cols-7 shrink-0">
                {weekDays.map((day) => {
                  const isCurrentMonth = isSameMonth(day, date);
                  const dayServices = getServicesForDate(rangeServices, day);
                  return (
                    <DroppableCell key={day.toISOString()} date={day} onDropService={onDropService} className={cn("flex justify-between items-center px-1.5 py-0.5 border-r border-border last:border-r-0", !isCurrentMonth && "opacity-40")}>
                      <span className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full", isToday(day) && "bg-primary text-primary-foreground")}>{format(day, "d")}</span>
                      {dayServices.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1">{dayServices.length}</Badge>}
                    </DroppableCell>
                  );
                })}
              </div>
              {maxBarRows > 0 && (
                <div className="shrink-0">
                  {Array.from({ length: Math.min(maxBarRows, 3) }, (_, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-7 gap-0 px-0.5" style={{ height: 20 }}>
                      {barSegments.filter((b) => b.row === rowIdx).map((bar) => {
                        const colors = getOperatorColor(bar.service.operatorId);
                        const sStart = new Date(bar.service.scheduledAt!);
                        const sEnd = new Date(bar.service.scheduledEndAt!);
                        const startsThisWeek = isSameDay(sStart, weekDays[bar.colStart - 1]) || sStart < weekDays[0];
                        const endsThisWeek = isSameDay(sEnd, weekDays[bar.colEnd - 2]) || sEnd > weekDays[6];
                        return (
                          <Tooltip key={bar.service.id}>
                            <TooltipTrigger asChild>
                              <button draggable onDragStart={(e) => handleDragStart(e as any, bar.service)} onClick={() => router.push(`/servicios/${bar.service.id}`)}
                                className={cn("h-[18px] flex items-center gap-1 text-[10px] font-semibold truncate border cursor-grab active:cursor-grabbing transition-colors hover:ring-1 hover:ring-ring px-1.5", startsThisWeek ? "rounded-l-md" : "rounded-l-none border-l-0", endsThisWeek ? "rounded-r-md" : "rounded-r-none border-r-0")}
                                style={{ gridColumn: `${bar.colStart} / ${bar.colEnd}`, backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                              >
                                {specialtyIcon[bar.service.specialty]}
                                <span className="truncate">{bar.service.id} · {bar.service.operatorName ?? "Sin asignar"}</span>
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
                  {maxBarRows > 3 && <p className="text-[10px] text-muted-foreground text-center">+{maxBarRows - 3} más</p>}
                </div>
              )}
              <div className="grid grid-cols-7 gap-0 flex-1 min-h-0 overflow-hidden">
                {weekDays.map((day) => {
                  const isCurrentMonth = isSameMonth(day, date);
                  const singleDayServices = getServicesForDate(rangeServices, day).filter((s) => !isMultiDay(s));
                  return (
                    <DroppableCell key={day.toISOString()} date={day} onDropService={onDropService} className={cn("px-0.5 pb-0.5 space-y-0.5 overflow-y-auto border-r border-border last:border-r-0", !isCurrentMonth && "opacity-40")}>
                      {singleDayServices.slice(0, 3).map((s) => <ServiceChip key={s.id} service={s} showTime />)}
                      {singleDayServices.length > 3 && <p className="text-[10px] text-muted-foreground text-center">+{singleDayServices.length - 3} más</p>}
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
