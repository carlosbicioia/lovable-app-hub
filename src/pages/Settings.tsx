import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Users, Shield, FileText, Bell, Palette,
  Wrench, HardHat, Percent, Target, Cog, Database, MapPin,
  ShieldCheck as ShieldCheckIcon,
} from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import CompanyTab from "@/components/settings/CompanyTab";
import UsersTab from "@/components/settings/UsersTab";
import RolesTab from "@/components/settings/RolesTab";
import DocumentsTab from "@/components/settings/DocumentsTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import AppearanceTab from "@/components/settings/AppearanceTab";
import ProtocolTab from "@/components/settings/ProtocolTab";
import IndustrialConfigTab from "@/components/settings/IndustrialConfigTab";
import TaxTypesConfigTab from "@/components/settings/TaxTypesConfigTab";
import BulkImportTab from "@/components/settings/BulkImportTab";
import SubscriptionPlansTab from "@/components/settings/SubscriptionPlansTab";
import BranchesTab from "@/components/settings/BranchesTab";
import ServiceOriginsTab from "@/components/settings/ServiceOriginsTab";
import MonthlyTargetsTab from "@/components/settings/MonthlyTargetsTab";

const settingsNav = [
  {
    group: "General",
    items: [
      { value: "company", label: "Empresa", icon: Building2 },
      { value: "branches", label: "Sedes", icon: MapPin },
      { value: "appearance", label: "Apariencia", icon: Palette },
    ],
  },
  {
    group: "Acceso",
    items: [
      { value: "users", label: "Usuarios", icon: Users },
      { value: "roles", label: "Permisos", icon: Shield },
    ],
  },
  {
    group: "Operaciones",
    items: [
      { value: "targets", label: "Objetivos", icon: Target },
      { value: "protocol", label: "Protocolo", icon: Wrench },
      { value: "industrial", label: "Especialidades", icon: HardHat },
      { value: "origins", label: "Orígenes", icon: Cog },
    ],
  },
  {
    group: "Documentos",
    items: [
      { value: "documents", label: "Plantillas", icon: FileText },
      { value: "fiscal", label: "Fiscal", icon: Percent },
      { value: "plans", label: "Planes", icon: ShieldCheckIcon },
    ],
  },
  {
    group: "Sistema",
    items: [
      { value: "notifications", label: "Notificaciones", icon: Bell },
      { value: "import", label: "Importar datos", icon: Database },
    ],
  },
];

export default function Settings() {
  const { isLoading } = useCompanySettings();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Administra tu empresa, usuarios y preferencias del sistema</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <nav className="lg:w-56 shrink-0">
            <div className="lg:sticky lg:top-4 space-y-4">
              {settingsNav.map((section) => (
                <div key={section.group}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-2">{section.group}</p>
                  <TabsList className="flex flex-row lg:flex-col w-full bg-transparent h-auto p-0 gap-0.5">
                    {section.items.map((item) => (
                      <TabsTrigger
                        key={item.value}
                        value={item.value}
                        className="w-full justify-start text-sm gap-2 px-3 py-2 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg"
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              ))}
            </div>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <TabsContent value="company" className="space-y-6 mt-4"><CompanyTab /></TabsContent>
            <TabsContent value="branches" className="mt-4"><BranchesTab /></TabsContent>
            <TabsContent value="appearance" className="space-y-6 mt-4"><AppearanceTab /></TabsContent>
            <TabsContent value="users" className="space-y-6 mt-4"><UsersTab /></TabsContent>
            <TabsContent value="roles" className="space-y-6 mt-4"><RolesTab /></TabsContent>
            <TabsContent value="targets" className="space-y-6 mt-4"><MonthlyTargetsTab /></TabsContent>
            <TabsContent value="protocol" className="space-y-6 mt-4"><ProtocolTab /></TabsContent>
            <TabsContent value="industrial" className="space-y-6 mt-4"><IndustrialConfigTab /></TabsContent>
            <TabsContent value="origins" className="space-y-6 mt-4"><ServiceOriginsTab /></TabsContent>
            <TabsContent value="documents" className="space-y-6 mt-4"><DocumentsTab /></TabsContent>
            <TabsContent value="fiscal" className="space-y-6 mt-4"><TaxTypesConfigTab /></TabsContent>
            <TabsContent value="plans" className="space-y-6 mt-4"><SubscriptionPlansTab /></TabsContent>
            <TabsContent value="notifications" className="space-y-6 mt-4"><NotificationsTab /></TabsContent>
            <TabsContent value="import" className="space-y-6 mt-4"><BulkImportTab /></TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
