"use client";

import { cn } from "@/lib/utils";
import type { Service } from "@/types/urbango";
import { specialtyColor } from "./calendarUtils";

// ── DroppableCell ────────────────────────────────────────────────────────────

interface DroppableCellProps {
  date: Date;
  hour?: number;
  onDrop?: (serviceId: string, date: Date) => void;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  onMouseUp?: () => void;
  isSelected?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function DroppableCell({
  date,
  hour,
  onDrop,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  isSelected,
  children,
  className,
  style,
}: DroppableCellProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const serviceId = e.dataTransfer.getData("serviceId");
    if (serviceId && onDrop) onDrop(serviceId, date);
  };

  return (
    <div
      className={cn(
        "border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer",
        isSelected && "bg-primary/10",
        className
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      style={style}
    >
      {children}
    </div>
  );
}

// ── ServiceChip ──────────────────────────────────────────────────────────────

interface ServiceChipProps {
  service: Service | any;
  style?: React.CSSProperties;
  onClick?: () => void;
  showTime?: boolean;
  spanHeight?: number;
}

export function ServiceChip({ service, style, onClick }: ServiceChipProps) {
  const colorClass = specialtyColor[service.specialty] ?? "bg-muted text-muted-foreground border-border";

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("serviceId", service.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      style={style}
      className={cn(
        "absolute left-0.5 right-0.5 text-[10px] rounded px-1 py-0.5 overflow-hidden cursor-grab active:cursor-grabbing border truncate z-10",
        colorClass
      )}
      title={`${service.id} — ${service.clientName || service.clientId}`}
    >
      {service.id}
    </div>
  );
}

// ── CurrentTimeLine ──────────────────────────────────────────────────────────

export function CurrentTimeLine({ hour, colStart, colSpan }: { hour?: number; colStart?: number; colSpan?: number } = {}) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes / (24 * 60)) * 100;

  return (
    <div
      className="absolute left-0 right-0 border-t-2 border-destructive z-20 pointer-events-none"
      style={{ top: `${top}%` }}
    >
      <div className="w-2 h-2 rounded-full bg-destructive -mt-1 -ml-1" />
    </div>
  );
}
