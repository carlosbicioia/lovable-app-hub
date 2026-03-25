"use client";

import { isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, getMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useServices } from "@/hooks/useServices";
import type { Service } from "@/types/urbango";
import { specialtyColor } from "./calendarUtils";

interface MonthViewProps {
  date: Date;
  onDropService: (serviceId: string, targetDate: Date) => void;
  filteredServices?: Service[];
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function MonthView({ date, onDropService, filteredServices }: MonthViewProps) {
  const { services: allServices } = useServices();
  const services = filteredServices ?? allServices;

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const serviceId = e.dataTransfer.getData("serviceId");
    if (serviceId) onDropService(serviceId, day);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {label}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const dayServices = services.filter(
            (s) => s.scheduledAt && isSameDay(new Date(s.scheduledAt), day)
          );
          const isCurrentMonth = getMonth(day) === getMonth(date);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-b border-r border-border/30 p-1 min-h-[80px]",
                !isCurrentMonth && "bg-muted/30"
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              {/* Day number */}
              <span
                className={cn(
                  "text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                  isToday(day) && "bg-primary text-primary-foreground",
                  !isCurrentMonth && "text-muted-foreground",
                  isCurrentMonth && !isToday(day) && "text-foreground"
                )}
              >
                {day.getDate()}
              </span>

              {/* Service chips */}
              <div className="mt-0.5 space-y-0.5">
                {dayServices.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("serviceId", s.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className={cn(
                      "text-[9px] rounded px-1 truncate cursor-grab border",
                      specialtyColor[s.specialty] ?? "bg-muted text-muted-foreground border-border"
                    )}
                    title={`${s.id} — ${s.clientName || s.clientId}`}
                  >
                    {s.id}
                  </div>
                ))}
                {dayServices.length > 3 && (
                  <div className="text-[9px] text-muted-foreground pl-1">
                    +{dayServices.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
