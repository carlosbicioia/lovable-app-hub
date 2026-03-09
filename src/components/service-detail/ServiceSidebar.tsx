import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin, Building2, Clock, AlertTriangle, PenLine, CheckCircle2, FileText, Wrench } from "lucide-react";
import type { Service } from "@/types/urbango";
import { useBudgets } from "@/hooks/useBudgets";
import { useOperators } from "@/hooks/useOperators";
import { useCollaborators } from "@/hooks/useCollaborators";
import { useServices } from "@/hooks/useServices";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Props {
  service: Service;
}

export default function ServiceSidebar({ service }: Props) {
  const navigate = useNavigate();
  const { budgets } = useBudgets();
  const { data: operators = [] } = useOperators();
  const { collaborators } = useCollaborators();
  const { updateService } = useServices();
  const [savingField, setSavingField] = useState<string | null>(null);
  const linkedBudget = budgets.find((b) => b.serviceId === service.id);
  const npsNeedsReview = service.nps !== null && service.nps < 7;
  const isFinalized = service.status === "Finalizado" || service.status === "Liquidado";

  const availableOperators = operators.filter((o) => o.status === "Activo" && o.available);
  const currentOp = service.operatorId ? operators.find((o) => o.id === service.operatorId) : null;
  const operatorOptions = currentOp && !availableOperators.find((o) => o.id === currentOp.id)
    ? [currentOp, ...availableOperators]
    : availableOperators;

  const handleUpdate = async (field: string, value: string | null) => {
    setSavingField(field);
    const updates: Record<string, any> = { [field]: value };
    if (field === "operator_id") {
      const op = operators.find((o) => o.id === value);
      updates.operator_name = op?.name ?? null;
    }
    if (field === "collaborator_id") {
      const col = collaborators.find((c) => c.id === value);
      updates.collaborator_name = col?.companyName ?? null;
    }
    await updateService(service.id, updates);
    setSavingField(null);
  };

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
          <SearchableSelect
            options={[
              { value: "none", label: "Sin colaborador" },
              ...collaborators.map((c) => ({
                value: c.id,
                label: c.companyName,
                subtitle: c.contactPerson,
                searchText: `${c.email} ${c.phone}`,
              })),
            ]}
            value={service.collaboratorId ?? "none"}
            onValueChange={(v) => handleUpdate("collaborator_id", v === "none" ? null : v)}
            placeholder="Seleccionar colaborador…"
            searchPlaceholder="Buscar colaborador…"
            emptyText="Sin colaboradores"
            disabled={savingField === "collaborator_id"}
          />
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
          <SearchableSelect
            options={[
              { value: "none", label: "Sin asignar" },
              ...operatorOptions.map((o) => ({
                value: o.id,
                label: o.name,
                subtitle: o.specialty,
                searchText: `${o.dni} ${o.email}`,
              })),
            ]}
            value={service.operatorId ?? "none"}
            onValueChange={(v) => handleUpdate("operator_id", v === "none" ? null : v)}
            placeholder="Seleccionar técnico…"
            searchPlaceholder="Buscar técnico…"
            emptyText="Sin técnicos disponibles"
            disabled={savingField === "operator_id"}
          />
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
              {service.serviceType === "Presupuesto" && (
                <button
                  onClick={() => navigate(`/presupuestos/nuevo?serviceId=${service.id}`)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Crear presupuesto
                </button>
              )}
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
