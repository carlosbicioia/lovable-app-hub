import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Handshake,
  Wrench,
  FileText,
  Package,
  ShoppingCart,
  Truck,
  ClipboardList,
  Calendar,
  HardHat,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import CompanyLogo from "@/components/shared/CompanyLogo";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/servicios", label: "Servicios", icon: Wrench },
  { to: "/calendario", label: "Calendario", icon: Calendar },
  { to: "/presupuestos", label: "Presupuestos", icon: FileText },
  { to: "/compras", label: "Compras", icon: ShoppingCart },
  { to: "/proveedores", label: "Proveedores", icon: Truck },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/articulos", label: "Artículos", icon: Package },
  { to: "/operarios", label: "Operarios", icon: HardHat },
  { to: "/colaboradores", label: "Colaboradores", icon: Handshake },
];

const configItems = [
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const isAdminOrGestor = isAdmin || roles.includes("gestor");
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
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-4 h-16 border-b border-sidebar-border shrink-0">
        <CompanyLogo
          size="md"
          className="rounded-lg shrink-0"
          fallback={
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
              <span className="text-sidebar-primary-foreground font-display font-bold text-lg">U</span>
            </div>
          }
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => {
            if (item.to === "/operarios" || item.to === "/colaboradores") return isAdminOrGestor;
            return true;
          })
          .map(renderNavItem)}
      </nav>

      {isAdmin && (
        <div className="px-2 pb-2 space-y-1">
          {!collapsed && (
            <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-sidebar-muted font-semibold">
              Ajustes
            </p>
          )}
          {configItems.map(renderNavItem)}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
