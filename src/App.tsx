import { useEffect, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { BudgetProvider } from "@/hooks/useBudgets";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

import {
  Dashboard, AdvancedDashboard, Clients, Collaborators, CollaboratorDetail,
  Services, ServiceDetail, ServiceCreate, ServiceEdit,
  Budgets, BudgetDetail, BudgetCreate, BudgetEdit,
  Articles, InvoiceCreate, CalendarView, Operators,
  Purchases, PurchaseCreate, PurchaseDetail, DeliveryNoteCreate,
  SalesOrders, Suppliers, Vehicles, Settings, Profile,
  ReportsIndex, ServicesReport, OperatorsReport, FinancialReport,
  ClientsReport, PurchasesReport, BudgetsReport,
  Auth, CollaboratorPortal, TvDashboard, ResetPassword, NotFound,
} from "@/routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,        // 1 min — avoid refetch storms on navigation
      gcTime: 5 * 60_000,       // 5 min garbage-collection window
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

function AppRoutes() {
  const { user, loading, isCollaborator, roles } = useAuth();

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

  if (isCollaborator) {
    return (
      <Routes>
        <Route path="/" element={<CollaboratorPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (roles.includes("pantalla")) {
    return (
      <Routes>
        <Route path="/" element={<TvDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const P = ProtectedRoute;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Open to all authenticated */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/servicios/nuevo" element={<ServiceCreate />} />
          <Route path="/servicios/:id" element={<ServiceDetail />} />
          <Route path="/servicios/:id/editar" element={<ServiceEdit />} />
          <Route path="/presupuestos" element={<Budgets />} />
          <Route path="/presupuestos/nuevo" element={<BudgetCreate />} />
          <Route path="/presupuestos/:id" element={<BudgetDetail />} />
          <Route path="/presupuestos/:id/editar" element={<BudgetEdit />} />
          <Route path="/articulos" element={<Articles />} />
          <Route path="/compras" element={<Purchases />} />
          <Route path="/compras/nueva" element={<PurchaseCreate />} />
          <Route path="/compras/albaran/nuevo" element={<DeliveryNoteCreate />} />
          <Route path="/compras/factura/nueva" element={<InvoiceCreate />} />
          <Route path="/compras/:id" element={<PurchaseDetail />} />
          <Route path="/proveedores" element={<Suppliers />} />
          <Route path="/ordenes-venta" element={<SalesOrders />} />
          <Route path="/calendario" element={<CalendarView />} />
          <Route path="/perfil" element={<Profile />} />

          {/* Admin + Gestor */}
          <Route path="/dashboard-avanzado" element={<P roles={["admin", "gestor"]}><AdvancedDashboard /></P>} />
          <Route path="/colaboradores" element={<P roles={["admin", "gestor"]}><Collaborators /></P>} />
          <Route path="/colaboradores/:id" element={<P roles={["admin", "gestor"]}><CollaboratorDetail /></P>} />
          <Route path="/operarios" element={<P roles={["admin", "gestor"]}><Operators /></P>} />
          <Route path="/vehiculos" element={<P roles={["admin", "gestor"]}><Vehicles /></P>} />

          {/* Reports */}
          <Route path="/informes" element={<ReportsIndex />} />
          <Route path="/informes/servicios" element={<ServicesReport />} />
          <Route path="/informes/clientes" element={<ClientsReport />} />
          <Route path="/informes/operarios" element={<P roles={["admin", "gestor"]}><OperatorsReport /></P>} />
          <Route path="/informes/financiero" element={<P roles={["admin"]}><FinancialReport /></P>} />
          <Route path="/informes/compras" element={<P roles={["admin", "gestor"]}><PurchasesReport /></P>} />
          <Route path="/informes/presupuestos" element={<P roles={["admin", "gestor"]}><BudgetsReport /></P>} />

          {/* Admin only */}
          <Route path="/configuracion" element={<P roles={["admin"]}><Settings /></P>} />
        </Route>

        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </BudgetProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
