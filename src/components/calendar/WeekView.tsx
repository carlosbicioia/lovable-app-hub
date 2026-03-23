import { useState, useEffect, useRef } from "react";
import { format, startOfWeek, addDays, isSameDay, isToday, getHours, getMinutes, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useServices } from "@/hooks/useServices";
import { useRouter } from "next/navigation";
import type { Service } from "@/types/urbango";
import { specialtyIcon, statusLabels, getOperatorColor, isMultiDay, computeBarSegments } from "./calendarUtils";
import { handleDragStart, DroppableCell, ServiceChip, CurrentTimeLine } from "./CalendarHelpers";

interface WeekViewProps {
  date: Date;
  onDropService: (serviceId: string, targetDate: Date) => void;
  onHourRangeSelect: (day: Date, startHour: number, endHour: number) => void;
  filteredServices?: Service[];
}

export default function WeekView({ date, onDropService, onHourRangeSelect, filteredServices }: WeekViewProps) {
  const { services: allServices } = useServices();
  const router = useRouter();
  const weekScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (weekScrollRef.current) {
      weekScrollRef.current.scrollTop = Math.max(0, getHours(new Date()) * 52 - 100);
    }
  }, [date]);

  const services = filteredServices ?? allServices;
  const weekStart = startOfWeek(date, { locale: es, weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const [selecting, setSelecting] = useState(false);
  const [selDay, setSelDay] = useState<number | null>(null);
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);

  const handleSelMouseDown = (dayIdx: number, hour: number) => { setSelecting(true); setSelDay(dayIdx); setSelStart(hour); setSelEnd(hour); };
  const handleSelMouseEnter = (dayIdx: number, hour: number) => { if (selecting && dayIdx === selDay) setSelEnd(hour); };
  const handleSelMouseUp = () => {
    if (selecting && selDay !== null && selStart !== null && selEnd !== null) {
      onHourRangeSelect(days[selDay], Math.min(selStart, selEnd), Math.max(selStart, selEnd) + 1);
    }
    setSelecting(false); setSelDay(null); setSelStart(null); setSelEnd(null);
  };
  const isHourSelected = (dayIdx: number, hour: number) => {
    if (!selecting || selDay !== dayIdx || selStart === null || selEnd === null) return false;
    return hour >= Math.min(selStart, selEnd) && hour <= Math.max(selStart, selEnd);
  };

  const weekServices = services.filter((s) => {
    if (!s.scheduledAt) return false;
    const sStart = new Date(s.scheduledAt);
    const startD = new Date(sStart.getFullYear(), sStart.getMonth(), sStart.getDate());
    const endD = s.scheduledEndAt ? new Date(new Date(s.scheduledEndAt).getFullYear(), new Date(s.scheduledEndAt).getMonth(), new Date(s.scheduledEndAt).getDate()) : startD;
    const weekStartD = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
    const weekEndD = new Date(days[6].getFullYear(), days[6].getMonth(), days[6].getDate());
    return endD >= weekStartD && startD <= weekEndD;
  });

  const singleDayServices = weekServices.filter((s) => !isMultiDay(s));
  const barSegments = computeBarSegments(days, weekServices);
  const maxBarRows = barSegments.length > 0 ? Math.max(...barSegments.map((b) => b.row)) + 1 : 0;

  return (
    <div className="h-full flex flex-col" onMouseUp={handleSelMouseUp} onMouseLeave={() => { if (selecting) handleSelMouseUp(); }}>
      <div className="grid gap-0 shrink-0" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="border-b border-r border-border" />
        {days.map((day) => (
          <div key={day.toISOString()} className={cn("px-2 py-1.5 text-center border-b border-r border-border last:border-r-0", isToday(day) && "bg-primary text-primary-foreground")}>
            <div className="text-[10px] font-medium uppercase">{format(day, "EEE", { locale: es })}</div>
            <div className="text-lg font-bold">{format(day, "d")}</div>
          </div>
        ))}
      </div>

      {maxBarRows > 0 && (
        <div className="shrink-0 border-b border-border bg-muted/30">
          {Array.from({ length: Math.min(maxBarRows, 4) }, (_, rowIdx) => (
            <div key={rowIdx} className="grid gap-0 px-0.5" style={{ gridTemplateColumns: "56px repeat(7, 1fr)", height: 22 }}>
              <div />
              {barSegments.filter((b) => b.row === rowIdx).map((bar) => {
                const colors = getOperatorColor(bar.service.operatorId);
                const sStart = new Date(bar.service.scheduledAt!);
                const sEnd = new Date(bar.service.scheduledEndAt!);
                const startsThisWeek = isSameDay(sStart, days[bar.colStart - 1]) || sStart < days[0];
                const endsThisWeek = isSameDay(sEnd, days[bar.colEnd - 2]) || sEnd > days[6];
                return (
                  <Tooltip key={bar.service.id}>
                    <TooltipTrigger asChild>
                      <button
                        draggable onDragStart={(e) => handleDragStart(e as any, bar.service)}
                        onClick={() => router.push(`/servicios/${bar.service.id}`)}
                        className={cn("h-[20px] flex items-center gap-1 text-[10px] font-semibold truncate border cursor-grab active:cursor-grabbing transition-colors hover:ring-1 hover:ring-ring px-1.5", startsThisWeek ? "rounded-l-md" : "rounded-l-none border-l-0", endsThisWeek ? "rounded-r-md" : "rounded-r-none border-r-0")}
                        style={{ gridColumn: `${bar.colStart + 1} / ${bar.colEnd + 1}`, backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
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
          {maxBarRows > 4 && <p className="text-[10px] text-muted-foreground text-center py-0.5">+{maxBarRows - 4} más</p>}
        </div>
      )}

      <div ref={weekScrollRef} className="flex-1 overflow-y-auto select-none">
        {hours.map((hour) => {
          const todayColIdx = days.findIndex((d) => isToday(d));
          return (
            <div key={hour} className="relative grid gap-0 border-b border-border min-h-[52px]" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              {todayColIdx >= 0 && <CurrentTimeLine hour={hour} colStart={todayColIdx + 2} colSpan={1} />}
              <div className="p-1 text-[10px] text-muted-foreground border-r border-border font-mono text-right pr-2">{String(hour).padStart(2, "0")}:00</div>
              {days.map((day, dayIdx) => {
                const dayServices = singleDayServices.filter((s) => s.scheduledAt && isSameDay(new Date(s.scheduledAt), day) && getHours(new Date(s.scheduledAt)) === hour);
                const selected = isHourSelected(dayIdx, hour);
                return (
                  <DroppableCell key={day.toISOString()} date={day} onDropService={onDropService}
                    className={cn("relative p-0 border-r border-border last:border-r-0 cursor-cell", selected && "bg-primary/15 ring-1 ring-inset ring-primary/40")}
                    style={{ overflow: 'visible' }}
                  >
                    <div className="w-full h-full min-h-[44px]"
                      onMouseDown={(e) => { if (e.button === 0 && !(e.target as HTMLElement).closest('[data-service-chip]')) handleSelMouseDown(dayIdx, hour); }}
                      onMouseEnter={() => handleSelMouseEnter(dayIdx, hour)}
                    >
                      {dayServices.map((s) => {
                        const start = new Date(s.scheduledAt!);
                        const end = s.scheduledEndAt ? new Date(s.scheduledEndAt) : null;
                        const startMin = getHours(start) * 60 + getMinutes(start);
                        const endMin = end ? Math.min(getHours(end) * 60 + getMinutes(end), 1440) : startMin + 60;
                        const ROW_H = 52;
                        const topPx = (getMinutes(start) / 60) * ROW_H;
                        const heightPx = (Math.max(endMin - startMin, 15) / 60) * ROW_H;
                        return (
                          <div key={s.id} className="absolute z-10 left-0.5 right-0.5" style={{ top: topPx, height: Math.max(heightPx, 24) }} data-service-chip>
                            <ServiceChip service={s} showTime spanHeight={heightPx} />
                          </div>
                        );
                      })}
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
