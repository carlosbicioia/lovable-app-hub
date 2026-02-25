import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Send, CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { mockClients, mockCollaborators, mockOperators } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import type { ServiceOrigin, UrgencyLevel, Specialty, ServiceType, ClaimStatus } from "@/types/urbango";

export default function ServiceCreate() {
  const navigate = useNavigate();

  // ── Client & origin ──
  const [clientId, setClientId] = useState("");
  const [origin, setOrigin] = useState<ServiceOrigin>("Directo");
  const [collaboratorId, setCollaboratorId] = useState("");

  // ── Classification ──
  const [specialty, setSpecialty] = useState<Specialty>("Fontanería/Agua");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Estándar");
  const [serviceType, setServiceType] = useState<ServiceType>("Reparación_Directa");
  const [serviceCategory, setServiceCategory] = useState<"Correctivo" | "Plan_Preventivo">("Correctivo");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("Abierto");

  // ── Description ──
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  // ── Assignment ──
  const [operatorId, setOperatorId] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledEndDate, setScheduledEndDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [scheduledEndTime, setScheduledEndTime] = useState("13:00");

  // ── Flags ──
  const [diagnosisComplete, setDiagnosisComplete] = useState(false);

  // ── Derived data ──
  const selectedClient = mockClients.find((c) => c.id === clientId);
  const selectedOperator = mockOperators.find((o) => o.id === operatorId);

  // Auto-fill address when client changes
  const handleClientChange = (id: string) => {
    setClientId(id);
    const client = mockClients.find((c) => c.id === id);
    if (client) {
      setAddress(`${client.address}, ${client.city}`);
      if (client.collaboratorId) {
        setCollaboratorId(client.collaboratorId);
      }
    }
  };

  // Filter operators by specialty
  const availableOperators = mockOperators.filter(
    (o) => o.status === "Activo" && o.available && (o.specialty === specialty || o.secondarySpecialty === specialty)
  );

  const handleSave = (andSchedule: boolean) => {
    if (!clientId) {
      toast({ title: "Error", description: "Selecciona un cliente", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Error", description: "La descripción del servicio es obligatoria", variant: "destructive" });
      return;
    }
    if (andSchedule && !operatorId) {
      toast({ title: "Error", description: "Selecciona un operario para agendar", variant: "destructive" });
      return;
    }
    if (andSchedule && !scheduledDate) {
      toast({ title: "Error", description: "Selecciona una fecha para agendar", variant: "destructive" });
      return;
    }

    toast({
      title: andSchedule ? "Servicio creado y agendado" : "Servicio registrado",
      description: andSchedule
        ? `El servicio ha sido asignado a ${selectedOperator?.name} para el ${format(scheduledDate!, "d MMM yyyy", { locale: es })}`
        : "El servicio se ha registrado como Pendiente de Contacto.",
    });
    navigate("/servicios");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/servicios")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Nuevo Servicio</h1>
          <p className="text-sm text-muted-foreground">Registro de servicio y asignación operativa</p>
        </div>
      </div>

      {/* ── SECTION 1: Client & Origin ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Cliente y Origen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={clientId} onValueChange={handleClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {mockClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Origen</Label>
              <Select value={origin} onValueChange={(v) => setOrigin(v as ServiceOrigin)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Directo">Directo</SelectItem>
                  <SelectItem value="B2B">B2B (Colaborador)</SelectItem>
                  <SelectItem value="App">App</SelectItem>
                  <SelectItem value="API_Externa">API Externa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select value={collaboratorId} onValueChange={setCollaboratorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin colaborador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin colaborador</SelectItem>
                  {mockCollaborators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedClient && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Teléfono</Label>
                <p className="text-sm">{selectedClient.phone}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm">{selectedClient.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Plan activo</Label>
                <p className="text-sm">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                    selectedClient.planType !== "Ninguno" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {selectedClient.planType}
                  </span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION 2: Classification ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Clasificación del Servicio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Especialidad *</Label>
              <Select value={specialty} onValueChange={(v) => { setSpecialty(v as Specialty); setOperatorId(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fontanería/Agua">Fontanería / Agua</SelectItem>
                  <SelectItem value="Electricidad/Luz">Electricidad / Luz</SelectItem>
                  <SelectItem value="Clima">Clima</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Urgencia</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as UrgencyLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estándar">Estándar</SelectItem>
                  <SelectItem value="24h">24 horas</SelectItem>
                  <SelectItem value="Inmediato">Inmediato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de servicio</Label>
              <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reparación_Directa">Reparación directa</SelectItem>
                  <SelectItem value="Presupuesto">Requiere presupuesto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={serviceCategory} onValueChange={(v) => setServiceCategory(v as "Correctivo" | "Plan_Preventivo")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Correctivo">Correctivo</SelectItem>
                  <SelectItem value="Plan_Preventivo">Plan preventivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado reclamación</Label>
              <Select value={claimStatus} onValueChange={(v) => setClaimStatus(v as ClaimStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abierto">Abierto</SelectItem>
                  <SelectItem value="En_Valoración">En valoración</SelectItem>
                  <SelectItem value="Aceptado">Aceptado</SelectItem>
                  <SelectItem value="Rechazado">Rechazado</SelectItem>
                  <SelectItem value="Cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-3 pb-1">
              <div className="flex items-center gap-2">
                <Switch checked={diagnosisComplete} onCheckedChange={setDiagnosisComplete} id="diagnosis" />
                <Label htmlFor="diagnosis" className="text-sm font-normal">Diagnóstico completado</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 3: Description & Location ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Descripción y Ubicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Descripción del problema *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describa el problema reportado por el cliente con el mayor detalle posible..."
              rows={4}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Dirección de intervención</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección completa donde se realizará el servicio"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Documentación adjunta</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Arrastra fotos o vídeos aquí o <span className="text-primary font-medium">haz clic para seleccionar</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Fotos del problema, vídeos, documentos del seguro...</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 4: Assignment & Scheduling ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Asignación y Planificación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Operario asignado</Label>
              <Select value={operatorId} onValueChange={setOperatorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar (pendiente)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {availableOperators.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: `hsl(${o.color})` }}
                        />
                        {o.name} · NPS {o.npsMean} · {o.activeServices} activos
                      </div>
                    </SelectItem>
                  ))}
                  {availableOperators.length === 0 && (
                    <SelectItem value="_empty" disabled>
                      No hay operarios disponibles para {specialty}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedOperator && (
                <p className="text-xs text-muted-foreground">
                  {selectedOperator.specialty}{selectedOperator.secondarySpecialty ? ` + ${selectedOperator.secondarySpecialty}` : ""} · Clústeres: {selectedOperator.clusterIds.join(", ")} · Resp. media: {selectedOperator.avgResponseTime} min
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Clúster / Zona</Label>
              <Input
                value={selectedClient?.clusterId ?? ""}
                readOnly
                className="bg-muted"
                placeholder="Se asigna automáticamente del cliente"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fecha inicio prevista</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !scheduledDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "d MMM yyyy", { locale: es }) : "Sin fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hora inicio</Label>
              <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Fecha fin prevista</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !scheduledEndDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledEndDate ? format(scheduledEndDate, "d MMM yyyy", { locale: es }) : "Sin fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledEndDate}
                    onSelect={setScheduledEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Hora fin</Label>
              <Input type="time" value={scheduledEndTime} onChange={(e) => setScheduledEndTime(e.target.value)} />
            </div>
          </div>

          {urgency !== "Estándar" && (
            <div className={cn(
              "rounded-lg border p-3 text-sm",
              urgency === "Inmediato" ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-warning/10 border-warning/30 text-warning"
            )}>
              {urgency === "Inmediato"
                ? "⚡ Servicio INMEDIATO — SLA de contacto: 1 hora. Asignar operario y agendar lo antes posible."
                : "⏰ Servicio 24H — SLA de contacto: 4 horas. Agendar para las próximas 24 horas."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION 5: Internal notes ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">5. Notas internas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Comentario interno (solo visible para gestores)</Label>
            <Textarea placeholder="Añade notas relevantes para la gestión interna del servicio..." rows={2} className="text-sm" />
          </div>
          <div className="space-y-2">
            <Label>Comentario para el gestor/colaborador</Label>
            <Textarea placeholder="Información para compartir con el colaborador..." rows={2} className="text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => navigate("/servicios")}>
          Cancelar
        </Button>
        <Button variant="secondary" onClick={() => handleSave(false)}>
          <Save className="w-4 h-4 mr-2" /> Registrar (Pte. Contacto)
        </Button>
        <Button onClick={() => handleSave(true)}>
          <Send className="w-4 h-4 mr-2" /> Registrar y Agendar
        </Button>
      </div>
    </div>
  );
}
