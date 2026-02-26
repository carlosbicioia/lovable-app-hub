import { Search, Plus, FileText, Receipt, Loader2, CheckCircle2, List, Columns3 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BudgetKanban from "@/components/budgets/BudgetKanban";

const statusConfig: Record<BudgetStatus, { label: string; className: string }> = {
  Borrador: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  Enviado: { label: "Enviado", className: "bg-info/15 text-info" },
  Aprobado: { label: "Aprobado", className: "bg-success/15 text-success" },
  Rechazado: { label: "Rechazado", className: "bg-destructive/15 text-destructive" },
  Pte_Facturación: { label: "Pte. Facturación", className: "bg-warning/15 text-warning" },
  Finalizado: { label: "Finalizado", className: "bg-primary/15 text-primary" },
};

const allStatuses: BudgetStatus[] = ["Borrador", "Enviado", "Aprobado", "Rechazado", "Pte_Facturación", "Finalizado"];

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

  const [sendingProforma, setSendingProforma] = useState<string | null>(null);

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

  const handleMarkProformaPaid = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from("budgets")
        .update({ proforma_paid: true, proforma_paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", budgetId);
      if (error) throw error;
      toast.success("Proforma marcada como pagada");
    } catch (err: any) {
      toast.error(err.message || "Error al marcar proforma como pagada");
    }
  };

  const handleSendProforma = async (budget: typeof budgets[0]) => {
    setSendingProforma(budget.id);
    try {
      const { data, error } = await supabase.functions.invoke("export-holded", {
        body: {
          services: [{ id: budget.serviceId, clientName: budget.clientName, clientId: "", budgetTotal: null, specialty: "", description: budget.serviceName }],
          budgets: [budget],
          type: "proforma",
          percentage: 50,
        },
      });
      if (error) throw error;
      toast.success(`Proforma del 50% enviada a Holded para ${budget.id}`);
    } catch (err: any) {
      console.error("Error sending proforma:", err);
      toast.error(err.message || "Error al enviar proforma a Holded");
    } finally {
      setSendingProforma(null);
    }
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

      <Tabs defaultValue="list" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por ID, cliente o servicio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <TabsList className="ml-auto">
            <TabsTrigger value="list" className="gap-1.5"><List className="w-4 h-4" /> Lista</TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1.5"><Columns3 className="w-4 h-4" /> Kanban</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list">
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
                    <th className="text-center px-5 py-3 text-muted-foreground font-medium">Acciones</th>
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
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {b.status === "Aprobado" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                disabled={sendingProforma === b.id}
                                onClick={(e) => { e.stopPropagation(); handleSendProforma(b); }}
                              >
                                {sendingProforma === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Receipt className="w-3 h-3" />}
                                Proforma 50%
                              </Button>
                            )}
                            {b.proformaPaid ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                                <CheckCircle2 className="w-3 h-3" /> Pagada
                              </span>
                            ) : (b.status === "Aprobado" || b.status === "Pte_Facturación" || b.status === "Finalizado") ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs gap-1 text-muted-foreground"
                                onClick={(e) => { e.stopPropagation(); handleMarkProformaPaid(b.id); }}
                              >
                                Marcar pagada
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <BudgetKanban budgets={filtered} onStatusChange={handleStatusChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
