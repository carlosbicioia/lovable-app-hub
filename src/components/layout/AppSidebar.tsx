"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Handshake,
  Wrench,
  FileText,
  Package,
  ShoppingCart,
  Truck,
  Car,
  ClipboardList,
  Calendar,
  HardHat,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import CompanyLogo from "@/components/shared/CompanyLogo";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard-avanzado", label: "Dashboard Avanzado", icon: BarChart3, adminOnly: true },
  { to: "/servicios", label: "Servicios", icon: Wrench },
  { to: "/calendario", label: "Calendario", icon: Calendar },
  { to: "/presupuestos", label: "Presupuestos", icon: FileText },
  { to: "/ordenes-venta", label: "Órdenes de Venta", icon: ClipboardList },
  { to: "/articulos", label: "Artículos", icon: Package },
  { to: "/proveedores", label: "Proveedores", icon: Truck },
  { to: "/compras", label: "Compras", icon: ShoppingCart },
  { to: "/operarios", label: "Operarios", icon: HardHat },
  { to: "/vehiculos", label: "Vehículos", icon: Car },
  { to: "/colaboradores", label: "Colaboradores", icon: Handshake },
  { to: "/informes", label: "Informes", icon: BarChart3 },
];

const configItems = [
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const isAdminOrGestor = isAdmin || roles.includes("gestor");

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Listen for custom event from TopBar hamburger
  useEffect(() => {
    const handler = () => setMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = pathname === item.to || (item.to !== "/" && (pathname ?? "").startsWith(item.to));
    return (
      <Link
        key={item.to}
        href={item.to}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
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
        {/* Close button on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
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
              Ajustes
            </p>
          )}
          {configItems.map(renderNavItem)}
        </div>
      )}

      {/* Collapse toggle — desktop only */}
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
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 h-screen sticky top-0",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
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
