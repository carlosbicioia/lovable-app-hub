import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Collaborators from "@/pages/Collaborators";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import ComingSoon from "@/pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/colaboradores" element={<Collaborators />} />
            <Route path="/servicios" element={<Services />} />
            <Route path="/servicios/:id" element={<ServiceDetail />} />
            <Route path="/articulos" element={<ComingSoon title="Artículos" />} />
            <Route path="/calendario" element={<ComingSoon title="Calendario" />} />
            <Route path="/operarios" element={<ComingSoon title="Operarios" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
