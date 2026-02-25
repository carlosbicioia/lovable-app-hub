import { Card, CardContent } from "@/components/ui/card";
import { Building2, Wrench, MapPin, User, Zap } from "lucide-react";
import type { Service } from "@/types/urbango";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  service: Service;
}

export default function ServiceInfoCards({ service }: Props) {
  const items = [
    { icon: Wrench, label: "Especialidad", value: service.specialty },
    { icon: Zap, label: "Origen", value: service.origin },
    { icon: User, label: "Técnico", value: service.operatorName ?? "Sin asignar" },
    { icon: Building2, label: "Colaborador", value: service.collaboratorName ?? "Directo (sin colaborador)" },
    { icon: MapPin, label: "Cluster", value: service.clusterId },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{item.label}</span>
            </div>
            <p className="text-sm font-medium text-card-foreground truncate">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
