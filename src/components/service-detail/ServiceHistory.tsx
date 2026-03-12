import { useServiceAuditLog } from "@/hooks/useServiceAuditLog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Loader2, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  serviceId: string;
}

export default function ServiceHistory({ serviceId }: Props) {
  const { data: logs = [], isLoading } = useServiceAuditLog(serviceId);

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
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

            {logs.map((entry) => (
              <div key={entry.id} className="relative flex gap-3 py-2.5 group">
                <div className="relative z-10 mt-1.5 w-[15px] h-[15px] rounded-full border-2 border-primary bg-background shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{entry.action}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {format(new Date(entry.created_at), "dd MMM yyyy · HH:mm", { locale: es })}
                    </span>
                    <span>·</span>
                    <span className="font-medium text-foreground/70">
                      {entry.user_email || "Sistema"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
