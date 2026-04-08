import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Handshake, Wrench, FileText, Package,
  ShoppingCart, Truck, Car, ClipboardList, Calendar, HardHat,
  BarChart3, ChevronLeft, ChevronRight, Settings, X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import CompanyLogo from "@/components/shared/CompanyLogo";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

const navItems = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/dashboard-avanzado", labelKey: "nav.advancedDashboard", icon: BarChart3, adminOnly: true },
  { to: "/servicios", labelKey: "nav.services", icon: Wrench },
  { to: "/calendario", labelKey: "nav.calendar", icon: Calendar },
  { to: "/presupuestos", labelKey: "nav.budgets", icon: FileText },
  { to: "/ordenes-venta", labelKey: "nav.salesOrders", icon: ClipboardList },
  { to: "/articulos", labelKey: "nav.articles", icon: Package },
  { to: "/proveedores", labelKey: "nav.suppliers", icon: Truck },
  { to: "/compras", labelKey: "nav.purchases", icon: ShoppingCart },
  { to: "/operarios", labelKey: "nav.operators", icon: HardHat },
  { to: "/vehiculos", labelKey: "nav.vehicles", icon: Car },
  { to: "/colaboradores", labelKey: "nav.collaborators", icon: Handshake },
  { to: "/informes", labelKey: "nav.reports", icon: BarChart3 },
];

const configItems = [
  { to: "/configuracion", labelKey: "nav.settings", icon: Settings },
];

export default function AppSidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const isAdminOrGestor = isAdmin || roles.includes("gestor");

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = () => setMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span>{t(item.labelKey)}</span>}
      </NavLink>
    );
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border shrink-0">
        <CompanyLogo
          size="md"
          className="rounded-lg shrink-0"
          fallback={
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
              <span className="text-sidebar-primary-foreground font-display font-bold text-lg">U</span>
            </div>
          }
        />
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => {
            if ((item as any).adminOnly) return isAdminOrGestor;
            if (item.to === "/operarios" || item.to === "/colaboradores") return isAdminOrGestor;
            return true;
          })
          .map(renderNavItem)}
      </nav>

      {isAdmin && (
        <div className="px-2 pb-2 space-y-1">
          {!collapsed && (
            <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-sidebar-muted font-semibold">
              {t("nav.settingsSection")}
            </p>
          )}
          {configItems.map(renderNavItem)}
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 h-screen sticky top-0",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground w-[260px] transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
