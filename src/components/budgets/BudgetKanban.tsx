import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2 } from "lucide-react";
import type { Budget, BudgetStatus } from "@/types/urbango";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const columns: { status: BudgetStatus; label: string; color: string }[] = [
  { status: "Borrador", label: "Borrador", color: "border-t-muted-foreground" },
  { status: "Enviado", label: "Enviado", color: "border-t-info" },
  { status: "Aprobado", label: "Aprobado", color: "border-t-success" },
  { status: "Rechazado", label: "Rechazado", color: "border-t-destructive" },
  { status: "Pte_Facturación", label: "En proceso", color: "border-t-warning" },
  { status: "Finalizado", label: "Finalizado", color: "border-t-primary" },
];

function calcTotal(lines: { costPrice: number; margin: number; units: number; taxRate: number }[]) {
  let total = 0;
  for (const l of lines) {
    const sale = l.costPrice * (1 + l.margin / 100);
    total += sale * l.units * (1 + l.taxRate / 100);
  }
  return total;
}

interface BudgetKanbanProps {
  budgets: Budget[];
  onStatusChange: (budgetId: string, newStatus: BudgetStatus) => void;
}

export default function BudgetKanban({ budgets, onStatusChange }: BudgetKanbanProps) {
  const navigate = useNavigate();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<BudgetStatus | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await supabase.from("budget_lines").delete().eq("budget_id", budgetId);
      const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
      if (error) throw error;
      toast.success("Presupuesto eliminado");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar presupuesto");
    } finally {
      setDeletingBudgetId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, budgetId: string) => {
    setDraggedId(budgetId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", budgetId);
  };

  const handleDragOver = (e: React.DragEvent, status: BudgetStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverColumn(status);
  };

  const handleDragLeave = () => {
    setOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: BudgetStatus) => {
    e.preventDefault();
    const budgetId = e.dataTransfer.getData("text/plain");
    if (budgetId) {
      const budget = budgets.find((b) => b.id === budgetId);
      if (budget && budget.status !== status) {
        onStatusChange(budgetId, status);
      }
    }
    setDraggedId(null);
    setOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setOverColumn(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
      {columns.map((col) => {
        const items = budgets.filter((b) => b.status === col.status);
        const isOver = overColumn === col.status;
        return (
          <div
            key={col.status}
            className={cn(
              "flex-1 min-w-[220px] max-w-[280px] rounded-xl border border-border bg-muted/20 border-t-4 flex flex-col transition-colors",
              col.color,
              isOver && "bg-accent/30 border-accent"
            )}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            {/* Header */}
            <div className="px-3 py-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{col.label}</span>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto">
              {items.map((b) => {
                const total = calcTotal(b.lines);
                const isDragging = draggedId === b.id;
                return (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, b.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => navigate(`/presupuestos/${b.id}`)}
                    className={cn(
                      "bg-card rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
                      isDragging && "opacity-40 scale-95"
                    )}
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-muted-foreground">{b.id}</p>
                        <p className="text-sm font-medium text-card-foreground truncate mt-0.5">
                          {b.clientName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{b.serviceName || b.serviceId}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(b.createdAt), "dd MMM", { locale: es })}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-card-foreground">
                              {total.toFixed(0)} €
                            </span>
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); setDeletingBudgetId(b.id); }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Eliminar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Sin presupuestos
                </div>
              )}
            </div>
          </div>
        );
      })}
      <AlertDialog open={!!deletingBudgetId} onOpenChange={(open) => { if (!open) setDeletingBudgetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán el presupuesto y todas sus líneas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingBudgetId && handleDeleteBudget(deletingBudgetId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
