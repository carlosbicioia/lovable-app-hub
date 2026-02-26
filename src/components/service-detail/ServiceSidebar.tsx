import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin, Building2, Clock, AlertTriangle, PenLine, CheckCircle2 } from "lucide-react";
import type { Service } from "@/types/urbango";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  service: Service;
}

export default function ServiceSidebar({ service }: Props) {
  const npsNeedsReview = service.nps !== null && service.nps < 7;
  const isFinalized = service.status === "Finalizado" || service.status === "Liquidado";

  return (
    <div className="space-y-6">
      {/* NPS Warning */}
      {npsNeedsReview && isFinalized && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-card-foreground">Revisión NPS requerida</p>
                <p className="text-xs text-muted-foreground mt-1">
                  NPS {service.nps}/10 — Por protocolo, puntuaciones inferiores al estándar requieren revisión del gestor antes del cierre definitivo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" /> Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-card-foreground">{service.clientName}</p>
            <p className="text-xs text-muted-foreground">{service.clientId}</p>
          </div>
          {service.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{service.address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collaborator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" /> Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent>
          {service.collaboratorName ? (
            <div>
              <p className="text-sm font-medium text-card-foreground">{service.collaboratorName}</p>
              <p className="text-xs text-muted-foreground">{service.collaboratorId}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sin colaborador (directo)</p>
          )}
        </CardContent>
      </Card>

      {/* Operator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" /> Técnico asignado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {service.operatorName ? (
            <div>
              <p className="text-sm font-medium text-card-foreground">{service.operatorName}</p>
              <p className="text-xs text-muted-foreground">{service.operatorId} · Cluster {service.clusterId}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sin técnico asignado</p>
          )}
        </CardContent>
      </Card>

      {/* Budget & Liquidation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presupuesto y Liquidación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tipo</span>
            <span className="text-sm font-medium text-card-foreground">
              {service.serviceType === "Presupuesto" ? "Con presupuesto" : "Reparación directa"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estado</span>
            {service.budgetStatus ? (
              <span className={cn(
                "text-sm font-medium",
                service.budgetStatus === "Aprobado" ? "text-success" :
                service.budgetStatus === "Pendiente" ? "text-warning" :
                service.budgetStatus === "Rechazado" ? "text-destructive" : "text-muted-foreground"
              )}>
                {service.budgetStatus}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Importe</span>
            <span className="text-lg font-bold text-card-foreground">
              {service.budgetTotal ? `€${service.budgetTotal.toLocaleString()}` : "—"}
            </span>
          </div>
          {service.realHours !== null && service.realHours !== undefined && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Horas reales
              </span>
              <span className="text-sm font-bold text-card-foreground">{service.realHours}h</span>
            </div>
          )}
          {service.nps !== null && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">NPS</span>
              <span className={cn(
                "text-sm font-bold",
                service.nps >= 9 ? "text-success" :
                service.nps >= 7 ? "text-warning" : "text-destructive"
              )}>
                {service.nps}/10
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Signature */}
      <Card className={service.signatureUrl ? "border-success/30" : "border-dashed border-muted-foreground/30"}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4 text-muted-foreground" /> Firma del cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {service.signatureUrl ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3 flex items-center justify-center">
                <img
                  src={service.signatureUrl}
                  alt="Firma del cliente"
                  className="max-h-24 w-auto object-contain"
                />
              </div>
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Conformidad del cliente</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                {service.signedBy && <p>Firmado por: {service.signedBy}</p>}
                {service.signedAt && (
                  <p>Fecha: {format(new Date(service.signedAt), "dd MMM yyyy · HH:mm", { locale: es })}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 space-y-2">
              <PenLine className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">Pendiente de firma</p>
              <p className="text-xs text-muted-foreground">
                La firma se captura desde la app del operario al finalizar el servicio
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
