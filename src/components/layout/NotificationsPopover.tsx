import { useMemo, useEffect, useRef, useState } from "react";
import { Bell, Clock, AlertTriangle, ShoppingCart, UserX, Wrench } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useServices } from "@/hooks/useServices";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, parseISO, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: "destructive" | "warning" | "info";
  href: string;
  time?: string;
}

export default function NotificationsPopover() {
  const navigate = useNavigate();
  const { services } = useServices();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const [ringing, setRinging] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];

    // 1. Emergency purchase orders
    purchaseOrders
      .filter((o) => o.isEmergency && o.status !== "Conciliada")
      .forEach((o) => {
        items.push({
          id: `po-emerg-${o.id}`,
          icon: <AlertTriangle className="w-4 h-4 text-destructive" />,
          title: `Compra urgente ${o.id}`,
          description: `${o.supplierName} · €${o.totalCost.toFixed(2)}`,
          variant: "destructive",
          href: `/compras/${o.id}`,
          time: o.createdAt,
        });
      });

    // 2. Purchase orders pending approval
    purchaseOrders
      .filter((o) => o.status === "Pendiente_Aprobación")
      .forEach((o) => {
        items.push({
          id: `po-approve-${o.id}`,
          icon: <ShoppingCart className="w-4 h-4 text-warning" />,
          title: `Aprobación pendiente`,
          description: `${o.id} · ${o.supplierName}`,
          variant: "warning",
          href: `/compras/${o.id}`,
          time: o.createdAt,
        });
      });

    // 3. Services pending contact (SLA breach > 12h)
    services
      .filter((s) => {
        if (s.status !== "Pendiente_Contacto") return false;
        try {
          return differenceInHours(new Date(), parseISO(s.receivedAt)) > 12;
        } catch {
          return false;
        }
      })
      .slice(0, 5)
      .forEach((s) => {
        items.push({
          id: `sla-${s.id}`,
          icon: <Clock className="w-4 h-4 text-destructive" />,
          title: `SLA superado`,
          description: `${s.id} · ${s.clientName}`,
          variant: "destructive",
          href: `/servicios/${s.id}`,
          time: s.receivedAt,
        });
      });

    // 4. Urgent services in progress
    services
      .filter((s) => s.urgency !== "Estándar" && s.status === "En_Curso")
      .slice(0, 5)
      .forEach((s) => {
        items.push({
          id: `urgent-${s.id}`,
          icon: <AlertTriangle className="w-4 h-4 text-warning" />,
          title: `Servicio urgente en curso`,
          description: `${s.id} · ${s.clientName}`,
          variant: "warning",
          href: `/servicios/${s.id}`,
          time: s.receivedAt,
        });
      });

    // 5. Services without operator assigned
    services
      .filter((s) => !s.operatorId && s.status === "En_Curso")
      .slice(0, 3)
      .forEach((s) => {
        items.push({
          id: `notech-${s.id}`,
          icon: <UserX className="w-4 h-4 text-muted-foreground" />,
          title: `Sin técnico asignado`,
          description: `${s.id} · ${s.clientName}`,
          variant: "info",
          href: `/servicios/${s.id}`,
          time: s.receivedAt,
        });
      });

    return items;
  }, [services, purchaseOrders]);

  // Detect new notifications and trigger bell animation
  useEffect(() => {
    const count = notifications.length;
    if (prevCountRef.current !== null && count > prevCountRef.current) {
      setRinging(true);
      setBadgePop(true);
      const timer = setTimeout(() => setRinging(false), 800);
      const timer2 = setTimeout(() => setBadgePop(false), 400);
      return () => {
        clearTimeout(timer);
        clearTimeout(timer2);
      };
    }
    prevCountRef.current = count;
  }, [notifications.length]);

  const variantStyles: Record<string, string> = {
    destructive: "border-l-2 border-l-destructive bg-destructive/5",
    warning: "border-l-2 border-l-warning bg-warning/5",
    info: "border-l-2 border-l-muted-foreground/30",
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className={cn(
            "w-5 h-5 text-muted-foreground transition-colors",
            ringing && "animate-bell-ring text-primary"
          )} />
          {notifications.length > 0 && (
            <span className={cn(
              "absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center",
              badgePop && "animate-badge-pop"
            )}>
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-[420px] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            Notificaciones
          </h3>
          <span className="text-xs text-muted-foreground">{notifications.length} alerta(s)</span>
        </div>
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay alertas pendientes 🎉
            </div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n.id}
                className={cn(
                  "px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors animate-notification-in",
                  variantStyles[n.variant]
                )}
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => navigate(n.href)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{n.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.description}</p>
                    {n.time && (
                      <p className="text-[11px] text-muted-foreground/70 mt-1">
                        {(() => {
                          try {
                            return formatDistanceToNow(parseISO(n.time), { addSuffix: true, locale: es });
                          } catch {
                            return "";
                          }
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
