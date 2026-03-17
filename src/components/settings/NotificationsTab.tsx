import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Wrench, Clock, FileText, Bell, Mail } from "lucide-react";

const notifications = [
  { label: "Nuevo servicio recibido", desc: "Alerta al gestor del cluster correspondiente", icon: Wrench },
  { label: "SLA próximo a vencer", desc: "Aviso cuando quedan menos de 4h para el SLA", icon: Clock },
  { label: "Presupuesto aprobado / rechazado", desc: "Notificación al creador del presupuesto", icon: FileText },
  { label: "NPS inferior al estándar", desc: "Alerta al gestor cuando NPS < 7", icon: Bell },
  { label: "Nuevo comentario del colaborador", desc: "Notificación al equipo interno", icon: Mail },
];

export default function NotificationsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preferencias de notificaciones</CardTitle>
        <CardDescription>Configura qué eventos generan alertas y a quién se envían</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.map((n) => (
          <div key={n.label} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <n.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-card-foreground">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Switch defaultChecked />
                <span className="text-xs text-muted-foreground">Email</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch defaultChecked />
                <span className="text-xs text-muted-foreground">Push</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
