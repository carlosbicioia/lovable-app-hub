"use client";

import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { Bell, Clock, AlertTriangle, ShoppingCart, UserX, Wrench, CheckCheck, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useServices } from "@/hooks/useServices";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, parseISO, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Notification {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: "destructive" | "warning" | "info";
  href: string;
  time?: string;
}

function useDismissedNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notification_dismissals", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_dismissals" as any)
        .select("notification_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data as any[]).map((d: any) => d.notification_id));
    },
    staleTime: 30_000,
  });
}

export default function NotificationsPopover() {
  const router = useRouter();
  const { user } = useAuth();
  const { services } = useServices();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: dismissedSet = new Set<string>() } = useDismissedNotifications();
  const queryClient = useQueryClient();
  const [ringing, setRinging] = useState(false);
  const [badgePop, setBadgePop] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  const allNotifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];

    // No emergency field in new model

    purchaseOrders
      .filter((o) => o.status === "Borrador")
      .forEach((o) => {
        items.push({
          id: `po-draft-${o.id}`,
          icon: <ShoppingCart className="w-4 h-4 text-warning" />,
          title: `OC en borrador`,
          description: `${o.id} · ${o.supplierName}`,
          variant: "warning",
          href: `/compras/${o.id}`,
          time: o.createdAt,
        });
      });

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

  const notifications = useMemo(
    () => allNotifications.filter((n) => !dismissedSet.has(n.id)),
    [allNotifications, dismissedSet]
  );

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

  const dismissOne = useCallback(async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    // Optimistic update
    queryClient.setQueryData(
      ["notification_dismissals", user.id],
      (old: Set<string> | undefined) => {
        const next = new Set(old);
        next.add(notificationId);
        return next;
      }
    );
    await supabase.from("notification_dismissals" as any).insert({
      user_id: user.id,
      notification_id: notificationId,
    } as any);
  }, [user?.id, queryClient]);

  const dismissAll = useCallback(async () => {
    if (!user?.id || notifications.length === 0) return;
    const ids = notifications.map((n) => n.id);
    queryClient.setQueryData(
      ["notification_dismissals", user.id],
      (old: Set<string> | undefined) => {
        const next = new Set(old);
        ids.forEach((id) => next.add(id));
        return next;
      }
    );
    await supabase.from("notification_dismissals" as any).insert(
      ids.map((id) => ({ user_id: user.id, notification_id: id })) as any
    );
  }, [user?.id, notifications, queryClient]);

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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{notifications.length}</span>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={dismissAll}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Leer todas
              </Button>
            )}
          </div>
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
                  "px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors animate-notification-in group relative",
                  variantStyles[n.variant]
                )}
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => router.push(n.href)}
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
                  <button
                    onClick={(e) => dismissOne(n.id, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                    title="Marcar como leída"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
