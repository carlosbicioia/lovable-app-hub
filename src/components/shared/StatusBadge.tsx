import { cn } from "@/lib/utils";
import type { ServiceStatus, UrgencyLevel } from "@/types/urbango";

const statusConfig: Record<ServiceStatus, { label: string; className: string }> = {
  Pte_Aceptacion: { label: "Pte. Aceptación", className: "bg-chart-5/15 text-chart-5 border-chart-5/30" },
  Pendiente_Contacto: { label: "Pte. Contacto", className: "bg-warning/15 text-warning border-warning/30" },
  Pte_Asignacion: { label: "Pte. Asignación", className: "bg-accent/15 text-accent-foreground border-accent/30" },
  Asignado: { label: "Asignado", className: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
  Agendado: { label: "Agendado", className: "bg-info/15 text-info border-info/30" },
  En_Curso: { label: "En Curso", className: "bg-primary/15 text-primary border-primary/30" },
  Finalizado: { label: "Finalizado", className: "bg-success/15 text-success border-success/30" },
  Liquidado: { label: "Liquidado", className: "bg-muted text-muted-foreground border-border" },
};

const urgencyConfig: Record<UrgencyLevel, { label: string; className: string }> = {
  Estándar: { label: "Estándar", className: "bg-muted text-muted-foreground border-border" },
  "24h": { label: "24h", className: "bg-warning/15 text-warning border-warning/30" },
  Inmediato: { label: "Urgente", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

interface StatusBadgeProps {
  status?: ServiceStatus;
  urgency?: UrgencyLevel;
  className?: string;
}

export default function StatusBadge({ status, urgency, className }: StatusBadgeProps) {
  const config = status ? statusConfig[status] : urgency ? urgencyConfig[urgency] : null;
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
