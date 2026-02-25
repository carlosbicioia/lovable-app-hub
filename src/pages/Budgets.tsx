import { Search, Plus, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { BudgetStatus } from "@/types/urbango";
import { useBudgets } from "@/hooks/useBudgets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const statusConfig: Record<BudgetStatus, { label: string; className: string }> = {
  Borrador: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  Enviado: { label: "Enviado", className: "bg-info/15 text-info" },
  Aprobado: { label: "Aprobado", className: "bg-success/15 text-success" },
  Rechazado: { label: "Rechazado", className: "bg-destructive/15 text-destructive" },
  Pte_Facturación: { label: "Pte. Facturación", className: "bg-warning/15 text-warning" },
};

const allStatuses: BudgetStatus[] = ["Borrador", "Enviado", "Aprobado", "Rechazado", "Pte_Facturación"];

function calcBudgetTotals(lines: { costPrice: number; margin: number; units: number; taxRate: number }[]) {
  let subtotal = 0;
  let totalTax = 0;
  for (const l of lines) {
    const salePrice = l.costPrice * (1 + l.margin / 100);
    const lineTotal = salePrice * l.units;
    subtotal += lineTotal;
    totalTax += lineTotal * (l.taxRate / 100);
  }
  return { subtotal, totalTax, total: subtotal + totalTax };
}

export default function Budgets() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { budgets, updateBudgetStatus } = useBudgets();

  const filtered = budgets.filter(
    (b) =>
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.clientName.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceId.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (budgetId: string, newStatus: BudgetStatus) => {
    updateBudgetStatus(budgetId, newStatus);
    toast.success(`Estado actualizado a "${statusConfig[newStatus].label}"`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Presupuestos</h1>
          <p className="text-muted-foreground text-sm mt-1">{budgets.length} presupuestos</p>
        </div>
        <Button onClick={() => navigate("/presupuestos/nuevo")}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Presupuesto
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID, cliente o servicio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Nº Presupuesto</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Servicio</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Cliente</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Colaborador</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Subtotal</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">IVA</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const { subtotal, totalTax, total } = calcBudgetTotals(b.lines);
                const cfg = statusConfig[b.status];
                return (
                  <tr
                    key={b.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td
                      className="px-5 py-3 font-mono text-xs text-muted-foreground cursor-pointer"
                      onClick={() => navigate(`/presupuestos/${b.id}`)}
                    >
                      {b.id}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground cursor-pointer" onClick={() => navigate(`/presupuestos/${b.id}`)}>{b.serviceId}</td>
                    <td className="px-5 py-3 font-medium text-card-foreground cursor-pointer" onClick={() => navigate(`/presupuestos/${b.id}`)}>{b.clientName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{b.collaboratorName ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {format(new Date(b.createdAt), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <Select value={b.status} onValueChange={(v) => handleStatusChange(b.id, v as BudgetStatus)}>
                        <SelectTrigger className={cn("h-7 w-[140px] text-xs font-medium border-0", cfg.className)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allStatuses.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {statusConfig[s].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-5 py-3 text-right text-card-foreground">{subtotal.toFixed(2)} €</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{totalTax.toFixed(2)} €</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{total.toFixed(2)} €</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
