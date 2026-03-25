"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Wrench, 
  CalendarDays, 
  FileText, 
  ShoppingBag, 
  Users, 
  Building2, 
  ShoppingCart, 
  BarChart3, 
  Settings 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Servicios", href: "/servicios", icon: Wrench },
  { name: "Calendario", href: "/calendario", icon: CalendarDays },
  { name: "Presupuestos", href: "/presupuestos", icon: FileText },
  { name: "Órdenes de Venta", href: "/ordenes-venta", icon: ShoppingBag },
  { name: "Operarios", href: "/operarios", icon: Users },
  { name: "Clientes", href: "/clientes", icon: Building2 },
  { name: "Compras", href: "/compras", icon: ShoppingCart },
  { name: "Informes", href: "/informes", icon: BarChart3 },
  { name: "Configuración", href: "/configuracion", icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex flex-col w-64 border-r border-border bg-card">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">U</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight">UrbanGO</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        {/* User profile could go here */}
      </div>
    </div>
  );
}
