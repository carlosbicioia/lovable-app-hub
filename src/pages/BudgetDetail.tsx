import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { BudgetStatus } from "@/types/urbango";
import { toast } from "@/hooks/use-toast";
import { useBudgets } from "@/hooks/useBudgets";
import CompanyLogo from "@/components/shared/CompanyLogo";
import { useCompanySettings } from "@/hooks/useCompanySettings";

const statusConfig: Record<BudgetStatus, { label: string; className: string }> = {
  Borrador: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  Enviado: { label: "Enviado", className: "bg-info/15 text-info" },
  Aprobado: { label: "Aprobado", className: "bg-success/15 text-success" },
  Rechazado: { label: "Rechazado", className: "bg-destructive/15 text-destructive" },
  Pte_Facturación: { label: "En proceso", className: "bg-warning/15 text-warning" },
  Finalizado: { label: "Finalizado", className: "bg-primary/15 text-primary" },
};

export default function BudgetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBudget } = useBudgets();
  const { data: companySettings } = useCompanySettings();
  const budget = getBudget(id ?? "");

  if (!budget) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Presupuesto no encontrado</p>
        <Button variant="outline" onClick={() => navigate("/presupuestos")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const lines = budget.lines.map((l) => {
    const salePrice = l.costPrice * (1 + l.margin / 100);
    const lineSubtotal = salePrice * l.units;
    return { ...l, salePrice, lineSubtotal };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineSubtotal, 0);
  const taxGroups: Record<number, number> = {};
  for (const l of lines) {
    const tax = l.lineSubtotal * (l.taxRate / 100);
    taxGroups[l.taxRate] = (taxGroups[l.taxRate] || 0) + tax;
  }
  const totalTax = Object.values(taxGroups).reduce((s, v) => s + v, 0);
  const total = subtotal + totalTax;

  const cfg = statusConfig[budget.status];

  const handleSendEmail = () => {
    toast({
      title: "Presupuesto enviado",
      description: `El presupuesto ${budget.id} se ha enviado por email correctamente.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/presupuestos")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-foreground">{budget.id}</h1>
          <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", cfg.className)}>
            {cfg.label}
          </span>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir
        </Button>
        <Button onClick={handleSendEmail}>
          <Send className="w-4 h-4 mr-2" /> Enviar por email
        </Button>
      </div>

      {/* Budget document */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-8 max-w-4xl mx-auto print:shadow-none print:border-0 print:p-0">
        <div className="flex justify-between items-start mb-8">
          <CompanyLogo size="lg" className="rounded-lg" fallback={
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">
              URBAN<span className="text-primary">GO</span>
            </h2>
          } />
          <div className="text-right text-sm text-muted-foreground">
            <p className="font-medium text-card-foreground">{companySettings?.company_name || "Urban Reworks SL"}</p>
            <p>{companySettings?.tax_id || "B56528722"}</p>
            <p>{companySettings?.address || "Rambla Aragó 31, bj 2"}</p>
          </div>
        </div>

        <div className="border-t border-border my-6" />

        <div className="flex justify-between mb-6">
          <div>
            <p className="font-bold text-card-foreground text-sm">PRESUPUESTO {budget.id}</p>
            <p className="text-sm text-muted-foreground mt-1">Servicio: {budget.serviceId}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Fecha: {format(new Date(budget.createdAt), "dd/MM/yyyy", { locale: es })}
          </p>
        </div>

        <div className="mb-6">
          <p className="font-bold text-card-foreground text-sm">{budget.collaboratorName || budget.clientName}</p>
          <p className="text-sm text-muted-foreground">{budget.clientAddress}</p>
        </div>

        <div className="border-t border-border my-4" />

        <div className="mb-6">
          <p className="text-sm font-semibold text-card-foreground">Descripción del Servicio</p>
          <p className="text-sm text-muted-foreground mt-1">{budget.serviceName}</p>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="text-left py-2 font-bold text-card-foreground">CONCEPTO</th>
              <th className="text-center py-2 font-bold text-card-foreground">UNIDADES</th>
              <th className="text-right py-2 font-bold text-card-foreground">PRECIO</th>
              <th className="text-right py-2 font-bold text-card-foreground">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id} className="border-b border-border">
                <td className="py-2 text-card-foreground">
                  <div>{l.concept}</div>
                  {l.description && <div className="text-xs text-muted-foreground">{l.description}</div>}
                </td>
                <td className="py-2 text-center text-muted-foreground">{l.units.toFixed(2)}</td>
                <td className="py-2 text-right text-muted-foreground">{l.salePrice.toFixed(2)} €</td>
                <td className="py-2 text-right text-card-foreground font-medium">{l.lineSubtotal.toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-card-foreground">Subtotal:</span>
              <span className="text-card-foreground font-medium">{subtotal.toFixed(2)} €</span>
            </div>
            {Object.entries(taxGroups).map(([rate, amount]) => (
              <div key={rate} className="flex justify-between">
                <span className="text-muted-foreground">IVA ({rate}%)</span>
                <span className="text-muted-foreground">{(amount as number).toFixed(2)} €</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-foreground pt-1">
              <span className="font-bold text-card-foreground">TOTAL:</span>
              <span className="font-bold text-card-foreground">{total.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {budget.termsAndConditions && (
          <div className="mt-10 border-t border-border pt-4">
            <p className="text-sm font-bold text-card-foreground mb-2">Términos y Condiciones</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{budget.termsAndConditions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
