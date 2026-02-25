import { useParams, useNavigate } from "react-router-dom";
import { mockServices } from "@/data/mockData";
import { ArrowLeft, MapPin, Calendar, Clock, User, Phone, Image, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { format, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const service = mockServices.find((s) => s.id === id);

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Servicio no encontrado</p>
        <Button variant="outline" onClick={() => navigate("/servicios")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const getSlaStatus = () => {
    if (service.contactedAt) return null;
    const hours = differenceInHours(new Date(), new Date(service.receivedAt));
    if (hours >= 12) return "expired";
    if (hours >= 8) return "warning";
    return "ok";
  };

  const sla = getSlaStatus();
  const photos = service.media?.filter((m) => m.type === "photo") ?? [];
  const videos = service.media?.filter((m) => m.type === "video") ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/servicios")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-foreground">{service.id}</h1>
            <StatusBadge status={service.status} />
            <StatusBadge urgency={service.urgency} />
            {sla === "expired" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive animate-pulse-soft px-2.5 py-0.5 rounded-full border border-destructive/30 bg-destructive/15">
                ⏰ SLA Vencido
              </span>
            )}
            {sla === "warning" && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning px-2.5 py-0.5 rounded-full border border-warning/30 bg-warning/15">
                ⚠ SLA Próximo
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">{service.specialty} · {service.origin}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" /> Descripción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-card-foreground leading-relaxed">
                {service.description || "Sin descripción disponible."}
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Cronología
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimelineItem
                  label="Fecha de alta"
                  date={service.receivedAt}
                  icon={<Calendar className="w-4 h-4" />}
                  active
                />
                <TimelineItem
                  label="Primer contacto"
                  date={service.contactedAt}
                  icon={<Phone className="w-4 h-4" />}
                  active={!!service.contactedAt}
                />
                <TimelineItem
                  label="Fecha prevista de ejecución"
                  date={service.scheduledAt}
                  icon={<Calendar className="w-4 h-4" />}
                  active={!!service.scheduledAt}
                  highlight
                />
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          {(photos.length > 0 || videos.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Image className="w-4 h-4 text-muted-foreground" /> Fotos y Vídeos
                  <span className="text-xs text-muted-foreground font-normal ml-auto">
                    {photos.length} fotos · {videos.length} vídeos
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((m) => (
                    <div key={m.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted aspect-video">
                      <img
                        src={m.url}
                        alt={m.caption || "Foto del servicio"}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {m.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-xs text-white truncate">{m.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {videos.map((m) => (
                    <div key={m.id} className="relative flex items-center justify-center rounded-lg border border-border bg-muted aspect-video">
                      <Video className="w-8 h-8 text-muted-foreground" />
                      {m.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-xs text-white truncate">{m.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-card-foreground">{service.clientName}</p>
                <p className="text-xs text-muted-foreground">{service.clientId}</p>
              </div>
              {service.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{service.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> Técnico asignado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {service.operatorName ? (
                <div>
                  <p className="text-sm font-medium text-card-foreground">{service.operatorName}</p>
                  <p className="text-xs text-muted-foreground">{service.operatorId}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin técnico asignado</p>
              )}
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                {service.budgetStatus ? (
                  <span className={cn(
                    "text-sm font-medium",
                    service.budgetStatus === "Aprobado" ? "text-success" :
                    service.budgetStatus === "Pendiente" ? "text-warning" :
                    service.budgetStatus === "Rechazado" ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {service.budgetStatus}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Importe</span>
                <span className="text-lg font-bold text-card-foreground">
                  {service.budgetTotal ? `€${service.budgetTotal.toLocaleString()}` : "—"}
                </span>
              </div>
              {service.nps !== null && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">NPS</span>
                  <span className={cn(
                    "text-sm font-bold",
                    service.nps >= 9 ? "text-success" :
                    service.nps >= 7 ? "text-warning" : "text-destructive"
                  )}>
                    {service.nps}/10
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ label, date, icon, active, highlight }: {
  label: string;
  date: string | null;
  icon: React.ReactNode;
  active: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", !active && "opacity-40")}>
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full border",
        active ? (highlight ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground") : "border-border bg-muted text-muted-foreground"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {date ? (
          <p className={cn("text-sm font-medium", highlight ? "text-primary" : "text-card-foreground")}>
            {format(new Date(date), "dd MMM yyyy · HH:mm", { locale: es })}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Pendiente</p>
        )}
      </div>
    </div>
  );
}
