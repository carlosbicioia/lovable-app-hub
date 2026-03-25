// Calendar utilities shared across DayView, WeekView, MonthView
import { Droplets, Zap, Wind } from "lucide-react";
import type { Operator } from "@/types/urbango";

export type ViewMode = "day" | "week" | "month";

export interface CalendarService {
  id: string;
  specialty: string;
  status: string;
  scheduledAt?: string | null;
  scheduledEndAt?: string | null;
  clientName?: string;
  operatorId?: string | null;
  operators: Array<{ id: string; name: string; color?: string }>;
}

// Cache of operators for color lookups in child views
let _operatorsCache: Operator[] = [];
export function setOperatorsCache(ops: Operator[]) {
  _operatorsCache = ops;
}
export function getOperatorsCache(): Operator[] {
  return _operatorsCache;
}

export const specialtyIcon: Record<string, React.ReactNode> = {
  "Fontanería/Agua": <Droplets className="w-3 h-3" />,
  "Electricidad/Luz": <Zap className="w-3 h-3" />,
  "Clima": <Wind className="w-3 h-3" />,
  "Carpintería_Metálica": <span className="text-[10px]">🔧</span>,
};

export const specialtyColor: Record<string, string> = {
  "Fontanería/Agua": "bg-info/15 text-info border-info/30",
  "Electricidad/Luz": "bg-warning/15 text-warning border-warning/30",
  "Clima": "bg-success/15 text-success border-success/30",
  "Carpintería_Metálica": "bg-muted text-muted-foreground border-border",
};
