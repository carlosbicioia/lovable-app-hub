import { useServiceAuditLog } from "@/hooks/useServiceAuditLog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Loader2, History, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface Props {
  serviceId: string;
}

export default function ServiceHistory({ serviceId }: Props) {
  const { data: logs = [], isLoading } = useServiceAuditLog(serviceId);
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());

  // Group logs by day
  const grouped = useMemo(() => {
    const map = new Map<string, typeof logs>();
    for (const entry of logs) {
      const day = format(new Date(entry.created_at), "yyyy-MM-dd");
      const arr = map.get(day) ?? [];
      arr.push(entry);
      map.set(day, arr);
    }
    return Array.from(map.entries()); // already sorted desc from query
  }, [logs]);

  // Auto-open the most recent day
  useMemo(() => {
    if (grouped.length > 0 && openDays.size === 0) {
      setOpenDays(new Set([grouped[0][0]]));
    }
  }, [grouped]);

  const toggleDay = (day: string) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          Historial de cambios
          {logs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
              {logs.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay registros de cambios aún
          </p>
        ) : (
          <div className="space-y-2">
            {grouped.map(([day, entries]) => {
              const isOpen = openDays.has(day);
              const dayLabel = format(new Date(day), "EEEE, dd MMM yyyy", { locale: es });

              return (
                <Collapsible key={day} open={isOpen} onOpenChange={() => toggleDay(day)}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
                    <span className="text-xs font-semibold capitalize text-foreground">
                      {dayLabel}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {entries.length} {entries.length === 1 ? "cambio" : "cambios"}
                      </span>
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="relative ml-2 mt-1 mb-1">
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                      {entries.map((entry) => (
                        <div key={entry.id} className="relative flex gap-3 py-2 group">
                          <div className="relative z-10 mt-1.5 w-[15px] h-[15px] rounded-full border-2 border-primary bg-background shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-snug">{entry.action}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(entry.created_at), "HH:mm", { locale: es })}</span>
                              <span>·</span>
                              <span className="font-medium text-foreground/70">
                                {entry.user_email || "Sistema"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
