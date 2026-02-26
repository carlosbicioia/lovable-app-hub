import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Budget, BudgetStatus, BudgetLine, TaxRate } from "@/types/urbango";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BudgetContextValue {
  budgets: Budget[];
  loading: boolean;
  addBudget: (budget: Budget) => Promise<void>;
  updateBudgetStatus: (budgetId: string, status: BudgetStatus) => Promise<void>;
  getBudget: (id: string) => Budget | undefined;
  refetch: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

function mapDbToBudget(row: any, lines: any[]): Budget {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    clientName: row.client_name,
    clientAddress: row.client_address,
    collaboratorName: row.collaborator_name,
    createdAt: row.created_at,
    status: row.status as BudgetStatus,
    termsAndConditions: row.terms_and_conditions,
    proformaPaid: row.proforma_paid ?? false,
    proformaPaidAt: row.proforma_paid_at ?? null,
    lines: lines
      .filter((l) => l.budget_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((l) => ({
        id: l.id,
        concept: l.concept,
        description: l.description ?? "",
        units: Number(l.units),
        costPrice: Number(l.cost_price),
        margin: Number(l.margin),
        taxRate: Number(l.tax_rate) as TaxRate,
      })),
  };
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    const [{ data: rows }, { data: lines }] = await Promise.all([
      supabase.from("budgets").select("*").order("created_at", { ascending: false }),
      supabase.from("budget_lines").select("*"),
    ]);
    if (rows && lines) {
      setBudgets(rows.map((r) => mapDbToBudget(r, lines)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBudgets();

    const channel = supabase
      .channel("budgets-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets" }, () => {
        fetchBudgets();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchBudgets]);

  const addBudget = useCallback(async (budget: Budget) => {
    // Optimistic
    setBudgets((prev) => [budget, ...prev]);

    const { error } = await supabase.from("budgets").insert({
      id: budget.id,
      service_id: budget.serviceId,
      service_name: budget.serviceName,
      client_name: budget.clientName,
      client_address: budget.clientAddress,
      collaborator_name: budget.collaboratorName,
      status: budget.status,
      terms_and_conditions: budget.termsAndConditions,
      created_at: budget.createdAt,
    });

    if (error) {
      toast.error("Error al guardar presupuesto");
      setBudgets((prev) => prev.filter((b) => b.id !== budget.id));
      return;
    }

    if (budget.lines.length > 0) {
      await supabase.from("budget_lines").insert(
        budget.lines.map((l, i) => ({
          budget_id: budget.id,
          concept: l.concept,
          description: l.description || null,
          units: l.units,
          cost_price: l.costPrice,
          margin: l.margin,
          tax_rate: l.taxRate,
          sort_order: i,
        }))
      );
    }

    await fetchBudgets();
  }, [fetchBudgets]);

  const updateBudgetStatus = useCallback(async (budgetId: string, status: BudgetStatus) => {
    // Optimistic
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, status } : b))
    );

    const { error } = await supabase
      .from("budgets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", budgetId);

    if (error) {
      toast.error("Error al actualizar estado");
      await fetchBudgets();
    }
  }, [fetchBudgets]);

  const getBudget = useCallback(
    (id: string) => budgets.find((b) => b.id === id),
    [budgets]
  );

  return (
    <BudgetContext.Provider value={{ budgets, loading, addBudget, updateBudgetStatus, getBudget, refetch: fetchBudgets }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudgets must be used within BudgetProvider");
  return ctx;
}
