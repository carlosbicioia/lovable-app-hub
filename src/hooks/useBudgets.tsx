import React, { createContext, useContext, useState, useCallback } from "react";
import type { Budget, BudgetStatus } from "@/types/urbango";
import { mockBudgets } from "@/data/mockData";

interface BudgetContextValue {
  budgets: Budget[];
  addBudget: (budget: Budget) => void;
  updateBudgetStatus: (budgetId: string, status: BudgetStatus) => void;
  getBudget: (id: string) => Budget | undefined;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>(() => [...mockBudgets]);

  const addBudget = useCallback((budget: Budget) => {
    setBudgets((prev) => [budget, ...prev]);
  }, []);

  const updateBudgetStatus = useCallback((budgetId: string, status: BudgetStatus) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, status } : b))
    );
  }, []);

  const getBudget = useCallback(
    (id: string) => budgets.find((b) => b.id === id),
    [budgets]
  );

  return (
    <BudgetContext.Provider value={{ budgets, addBudget, updateBudgetStatus, getBudget }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudgets must be used within BudgetProvider");
  return ctx;
}
