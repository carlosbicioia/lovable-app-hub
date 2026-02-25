import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { BudgetProvider } from "@/hooks/useBudgets";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Collaborators from "@/pages/Collaborators";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Budgets from "@/pages/Budgets";
import BudgetDetail from "@/pages/BudgetDetail";
import BudgetCreate from "@/pages/BudgetCreate";
import Articles from "@/pages/Articles";
import CalendarView from "@/pages/CalendarView";
import Operators from "@/pages/Operators";
import ServiceCreate from "@/pages/ServiceCreate";
import Settings from "@/pages/Settings";
import Auth from "@/pages/Auth";
import CollaboratorPortal from "@/pages/CollaboratorPortal";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, isCollaborator } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // Collaborator role → restricted portal
  if (isCollaborator) {
    return (
      <Routes>
        <Route path="/" element={<CollaboratorPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Full app for admin/gestor/operario
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/colaboradores" element={<Collaborators />} />
        <Route path="/servicios" element={<Services />} />
        <Route path="/servicios/nuevo" element={<ServiceCreate />} />
        <Route path="/servicios/:id" element={<ServiceDetail />} />
        <Route path="/presupuestos" element={<Budgets />} />
        <Route path="/presupuestos/nuevo" element={<BudgetCreate />} />
        <Route path="/presupuestos/:id" element={<BudgetDetail />} />
        <Route path="/articulos" element={<Articles />} />
        <Route path="/calendario" element={<CalendarView />} />
        <Route path="/operarios" element={<Operators />} />
        <Route path="/configuracion" element={<Settings />} />
      </Route>
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BudgetProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </BudgetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
