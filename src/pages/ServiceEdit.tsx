import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { ArrowLeft, Save, CalendarIcon, Upload, Image, Euro, Camera, File } from "lucide-react";
import ServiceMediaUpload from "@/components/service-detail/ServiceMediaUpload";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useCollaborators } from "@/hooks/useCollaborators";
import { useOperators } from "@/hooks/useOperators";
import { useServices } from "@/hooks/useServices";
import { useSpecialties } from "@/hooks/useIndustrialConfig";
import { useServiceOrigins } from "@/hooks/useServiceOrigins";
import { useBranches } from "@/hooks/useBranches";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { ServiceOrigin, UrgencyLevel, Specialty, ServiceType, ClaimStatus, ServiceStatus, BudgetStatus } from "@/types/urbango";

export default function ServiceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { services, loading: servicesLoading, updateService } = useServices();
  const { data: clients = [] } = useClients();
  const { collaborators } = useCollaborators();
  const { data: allOperators = [] } = useOperators();
  const { data: dbSpecialties = [] } = useSpecialties();
  const activeSpecialties = dbSpecialties.filter(s => s.active);
  const { data: dbOrigins = [] } = useServiceOrigins();
  const activeOrigins = dbOrigins.filter(o => o.active);
  const service = services.find((s) => s.id === id);
  const [saving, setSaving] = useState(false);
  const [showBudgetPrompt, setShowBudgetPrompt] = useState(false);
  const [hasBudget, setHasBudget] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("budgets").select("id").eq("service_id", id).limit(1)
      .then(({ data }) => setHasBudget((data?.length ?? 0) > 0));
  }, [id]);

  const handleServiceTypeChange = (v: string) => {
    if (v === "Reparación_Directa" && hasBudget) {
      toast({ title: "No permitido", description: "No se puede cambiar a reparación directa porque ya existe un presupuesto vinculado. Elimina el servicio y créalo de nuevo.", variant: "destructive" });
      return;
    }
    setServiceType(v as ServiceType);
    if (v === "Presupuesto" && service?.serviceType !== "Presupuesto") {
      setShowBudgetPrompt(true);
    }
  };
  // ── All state ──
  const [clientId, setClientId] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [origin, setOrigin] = useState<ServiceOrigin>("Directo");
  const [collaboratorId, setCollaboratorId] = useState("");
  const [status, setStatus] = useState<ServiceStatus>("Pendiente_Contacto");
  const [specialty, setSpecialty] = useState<Specialty>("Fontanería/Agua");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Estándar");
  const [serviceType, setServiceType] = useState<ServiceType>("Reparación_Directa");
  const [serviceCategory, setServiceCategory] = useState<"Correctivo" | "Plan_Preventivo">("Correctivo");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("Abierto");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledEndDate, setScheduledEndDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [scheduledEndTime, setScheduledEndTime] = useState("13:00");
  const [diagnosisComplete, setDiagnosisComplete] = useState(false);
  const [budgetTotal, setBudgetTotal] = useState<number | "">("");
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | "">("");
  const [realHours, setRealHours] = useState<number | "">("");
  const [nps, setNps] = useState<number | "">("");

  // Track initial values for dirty detection
  const initialSnapshot = useRef<string>("");

  // Pre-fill from service
  useEffect(() => {
    if (!service) return;
    setClientId(service.clientId);
    setOrigin(service.origin);
    setCollaboratorId(service.collaboratorId ?? "");
    setStatus(service.status);
    setSpecialty(service.specialty);
    setUrgency(service.urgency);
    setServiceType(service.serviceType);
    setServiceCategory(service.serviceCategory);
    setClaimStatus(service.claimStatus);
    setDescription(service.description ?? "");
    setAddress(service.address ?? "");
    setOperatorId(service.operatorId ?? "");
    setDiagnosisComplete(service.diagnosisComplete);
    setBudgetTotal(service.budgetTotal ?? "");
    setBudgetStatus((service.budgetStatus ?? "") as BudgetStatus | "");
    setRealHours(service.realHours ?? "");
    setNps(service.nps ?? "");
    if (service.scheduledAt) {
      const d = new Date(service.scheduledAt);
      setScheduledDate(d);
      setScheduledTime(format(d, "HH:mm"));
    }
    if (service.scheduledEndAt) {
      const d = new Date(service.scheduledEndAt);
      setScheduledEndDate(d);
      setScheduledEndTime(format(d, "HH:mm"));
    }
    // Capture initial snapshot after pre-fill
    setTimeout(() => {
      initialSnapshot.current = JSON.stringify({ clientId: service.clientId, origin: service.origin, collaboratorId: service.collaboratorId ?? "", status: service.status, specialty: service.specialty, urgency: service.urgency, serviceType: service.serviceType, serviceCategory: service.serviceCategory, claimStatus: service.claimStatus, description: service.description ?? "", address: service.address ?? "", operatorId: service.operatorId ?? "", diagnosisComplete: service.diagnosisComplete, budgetTotal: service.budgetTotal ?? "", budgetStatus: (service.budgetStatus ?? "") as string, realHours: service.realHours ?? "", nps: service.nps ?? "" });
    }, 0);
  }, [service]);

  const currentSnapshot = JSON.stringify({ clientId, origin, collaboratorId, status, specialty, urgency, serviceType, serviceCategory, claimStatus, description, address, operatorId, diagnosisComplete, budgetTotal, budgetStatus, realHours, nps });
  const isDirty = useMemo(() => !saving && initialSnapshot.current !== "" && currentSnapshot !== initialSnapshot.current, [saving, currentSnapshot]);
  const { UnsavedChangesDialog } = useUnsavedChanges(isDirty);

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const selectedClient = clients.find((c) => c.id === clientId);
  const clientDisplayName = selectedClient ? (selectedClient.clientType === "Empresa" ? selectedClient.companyName : selectedClient.name) : "";
  const selectedOperator = allOperators.find((o) => o.id === operatorId);

  const handleClientChange = (cid: string) => {
    setClientId(cid);
    setClientOpen(false);
    const client = clients.find((c) => c.id === cid);
    if (client) {
      setAddress(`${client.address}, ${client.city}`);
      if (client.collaboratorId) setCollaboratorId(client.collaboratorId);
    }
  };

  const availableOperators = allOperators.filter(
    (o) => o.status === "Activo" && o.available && (o.specialty === specialty || o.secondarySpecialty === specialty)
  );

  // Include current operator even if not in available list
  const currentOperator = service.operatorId ? allOperators.find((o) => o.id === service.operatorId) : null;
  const operatorOptions = currentOperator && !availableOperators.find((o) => o.id === currentOperator.id)
    ? [currentOperator, ...availableOperators]
    : availableOperators;

  const handleSave = async () => {
    if (!clientId) {
      toast({ title: "Error", description: "Selecciona un cliente", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Error", description: "La descripción es obligatoria", variant: "destructive" });
      return;
    }

    setSaving(true);
    const selectedCollab = collaborators.find((c) => c.id === collaboratorId);
    const selOp = allOperators.find((o) => o.id === operatorId);

    // Build scheduled timestamps
    let scheduledAtIso: string | null = null;
    let scheduledEndAtIso: string | null = null;
    if (scheduledDate) {
      const [h, m] = scheduledTime.split(":").map(Number);
      const d = new Date(scheduledDate);
      d.setHours(h, m, 0, 0);
      scheduledAtIso = d.toISOString();
    }
    if (scheduledEndDate) {
      const [h, m] = scheduledEndTime.split(":").map(Number);
      const d = new Date(scheduledEndDate);
      d.setHours(h, m, 0, 0);
      scheduledEndAtIso = d.toISOString();
    }

    const { error } = await updateService(service.id, {
      client_id: clientId,
      client_name: clientDisplayName,
      operator_id: operatorId && operatorId !== "none" ? operatorId : null,
      operator_name: selOp?.name ?? null,
      collaborator_id: collaboratorId && collaboratorId !== "none" ? collaboratorId : null,
      collaborator_name: selectedCollab?.companyName ?? null,
      cluster_id: selectedClient?.clusterId ?? service.clusterId,
      origin,
      status,
      urgency,
      specialty,
      service_type: serviceType,
      service_category: serviceCategory,
      claim_status: claimStatus,
      scheduled_at: scheduledAtIso,
      scheduled_end_at: scheduledEndAtIso,
      diagnosis_complete: diagnosisComplete,
      nps: nps !== "" ? Number(nps) : null,
      budget_total: budgetTotal !== "" ? Number(budgetTotal) : null,
      budget_status: budgetStatus && (budgetStatus as string) !== "none" ? budgetStatus : null,
      description,
      address,
      real_hours: realHours !== "" ? Number(realHours) : null,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar el servicio", variant: "destructive" });
      return;
    }
    toast({ title: "Servicio actualizado", description: `${service.id} se ha guardado correctamente.` });
    navigate(`/servicios/${service.id}`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <UnsavedChangesDialog />
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/servicios/${service.id}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Editar {service.id}</h1>
          <p className="text-sm text-muted-foreground">Modificar datos del servicio</p>
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
              <Popover open={clientOpen} onOpenChange={setClientOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className={cn("w-full justify-between font-normal", !clientId && "text-muted-foreground")}>
                    {selectedClient ? clientDisplayName : "Buscar cliente..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 bg-popover z-50" align="start">
                  <Command>
                    <CommandInput placeholder="Nombre, DNI, teléfono..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron clientes</CommandEmpty>
                      <CommandGroup>
                         {clients.map((c) => (
                          <CommandItem key={c.id} value={`${c.name} ${c.companyName} ${c.dni} ${c.taxId} ${c.phone} ${c.email}`} onSelect={() => handleClientChange(c.id)}>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{c.clientType === "Empresa" ? c.companyName : c.name}</span>
                              <span className="text-xs text-muted-foreground">{c.phone} · {c.address}, {c.city}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Origen</Label>
              <Select value={origin} onValueChange={(v) => setOrigin(v as ServiceOrigin)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activeOrigins.map((o) => (
                    <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>
                  ))}
                  {/* Keep current value if not in active origins */}
                  {origin && !activeOrigins.find(o => o.name === origin) && (
                    <SelectItem value={origin}>{origin}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {activeOrigins.find(o => o.name === origin)?.show_collaborator && (
              <div className="space-y-2">
                <Label>Colaborador</Label>
                <Select value={collaboratorId} onValueChange={setCollaboratorId}>
                  <SelectTrigger><SelectValue placeholder="Sin colaborador" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin colaborador</SelectItem>
                    {collaborators.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {selectedClient && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 bg-muted/30 rounded-lg p-3 border border-border">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Teléfono</Label>
                <p className="text-sm font-medium">{selectedClient.phone}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm">{selectedClient.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Dirección</Label>
                <p className="text-sm">{selectedClient.address}, {selectedClient.city}</p>
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

      {/* ── SECTION 2: Status & Classification ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Estado y Clasificación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Estado del servicio</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ServiceStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente_Contacto">Pendiente de contacto</SelectItem>
                  <SelectItem value="Pte_Asignacion">Pte. Asignación</SelectItem>
                  <SelectItem value="Asignado">Asignado</SelectItem>
                  <SelectItem value="Agendado">Agendado</SelectItem>
                  <SelectItem value="En_Curso">En curso</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                  <SelectItem value="Liquidado">Liquidado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Especialidad *</Label>
              <Select value={specialty} onValueChange={(v) => { setSpecialty(v as Specialty); setOperatorId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activeSpecialties.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Urgencia</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as UrgencyLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Estándar">Estándar</SelectItem>
                  <SelectItem value="24h">24 horas</SelectItem>
                  <SelectItem value="Inmediato">Inmediato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de servicio</Label>
              <Select value={serviceType} onValueChange={handleServiceTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reparación_Directa">Reparación directa</SelectItem>
                  <SelectItem value="Presupuesto">Requiere presupuesto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={serviceCategory} onValueChange={(v) => setServiceCategory(v as "Correctivo" | "Plan_Preventivo")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Correctivo">Correctivo</SelectItem>
                  <SelectItem value="Plan_Preventivo">Plan preventivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado reclamación</Label>
              <Select value={claimStatus} onValueChange={(v) => setClaimStatus(v as ClaimStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describa el problema..." rows={4} className="text-sm" />
          </div>
          <div className="space-y-2">
            <Label>Dirección de intervención</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección completa" />
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
              <SearchableSelect
                value={operatorId}
                onValueChange={setOperatorId}
                placeholder="Buscar operario…"
                searchPlaceholder="Nombre del operario…"
                emptyText="Sin operarios disponibles"
                options={[
                  { value: "none", label: "Sin asignar" },
                  ...operatorOptions.map((o) => ({
                    value: o.id,
                    label: o.name,
                    subtitle: `NPS ${o.npsMean} · ${o.activeServices} activos · ${o.specialty}`,
                  })),
                ]}
              />
              {selectedOperator && (
                <p className="text-xs text-muted-foreground">
                  {selectedOperator.specialty}{selectedOperator.secondarySpecialty ? ` + ${selectedOperator.secondarySpecialty}` : ""} · Clústeres: {selectedOperator.clusterIds.join(", ")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Clúster / Zona</Label>
              <Input value={selectedClient?.clusterId ?? ""} readOnly className="bg-muted" />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fecha inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !scheduledDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "d MMM yyyy", { locale: es }) : "Sin fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Hora inicio</Label>
              <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !scheduledEndDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledEndDate ? format(scheduledEndDate, "d MMM yyyy", { locale: es }) : "Sin fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={scheduledEndDate} onSelect={setScheduledEndDate} initialFocus className="p-3 pointer-events-auto" />
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
                ? "⚡ Servicio INMEDIATO — Asignar operario lo antes posible."
                : "⏰ Servicio 24H — Agendar en las próximas 24 horas."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SECTION 5: Economics ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Euro className="w-4 h-4" />
            5. Datos Económicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Importe presupuesto (€)</Label>
              <Input type="number" min={0} step={0.01} value={budgetTotal} onChange={(e) => setBudgetTotal(e.target.value ? parseFloat(e.target.value) : "")} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Estado presupuesto</Label>
              <Select value={budgetStatus as string} onValueChange={(v) => setBudgetStatus(v as BudgetStatus)}>
                <SelectTrigger><SelectValue placeholder="Sin presupuesto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin presupuesto</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Enviado">Enviado</SelectItem>
                  <SelectItem value="Aprobado">Aprobado</SelectItem>
                  <SelectItem value="Rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horas reales</Label>
              <Input type="number" min={0} step={0.5} value={realHours} onChange={(e) => setRealHours(e.target.value ? parseFloat(e.target.value) : "")} placeholder="—" />
            </div>
            <div className="space-y-2">
              <Label>NPS</Label>
              <Input type="number" min={0} max={10} step={1} value={nps} onChange={(e) => setNps(e.target.value ? parseInt(e.target.value) : "")} placeholder="—" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 6: Media ── */}
      <ServiceMediaUpload serviceId={service.id} />

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pb-6">
        <Button variant="outline" onClick={() => navigate(`/servicios/${service.id}`)}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      {/* Budget creation prompt */}
      <AlertDialog open={showBudgetPrompt} onOpenChange={setShowBudgetPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Crear presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Has cambiado el tipo a "Requiere presupuesto". ¿Quieres crear el presupuesto ahora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Más tarde</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(`/presupuestos/nuevo?serviceId=${service.id}`)}>
              Crear presupuesto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
