import { useState } from "react";
import { useServices } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import { useClients } from "@/hooks/useClients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VoiceTextarea as Textarea } from "@/components/ui/voice-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LogOut, Wrench, Clock, CheckCircle, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UrgencyLevel, Specialty } from "@/types/urbango";

const statusLabels: Record<string, string> = {
  Pte_Aceptacion: "Pendiente aceptación",
  Pendiente_Contacto: "Pendiente contacto",
  Pte_Asignacion: "Pte. Asignación",
  Asignado: "Asignado",
  Agendado: "Agendado",
  En_Curso: "En curso",
  Finalizado: "Finalizado",
  Liquidado: "Liquidado",
};

export default function CollaboratorPortal() {
  const { user, collaboratorId, signOut } = useAuth();
  const { services: allServices, refetch } = useServices();
  const { data: clients = [] } = useClients();

  // Filter services for this collaborator
  const services = allServices.filter((s) => s.collaboratorId === collaboratorId);

  const activeCount = services.filter((s) => !["Finalizado", "Liquidado"].includes(s.status)).length;
  const completedCount = services.filter((s) => ["Finalizado", "Liquidado"].includes(s.status)).length;
  const pendingCount = services.filter((s) => s.status === "Pte_Aceptacion").length;

  // ── New service dialog ──
  const [showNewService, setShowNewService] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState({
    clientName: "",
    contactName: "",
    contactPhone: "",
    address: "",
    description: "",
    specialty: "Fontanería/Agua" as Specialty,
    urgency: "Estándar" as UrgencyLevel,
  });

  const resetForm = () => {
    setNewService({
      clientName: "",
      contactName: "",
      contactPhone: "",
      address: "",
      description: "",
      specialty: "Fontanería/Agua",
      urgency: "Estándar",
    });
  };

  const handleCreateService = async () => {
    if (!newService.clientName.trim() || !newService.description.trim()) {
      toast.error("El nombre del cliente y la descripción son obligatorios");
      return;
    }
    setSaving(true);
    try {
      // Generate next service ID
      const { data: settings } = await supabase
        .from("company_settings")
        .select("service_prefix")
        .limit(1)
        .maybeSingle();
      const prefix = settings?.service_prefix ?? "SRV-";
      const { data: lastServices } = await supabase
        .from("services")
        .select("id")
        .ilike("id", `${prefix}%`)
        .order("id", { ascending: false })
        .limit(1);
      let nextNum = 1;
      if (lastServices && lastServices.length > 0) {
        const numPart = parseInt(lastServices[0].id.replace(prefix, ""), 10);
        if (!isNaN(numPart)) nextNum = numPart + 1;
      }
      const serviceId = `${prefix}${String(nextNum).padStart(3, "0")}`;

      const { error } = await supabase.from("services").insert({
        id: serviceId,
        client_id: "",
        client_name: newService.clientName,
        collaborator_id: collaboratorId,
        collaborator_name: collaboratorId,
        origin: "B2B",
        status: "Pte_Aceptacion",
        specialty: newService.specialty,
        urgency: newService.urgency,
        description: newService.description,
        address: newService.address,
        contact_name: newService.contactName,
        contact_phone: newService.contactPhone,
        service_type: "Reparación_Directa",
        service_category: "Correctivo",
        claim_status: "Abierto",
        collaborator_notes: `Solicitud creada por colaborador ${collaboratorId}`,
      });

      if (error) {
        toast.error("No se pudo crear la solicitud: " + error.message);
      } else {
        toast.success(`Solicitud ${serviceId} creada correctamente. Pendiente de aceptación por el gestor.`);
        resetForm();
        setShowNewService(false);
        await refetch();
      }
    } catch (err) {
      toast.error("Error inesperado al crear la solicitud");
    } finally {
      setSaving(false);
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Mis Servicios</h1>
            <p className="text-sm text-muted-foreground mt-1">Consulta el estado de los servicios y solicita nuevos</p>
          </div>
          <Button onClick={() => setShowNewService(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Solicitar servicio
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
              <div className="p-2.5 rounded-lg bg-chart-5/10"><Clock className="w-5 h-5 text-chart-5" /></div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pte. Aceptación</p>
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
              <Button variant="outline" className="mt-3" onClick={() => setShowNewService(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Solicitar primer servicio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {services.map((s) => (
              <Card key={s.id} className={cn(s.status === "Pte_Aceptacion" && "border-chart-5/40")}>
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

      {/* New service dialog */}
      <Dialog open={showNewService} onOpenChange={setShowNewService}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar nuevo servicio</DialogTitle>
            <p className="text-sm text-muted-foreground">
              El servicio quedará pendiente de aceptación por el gestor antes de ser procesado.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del cliente *</Label>
              <Input
                value={newService.clientName}
                onChange={(e) => setNewService((p) => ({ ...p, clientName: e.target.value }))}
                placeholder="Nombre completo o razón social"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Persona de contacto</Label>
                <Input
                  value={newService.contactName}
                  onChange={(e) => setNewService((p) => ({ ...p, contactName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={newService.contactPhone}
                  onChange={(e) => setNewService((p) => ({ ...p, contactPhone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={newService.address}
                onChange={(e) => setNewService((p) => ({ ...p, address: e.target.value }))}
                placeholder="Calle, número, piso..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Especialidad</Label>
                <Select value={newService.specialty} onValueChange={(v) => setNewService((p) => ({ ...p, specialty: v as Specialty }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fontanería/Agua">Fontanería/Agua</SelectItem>
                    <SelectItem value="Electricidad/Luz">Electricidad/Luz</SelectItem>
                    <SelectItem value="Clima">Clima</SelectItem>
                    <SelectItem value="Carpintería_Metálica">Carpintería Met.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urgencia</Label>
                <Select value={newService.urgency} onValueChange={(v) => setNewService((p) => ({ ...p, urgency: v as UrgencyLevel }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estándar">Estándar</SelectItem>
                    <SelectItem value="24h">24h</SelectItem>
                    <SelectItem value="Inmediato">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción del servicio *</Label>
              <Textarea
                value={newService.description}
                onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe el problema o la intervención necesaria..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewService(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleCreateService} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
