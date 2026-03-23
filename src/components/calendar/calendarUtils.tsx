import { isSameDay } from "date-fns";
import { Droplets, Zap, Wind, Hammer } from "lucide-react";
import type { Service, Specialty } from "@/types/urbango";

export type ViewMode = "day" | "week" | "month";

export type CalendarService = Service & {
  _displayOperatorId?: string | null;
  _displayOperatorName?: string | null;
};

export const specialtyIcon: Record<string, React.ReactNode> = {
  "Fontanería/Agua": <Droplets className="w-3 h-3" />,
  "Electricidad/Luz": <Zap className="w-3 h-3" />,
  Clima: <Wind className="w-3 h-3" />,
  Carpintería_Metálica: <Hammer className="w-3 h-3" />,
};

export const specialtyColor: Record<string, string> = {
  "Fontanería/Agua": "bg-info/15 text-info border-info/30",
  "Electricidad/Luz": "bg-warning/15 text-warning border-warning/30",
  Clima: "bg-success/15 text-success border-success/30",
  Carpintería_Metálica: "bg-orange-500/15 text-orange-600 border-orange-500/30",
};

export const statusLabels: Record<string, string> = {
  Pte_Aceptacion: "Pte. Aceptación",
  Pendiente_Contacto: "Pendiente contacto",
  Asignado: "Asignado",
  Agendado: "Agendado",
  En_Curso: "En curso",
  Finalizado: "Finalizado",
  Liquidado: "Liquidado",
};

// Mutable operators cache for getOperatorColor
export let _operatorsCache: any[] = [];
export function setOperatorsCache(ops: any[]) {
  _operatorsCache = ops;
}

export function getOperatorColor(operatorId: string | null): { bg: string; text: string; border: string } {
  if (!operatorId) return { bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))", border: "hsl(var(--border))" };
  const op = _operatorsCache.find((o: any) => o.id === operatorId);
  if (!op) return { bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))", border: "hsl(var(--border))" };
  return {
    bg: `hsl(${op.color} / 0.15)`,
    text: `hsl(${op.color})`,
    border: `hsl(${op.color} / 0.35)`,
  };
}

export function getServicesForDate(services: Service[], date: Date): Service[] {
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

export function isMultiDay(s: Service): boolean {
  if (!s.scheduledAt || !s.scheduledEndAt) return false;
  return !isSameDay(new Date(s.scheduledAt), new Date(s.scheduledEndAt));
}

export interface BarSegment {
  service: Service;
  colStart: number;
  colEnd: number;
  row: number;
}

export function computeBarSegments(weekDays: Date[], services: Service[]): BarSegment[] {
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
