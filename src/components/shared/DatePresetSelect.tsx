import { useState, useMemo, useCallback } from "react";
import { startOfYear, endOfYear, subYears, subMonths, subDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

type PresetKey =
  | "all"
  | "current_year"
  | "previous_year"
  | "last_12_months"
  | "last_7_days"
  | "current_month"
  | "previous_month"
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "custom";

const presets: { value: PresetKey; label: string }[] = [
  { value: "all", label: "Todas las fechas" },
  { value: "current_year", label: "Año actual" },
  { value: "previous_year", label: "Año anterior" },
  { value: "last_12_months", label: "Últimos 12 meses" },
  { value: "last_7_days", label: "Últimos 7 días" },
  { value: "current_month", label: "Mes actual" },
  { value: "previous_month", label: "Mes anterior" },
  { value: "q1", label: "1 trimestre" },
  { value: "q2", label: "2 trimestre" },
  { value: "q3", label: "3 trimestre" },
  { value: "q4", label: "4 trimestre" },
  { value: "custom", label: "Personalizado" },
];

function getPresetRange(key: PresetKey): { from: Date; to: Date } | null {
  const now = new Date();
  const year = now.getFullYear();

  switch (key) {
    case "all":
      return null;
    case "current_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "previous_year": {
      const prev = subYears(now, 1);
      return { from: startOfYear(prev), to: endOfYear(prev) };
    }
    case "last_12_months":
      return { from: subMonths(now, 12), to: now };
    case "last_7_days":
      return { from: subDays(now, 7), to: now };
    case "current_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "previous_month": {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    case "q1":
      return { from: new Date(year, 0, 1), to: new Date(year, 2, 31) };
    case "q2":
      return { from: new Date(year, 3, 1), to: new Date(year, 5, 30) };
    case "q3":
      return { from: new Date(year, 6, 1), to: new Date(year, 8, 30) };
    case "q4":
      return { from: new Date(year, 9, 1), to: new Date(year, 11, 31) };
    case "custom":
      return null;
    default:
      return null;
  }
}

interface DatePresetSelectProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateChange: (from: Date | undefined, to: Date | undefined) => void;
  className?: string;
}

export default function DatePresetSelect({ dateFrom, dateTo, onDateChange, className }: DatePresetSelectProps) {
  const [preset, setPreset] = useState<PresetKey>("all");
  const [showCustom, setShowCustom] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  const handlePresetChange = useCallback((value: string) => {
    const key = value as PresetKey;
    setPreset(key);

    if (key === "custom") {
      setShowCustom(true);
      return;
    }

    setShowCustom(false);
    const range = getPresetRange(key);
    if (range) {
      onDateChange(range.from, range.to);
    } else {
      onDateChange(undefined, undefined);
    }
  }, [onDateChange]);

  const handleCustomRangeSelect = useCallback((range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from) {
      onDateChange(range.from, range.to ?? range.from);
    }
  }, [onDateChange]);

  const handleClear = useCallback(() => {
    setPreset("all");
    setShowCustom(false);
    setCustomRange(undefined);
    onDateChange(undefined, undefined);
  }, [onDateChange]);

  const displayLabel = useMemo(() => {
    if (preset === "all") return null;
    if (preset === "custom" && dateFrom) {
      const fromStr = format(dateFrom, "dd/MM/yy", { locale: es });
      const toStr = dateTo ? format(dateTo, "dd/MM/yy", { locale: es }) : fromStr;
      return `${fromStr} – ${toStr}`;
    }
    return presets.find((p) => p.value === preset)?.label ?? null;
  }, [preset, dateFrom, dateTo]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={showCustom} onOpenChange={setShowCustom}>
        <div className="flex items-center gap-1">
          <Select value={preset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-9 text-sm w-[200px]">
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <span className="truncate">
                {displayLabel ?? "Periodo"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {preset !== "all" && (
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={handleClear}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <PopoverTrigger asChild>
          <span className="hidden" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={customRange}
            onSelect={handleCustomRangeSelect}
            numberOfMonths={2}
            locale={es}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
