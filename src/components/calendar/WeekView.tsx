"use client";

import { isSameDay, startOfWeek, addDays, getHours, getMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { useServices } from "@/hooks/useServices";
import type { Service } from "@/types/urbango";
import { DroppableCell, ServiceChip } from "./CalendarHelpers";

interface WeekViewProps {
  date: Date;
  onDropService: (serviceId: string, targetDate: Date) => void;
  onHourRangeSelect: (day: Date, startHour: number, endHour: number) => void;
  filteredServices?: Service[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function WeekView({ date, onDropService, onHourRangeSelect, filteredServices }: WeekViewProps) {
  const { services: allServices } = useServices();
  const services = filteredServices ?? allServices;

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header row */}
      <div className="grid grid-cols-[3rem_repeat(7,1fr)] sticky top-0 bg-background z-10 border-b border-border">
        <div />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "text-center py-1 text-xs font-semibold text-muted-foreground border-l border-border",
              isSameDay(day, new Date()) && "text-primary"
            )}
          >
            <div>{["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"][day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
            <div className={cn("font-bold text-sm", isSameDay(day, new Date()) && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto")}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 relative">
        <div className="grid grid-cols-[3rem_repeat(7,1fr)]">
          {HOURS.map((hour) => (
            <>
              {/* Hour label */}
              <div key={`label-${hour}`} className="border-b border-border/30 text-[10px] text-muted-foreground text-right pr-1 pt-0.5 h-14">
                {hour > 0 ? `${String(hour).padStart(2, "0")}:00` : ""}
              </div>
              {/* Day cells */}
              {days.map((day) => {
                const cellServices = services.filter((s) => {
                  if (!s.scheduledAt) return false;
                  const sDate = new Date(s.scheduledAt);
                  return isSameDay(sDate, day) && getHours(sDate) === hour;
                });

                return (
                  <DroppableCell
                    key={`${day.toISOString()}-${hour}`}
                    date={day}
                    hour={hour}
                    onDrop={onDropService}
                    onMouseDown={() => onHourRangeSelect(day, hour, hour + 1)}
                    className="border-l border-border/30 h-14 relative"
                  >
                    {cellServices.map((s) => (
                      <ServiceChip
                        key={s.id}
                        service={s}
                        style={{ position: "relative", top: "auto", left: "auto", right: "auto" }}
                      />
                    ))}
                  </DroppableCell>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
