import { useState, useEffect, useRef } from "react";
import { isSameDay, isToday, getHours, getMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { useOperators } from "@/hooks/useOperators";
import { useServices } from "@/hooks/useServices";
import type { Service } from "@/types/urbango";
import { type CalendarService, specialtyIcon, specialtyColor, setOperatorsCache } from "./calendarUtils";
import { DroppableCell, ServiceChip, CurrentTimeLine } from "./CalendarHelpers";

interface DayViewProps {
  date: Date;
  onDropService: (serviceId: string, targetDate: Date) => void;
  onHourRangeSelect: (day: Date, startHour: number, endHour: number) => void;
  filteredServices?: Service[];
  selectedOperatorId?: string | null;
}

export default function DayView({ date, onDropService, onHourRangeSelect, filteredServices, selectedOperatorId }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const { services: allServices } = useServices();
  const services = filteredServices ?? allServices;
  const scheduledServices = services.filter((s) => s.scheduledAt && isSameDay(new Date(s.scheduledAt), date));

  const { data: allOps = [] } = useOperators();
  setOperatorsCache(allOps as any);
  const operators = selectedOperatorId ? allOps.filter((op) => op.id === selectedOperatorId) : allOps;
  const unassigned = scheduledServices.filter((s) => s.operators.length === 0 && !s.operatorId);

  const [selecting, setSelecting] = useState(false);
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);

  const handleSelMouseDown = (hour: number) => { setSelecting(true); setSelStart(hour); setSelEnd(hour); };
  const handleSelMouseEnter = (hour: number) => { if (selecting) setSelEnd(hour); };
  const handleSelMouseUp = () => {
    if (selecting && selStart !== null && selEnd !== null) {
      onHourRangeSelect(date, Math.min(selStart, selEnd), Math.max(selStart, selEnd) + 1);
    }
    setSelecting(false); setSelStart(null); setSelEnd(null);
  };
  const isHourSelected = (hour: number) => {
    if (!selecting || selStart === null || selEnd === null) return false;
    return hour >= Math.min(selStart, selEnd) && hour <= Math.max(selStart, selEnd);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current && isToday(date)) {
      scrollRef.current.scrollTop = Math.max(0, getHours(new Date()) * 56 - 100);
    }
  }, [date]);

  return (
    <div className="h-full flex flex-col overflow-hidden" onMouseUp={handleSelMouseUp} onMouseLeave={() => { if (selecting) handleSelMouseUp(); }}>
      <div className="min-w-[700px] flex flex-col h-full">
        <div className="grid gap-0 border-b border-border shrink-0" style={{ gridTemplateColumns: `80px repeat(${operators.length + (unassigned.length ? 1 : 0)}, 1fr)` }}>
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
            <div className="p-2 text-center"><span className="text-xs font-semibold text-destructive">Sin asignar</span></div>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-auto select-none">
          {hours.map((hour) => (
            <div
              key={hour}
              className={cn("relative grid gap-0 border-b border-border min-h-[56px] select-none", isToday(date) && getHours(new Date()) === hour && "bg-primary/5", isHourSelected(hour) && "bg-primary/10")}
              style={{ gridTemplateColumns: `80px repeat(${operators.length + (unassigned.length ? 1 : 0)}, 1fr)` }}
              onMouseDown={() => handleSelMouseDown(hour)}
              onMouseEnter={() => handleSelMouseEnter(hour)}
            >
              {isToday(date) && <CurrentTimeLine hour={hour} colStart={2} colSpan={operators.length + (unassigned.length ? 1 : 0)} />}
              <div className="p-2 text-xs text-muted-foreground border-r border-border font-mono pointer-events-none">{String(hour).padStart(2, "0")}:00</div>
              {operators.map((op) => {
                const opServices = scheduledServices.filter(
                  (s) => (s.operators.some((o) => o.id === op.id) || s.operatorId === op.id) && s.scheduledAt && getHours(new Date(s.scheduledAt)) === hour
                ).map((s) => ({ ...s, _displayOperatorId: op.id, _displayOperatorName: op.name } as any));
                return (
                  <DroppableCell key={op.id} date={date} onDrop={onDropService} className="relative p-0 border-r border-border last:border-r-0" style={{ overflow: 'visible' }}>
                    {opServices.map((s) => {
                      const start = new Date(s.scheduledAt!);
                      const end = s.scheduledEndAt ? new Date(s.scheduledEndAt) : null;
                      const startMin = getHours(start) * 60 + getMinutes(start);
                      const endMin = end ? Math.min(getHours(end) * 60 + getMinutes(end), 1440) : startMin + 60;
                      const ROW_H = 56;
                      const topPx = (getMinutes(start) / 60) * ROW_H;
                      const heightPx = (Math.max(endMin - startMin, 15) / 60) * ROW_H;
                      return (
                        <div key={s.id} className="absolute z-10 left-1 right-1" style={{ top: topPx, height: Math.max(heightPx, 24) }} data-service-chip>
                          <ServiceChip service={s} showTime spanHeight={heightPx} />
                        </div>
                      );
                    })}
                  </DroppableCell>
                );
              })}
              {unassigned.length > 0 && (
                <DroppableCell date={date} onDrop={onDropService} className="relative p-0" style={{ overflow: 'visible' }}>
                  {unassigned.filter((s) => s.scheduledAt && getHours(new Date(s.scheduledAt)) === hour).map((s) => {
                    const start = new Date(s.scheduledAt!);
                    const end = s.scheduledEndAt ? new Date(s.scheduledEndAt) : null;
                    const startMin = getHours(start) * 60 + getMinutes(start);
                    const endMin = end ? Math.min(getHours(end) * 60 + getMinutes(end), 1440) : startMin + 60;
                    const ROW_H = 56;
                    const topPx = (getMinutes(start) / 60) * ROW_H;
                    const heightPx = (Math.max(endMin - startMin, 15) / 60) * ROW_H;
                    return (
                      <div key={s.id} className="absolute z-10 left-1 right-1" style={{ top: topPx, height: Math.max(heightPx, 24) }} data-service-chip>
                        <ServiceChip service={s} showTime spanHeight={heightPx} />
                      </div>
                    );
                  })}
                </DroppableCell>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
