import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wrench, Clock, FileText, Bell, Mail, Hash, ShoppingCart,
  Timer, AlertTriangle, UserX, Smartphone, MessageSquare,
} from "lucide-react";
import { useNotificationSettings, useUpdateNotificationSetting } from "@/hooks/useNotificationSettings";

const iconMap: Record<string, typeof Wrench> = {
  new_service: Wrench,
  sla_warning: Clock,
  budget_decision: FileText,
  low_nps: Bell,
  collaborator_comment: Mail,
  service_status_change: Hash,
  new_purchase_order: ShoppingCart,
  operator_time_record: Timer,
  urgent_service: AlertTriangle,
  service_no_operator: UserX,
};

export default function NotificationsTab() {
  const { data: settings, isLoading } = useNotificationSettings();
  const updateSetting = useUpdateNotificationSetting();

  const handleToggle = (id: string, field: "app_enabled" | "slack_enabled", value: boolean) => {
    updateSetting.mutate({ id, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Slack Connection Card */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#4A154B]/10">
                <MessageSquare className="w-5 h-5 text-[#4A154B]" />
              </div>
              <div>
                <CardTitle className="text-base">Conexión con Slack</CardTitle>
                <CardDescription>Conecta un workspace de Slack para enviar notificaciones a canales individuales</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-muted-foreground">No conectado</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Al conectar Slack, podrás asignar canales individuales a cada usuario y operario para recibir alertas en tiempo real.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              // Will trigger connector flow when available
              window.dispatchEvent(new CustomEvent("lovable:connect-slack"));
            }}
          >
            <MessageSquare className="w-4 h-4" />
            Conectar Slack
          </Button>
        </CardContent>
      </Card>

      {/* Notification Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferencias de notificaciones</CardTitle>
          <CardDescription>Configura qué eventos generan alertas y por qué canal se envían</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-1 items-center mb-2">
            <span />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
              <Smartphone className="w-3.5 h-3.5 inline mr-1" />App
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
              <MessageSquare className="w-3.5 h-3.5 inline mr-1" />Slack
            </span>
          </div>
          <div className="divide-y divide-border">
            {(settings ?? []).map((s) => {
              const Icon = iconMap[s.event_key] ?? Bell;
              return (
                <div key={s.id} className="grid grid-cols-[1fr_auto_auto] gap-x-6 items-center py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{s.event_label}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.event_description}</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={s.app_enabled}
                      onCheckedChange={(v) => handleToggle(s.id, "app_enabled", v)}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={s.slack_enabled}
                      onCheckedChange={(v) => handleToggle(s.id, "slack_enabled", v)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
