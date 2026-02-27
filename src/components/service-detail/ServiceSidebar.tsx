import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin, Building2, Clock, AlertTriangle, PenLine, CheckCircle2, FileText } from "lucide-react";
import type { Service } from "@/types/urbango";
import { useBudgets } from "@/hooks/useBudgets";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Props {
  service: Service;
}

export default function ServiceSidebar({ service }: Props) {
  const navigate = useNavigate();
  const { budgets } = useBudgets();
  const linkedBudget = budgets.find((b) => b.serviceId === service.id);
  const npsNeedsReview = service.nps !== null && service.nps < 7;
  const isFinalized = service.status === "Finalizado" || service.status === "Liquidado";

  // Compute budget total from lines
  const budgetTotal = linkedBudget
    ? linkedBudget.lines.reduce((acc, l) => {
        const salePrice = Math.round(l.costPrice * (1 + l.margin / 100) * 100) / 100;
        const lineSubtotal = Math.round(salePrice * l.units * 100) / 100;
        const lineTax = Math.round(lineSubtotal * (l.taxRate / 100) * 100) / 100;
        return acc + lineSubtotal + lineTax;
      }, 0)
    : null;

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
          {linkedBudget ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nº Presupuesto</span>
                <button
                  onClick={() => navigate(`/presupuestos/${linkedBudget.id}`)}
                  className="text-sm font-medium text-primary hover:underline cursor-pointer"
                >
                  {linkedBudget.id}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Importe total</span>
                <span className="text-sm font-bold text-card-foreground">
                  {budgetTotal !== null ? `${budgetTotal.toFixed(2)} €` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado presupuesto</span>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                  linkedBudget.status === "Aprobado" ? "bg-success/15 text-success border-success/30" :
                  linkedBudget.status === "Enviado" ? "bg-info/15 text-info border-info/30" :
                  linkedBudget.status === "Borrador" ? "bg-warning/15 text-warning border-warning/30" :
                  linkedBudget.status === "Rechazado" ? "bg-destructive/15 text-destructive border-destructive/30" :
                  linkedBudget.status === "Finalizado" ? "bg-success/15 text-success border-success/30" :
                  linkedBudget.status === "Pte_Facturación" ? "bg-info/15 text-info border-info/30" :
                  "bg-muted text-muted-foreground border-border"
                )}>
                  {linkedBudget.status === "Pte_Facturación" ? "Pte. Facturación" : linkedBudget.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado servicio</span>
                <span className="text-sm font-medium text-card-foreground">
                  {service.status.replace(/_/g, " ")}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-3">
              <FileText className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {service.serviceType === "Presupuesto" ? "Sin presupuesto vinculado" : "Reparación directa"}
              </p>
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
