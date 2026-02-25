import { mockServices } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { LogOut, Wrench, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  Pendiente_Contacto: "Pendiente contacto",
  Agendado: "Agendado",
  En_Curso: "En curso",
  Finalizado: "Finalizado",
  Liquidado: "Liquidado",
};

export default function CollaboratorPortal() {
  const { user, collaboratorId, signOut } = useAuth();

  // Filter services for this collaborator
  const services = mockServices.filter((s) => s.collaboratorId === collaboratorId);

  const activeCount = services.filter((s) => !["Finalizado", "Liquidado"].includes(s.status)).length;
  const completedCount = services.filter((s) => ["Finalizado", "Liquidado"].includes(s.status)).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">U</span>
            </div>
            <div>
              <p className="font-display font-bold text-foreground">UrbanGO</p>
              <p className="text-xs text-muted-foreground">Portal Colaborador · {collaboratorId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1.5" /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Mis Servicios</h1>
          <p className="text-sm text-muted-foreground mt-1">Consulta el estado de los servicios asociados a tus clientes</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10"><Wrench className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{services.length}</p>
                <p className="text-xs text-muted-foreground">Total servicios</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-warning/10"><Clock className="w-5 h-5 text-warning" /></div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{activeCount}</p>
                <p className="text-xs text-muted-foreground">En curso</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/10"><CheckCircle className="w-5 h-5 text-success" /></div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services list */}
        {services.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No tienes servicios asignados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {services.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-card-foreground">{s.id}</span>
                        <StatusBadge status={s.status} />
                        <StatusBadge urgency={s.urgency} />
                      </div>
                      <p className="text-sm text-card-foreground">{s.clientName}</p>
                      <p className="text-xs text-muted-foreground">{s.specialty} · {s.address}</p>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Recibido: {format(new Date(s.receivedAt), "dd MMM yyyy", { locale: es })}
                      </p>
                      {s.scheduledAt && (
                        <p className="text-xs text-muted-foreground">
                          Agendado: {format(new Date(s.scheduledAt), "dd MMM · HH:mm", { locale: es })}
                        </p>
                      )}
                      {s.budgetTotal && (
                        <p className="text-sm font-bold text-card-foreground">€{s.budgetTotal.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
