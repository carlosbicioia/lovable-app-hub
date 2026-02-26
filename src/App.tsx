import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { BudgetProvider } from "@/hooks/useBudgets";
import { ServiceProvider } from "@/hooks/useServices";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Collaborators from "@/pages/Collaborators";
import CollaboratorDetail from "@/pages/CollaboratorDetail";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Budgets from "@/pages/Budgets";
import BudgetDetail from "@/pages/BudgetDetail";
import BudgetCreate from "@/pages/BudgetCreate";
import Articles from "@/pages/Articles";
import CalendarView from "@/pages/CalendarView";
import Operators from "@/pages/Operators";
import Purchases from "@/pages/Purchases";
import PurchaseCreate from "@/pages/PurchaseCreate";
import PurchaseDetail from "@/pages/PurchaseDetail";
import Suppliers from "@/pages/Suppliers";
import ServiceCreate from "@/pages/ServiceCreate";
import ServiceEdit from "@/pages/ServiceEdit";
import Settings from "@/pages/Settings";
import Auth from "@/pages/Auth";
import CollaboratorPortal from "@/pages/CollaboratorPortal";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Profile from "@/pages/Profile";
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
        <Route path="/colaboradores/:id" element={<CollaboratorDetail />} />
        <Route path="/servicios" element={<Services />} />
        <Route path="/servicios/nuevo" element={<ServiceCreate />} />
        <Route path="/servicios/:id" element={<ServiceDetail />} />
        <Route path="/servicios/:id/editar" element={<ServiceEdit />} />
        <Route path="/presupuestos" element={<Budgets />} />
        <Route path="/presupuestos/nuevo" element={<BudgetCreate />} />
        <Route path="/presupuestos/:id" element={<BudgetDetail />} />
        <Route path="/articulos" element={<Articles />} />
        <Route path="/compras" element={<Purchases />} />
        <Route path="/compras/nueva" element={<PurchaseCreate />} />
        <Route path="/compras/:id" element={<PurchaseDetail />} />
        <Route path="/proveedores" element={<Suppliers />} />
        <Route path="/calendario" element={<CalendarView />} />
        <Route path="/operarios" element={<Operators />} />
        <Route path="/configuracion" element={<Settings />} />
        <Route path="/perfil" element={<Profile />} />
      </Route>
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <BudgetProvider>
              <ServiceProvider>
                <AppRoutes />
              </ServiceProvider>
            </BudgetProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
