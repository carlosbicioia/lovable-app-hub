import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { ArrowLeft, Save, Send, CalendarIcon, Upload, Image, FileText, ExternalLink, Camera, File, X } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useCollaborators } from "@/hooks/useCollaborators";
import { useOperators } from "@/hooks/useOperators";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useServices } from "@/hooks/useServices";
import { useBudgets } from "@/hooks/useBudgets";
import type { ServiceOrigin, UrgencyLevel, Specialty, ServiceType, ClaimStatus } from "@/types/urbango";
import { useSpecialties } from "@/hooks/useIndustrialConfig";
import { useBranches } from "@/hooks/useBranches";
import { useServiceOrigins } from "@/hooks/useServiceOrigins";

const PENDING_SERVICE_KEY = "pendingServiceCreate";

export default function ServiceCreate() {
  const { refetch } = useServices();
  const { budgets } = useBudgets();
  const { data: clients = [] } = useClients();
  const { collaborators } = useCollaborators();
  const { data: allOperators = [] } = useOperators();
  const { data: dbSpecialties = [] } = useSpecialties();
  const activeSpecialties = dbSpecialties.filter(s => s.active);
  const { data: branches = [] } = useBranches();
  const { data: dbOrigins = [] } = useServiceOrigins();
  const activeOrigins = dbOrigins.filter(o => o.active);

  // Auto-assign branch: first by cluster_id, then by service city/province
  const findBranchForService = (clusterId: string, svcCity?: string, svcProvince?: string) => {
    // 1. Try cluster match
    if (clusterId) {
      const match = branches.find(b => b.active && b.cluster_ids.includes(clusterId));
      if (match) return match.id;
    }
    // 2. Try exact city match (service location)
    if (svcCity) {
      const cityMatch = branches.find(b => b.active && b.city.toLowerCase() === svcCity.toLowerCase());
      if (cityMatch) return cityMatch.id;
    }
    // 3. Try province match (service location)
    if (svcProvince) {
      const provMatch = branches.find(b => b.active && b.province.toLowerCase() === svcProvince.toLowerCase());
      if (provMatch) return provMatch.id;
    }
    return null;
  };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
  const [showBudgetPrompt, setShowBudgetPrompt] = useState(false);

  const handleServiceTypeChange = (v: string) => {
    setServiceType(v as ServiceType);
    if (v === "Presupuesto") {
      setShowBudgetPrompt(true);
    }
  };

  // ── Client & origin ──
  const [clientId, setClientId] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [origin, setOrigin] = useState<ServiceOrigin>("Directo");
  const [collaboratorId, setCollaboratorId] = useState("");

  // ── Classification ──
  const [specialty, setSpecialty] = useState<Specialty>("Fontanería/Agua");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Estándar");
  const [serviceType, setServiceType] = useState<ServiceType>("Reparación_Directa");
  const [serviceCategory, setServiceCategory] = useState<"Correctivo" | "Plan_Preventivo">("Correctivo");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("Abierto");

  // ── Description & Location ──
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [serviceCity, setServiceCity] = useState("");
  const [serviceProvince, setServiceProvince] = useState("");

  // ── Assignment ──
  const [operatorId, setOperatorId] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledEndDate, setScheduledEndDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [scheduledEndTime, setScheduledEndTime] = useState("13:00");

  // ── Flags ──
  const [diagnosisComplete, setDiagnosisComplete] = useState(false);

  // ── Media ──
  const [currentStateImages, setCurrentStateImages] = useState<File[]>([]);
  const [repairedStateImages, setRepairedStateImages] = useState<File[]>([]);
  const currentStateRef = useRef<HTMLInputElement>(null);
  const repairedStateRef = useRef<HTMLInputElement>(null);

  const isDirty = useMemo(() =>
    !saving && (!!clientId || !!description.trim() || !!address.trim() || !!operatorId),
    [saving, clientId, description, address, operatorId]
  );
  const { UnsavedChangesDialog } = useUnsavedChanges(isDirty);

  // ── Restore pending service from sessionStorage (returning from budget creation) ──
  useEffect(() => {
    const stored = sessionStorage.getItem(PENDING_SERVICE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPendingServiceId(data.serviceId);
        // Restore form state
        if (data.clientId) setClientId(data.clientId);
        if (data.origin) setOrigin(data.origin);
        if (data.collaboratorId) setCollaboratorId(data.collaboratorId);
        if (data.specialty) setSpecialty(data.specialty);
        if (data.urgency) setUrgency(data.urgency);
        if (data.serviceType) setServiceType(data.serviceType);
        if (data.serviceCategory) setServiceCategory(data.serviceCategory);
        if (data.claimStatus) setClaimStatus(data.claimStatus);
        if (data.description) setDescription(data.description);
        if (data.address) setAddress(data.address);
        if (data.operatorId) setOperatorId(data.operatorId);
        if (data.diagnosisComplete) setDiagnosisComplete(data.diagnosisComplete);
      } catch {}
    }
  }, []);

  // ── Pre-fill from calendar query params ──
  useEffect(() => {
    const dateParam = searchParams.get("date");
    const startTimeParam = searchParams.get("startTime");
    const endTimeParam = searchParams.get("endTime");
    if (dateParam) {
      const d = new Date(dateParam + "T00:00:00");
      if (!isNaN(d.getTime())) {
        setScheduledDate(d);
        setScheduledEndDate(d);
      }
    }
    if (startTimeParam) setScheduledTime(startTimeParam);
    if (endTimeParam) setScheduledEndTime(endTimeParam);
  }, [searchParams]);

  // Check if pending service has a linked budget
  const linkedBudget = pendingServiceId
    ? budgets.find((b) => b.serviceId === pendingServiceId)
    : null;

  // ── Derived data ──
  const selectedClient = clients.find((c) => c.id === clientId);
  const clientDisplayName = selectedClient ? (selectedClient.clientType === "Empresa" ? selectedClient.companyName : selectedClient.name) : "";
  const selectedOperator = allOperators.find((o) => o.id === operatorId);

  const handleClientChange = (id: string) => {
    setClientId(id);
    setClientOpen(false);
    const client = clients.find((c) => c.id === id);
    if (client) {
      setAddress(`${client.address}, ${client.city}`);
      setServiceCity(client.city);
      setServiceProvince(client.province);
      if (client.collaboratorId) {
        setCollaboratorId(client.collaboratorId);
      }
    }
  };

  const availableOperators = allOperators.filter(
    (o) => o.status === "Activo" && o.available && (o.specialty === specialty || o.secondarySpecialty === specialty)
  );

  // Helper: generate next service ID
  const generateServiceId = async () => {
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
    return `${prefix}${String(nextNum).padStart(3, "0")}`;
  };

  // Helper: build the service insert payload
  const buildServicePayload = (serviceId: string, statusOverride?: string) => {
    const selectedCollab = collaborators.find((c) => c.id === collaboratorId);
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
    return {
      id: serviceId,
      client_id: clientId,
      client_name: clientDisplayName,
      operator_id: operatorId && operatorId !== "none" ? operatorId : null,
      operator_name: selectedOperator?.name ?? null,
      collaborator_id: collaboratorId && collaboratorId !== "none" ? collaboratorId : null,
      collaborator_name: selectedCollab?.companyName ?? null,
      cluster_id: selectedClient?.clusterId ?? "",
      origin,
      status: statusOverride ?? "Pendiente_Contacto",
      urgency,
      specialty,
      service_type: serviceType,
      service_category: serviceCategory,
      claim_status: claimStatus,
      description,
      address,
      diagnosis_complete: diagnosisComplete,
      scheduled_at: scheduledAtIso,
      scheduled_end_at: scheduledEndAtIso,
      contacted_at: null as string | null,
      budget_total: null,
      budget_status: null,
      real_hours: null,
      branch_id: findBranchForClient(selectedClient?.clusterId ?? "", selectedClient?.city, selectedClient?.province),
    };
  };

  // "Crear presupuesto" — auto-save service first, then navigate to budget creation
  const handleCreateBudget = async () => {
    if (!clientId) {
      toast({ title: "Error", description: "Selecciona un cliente antes de crear el presupuesto", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const newId = pendingServiceId ?? await generateServiceId();
      const payload = buildServicePayload(newId);

      if (pendingServiceId) {
        // Update existing
        const { id: _, ...updatePayload } = payload;
        await supabase.from("services").update(updatePayload).eq("id", pendingServiceId);
      } else {
        // Insert new
        const { error } = await supabase.from("services").insert(payload);
        if (error) {
          toast({ title: "Error", description: "No se pudo crear el servicio: " + error.message, variant: "destructive" });
          setSaving(false);
          return;
        }
      }

      setPendingServiceId(newId);
      // Save form state to sessionStorage so we can restore on return
      sessionStorage.setItem(PENDING_SERVICE_KEY, JSON.stringify({
        serviceId: newId,
        clientId, origin, collaboratorId, specialty, urgency,
        serviceType, serviceCategory, claimStatus, description,
        address, operatorId, diagnosisComplete,
      }));

      await refetch();
      navigate(`/presupuestos/nuevo?serviceId=${newId}`);
    } catch (err) {
      console.error("Error creating service for budget:", err);
      toast({ title: "Error", description: "Error inesperado", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Cancel — delete auto-created service + linked budgets
  const handleCancel = async () => {
    if (pendingServiceId) {
      // Delete linked budget lines and budgets first
      const { data: linkedBudgets } = await supabase
        .from("budgets")
        .select("id")
        .eq("service_id", pendingServiceId);
      if (linkedBudgets && linkedBudgets.length > 0) {
        const budgetIds = linkedBudgets.map((b) => b.id);
        await supabase.from("budget_lines").delete().in("budget_id", budgetIds);
        await supabase.from("budgets").delete().in("id", budgetIds);
      }
      // Delete the service
      await supabase.from("services").delete().eq("id", pendingServiceId);
      await refetch();
      sessionStorage.removeItem(PENDING_SERVICE_KEY);
    }
    navigate("/servicios");
  };

  const handleSave = async (andSchedule: boolean) => {
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

    setSaving(true);
    try {
      const serviceId = pendingServiceId ?? await generateServiceId();
      const status = andSchedule ? "Agendado" : "Pendiente_Contacto";
      const payload = buildServicePayload(serviceId, status);
      if (andSchedule) payload.contacted_at = new Date().toISOString();

      if (pendingServiceId) {
        // Service already exists — update it
        const { id: _, ...updatePayload } = payload;
        const { error } = await supabase.from("services").update(updatePayload).eq("id", pendingServiceId);
        if (error) {
          toast({ title: "Error", description: "No se pudo actualizar el servicio: " + error.message, variant: "destructive" });
          setSaving(false);
          return;
        }
      } else {
        const { error } = await supabase.from("services").insert(payload);
        if (error) {
          toast({ title: "Error", description: "No se pudo crear el servicio: " + error.message, variant: "destructive" });
          setSaving(false);
          return;
        }
      }

      sessionStorage.removeItem(PENDING_SERVICE_KEY);
      await refetch();

      toast({
        title: andSchedule ? "Servicio creado y agendado" : "Servicio registrado",
        description: andSchedule
          ? `El servicio ${serviceId} ha sido asignado a ${selectedOperator?.name} para el ${format(scheduledDate!, "d MMM yyyy", { locale: es })}`
          : `El servicio ${serviceId} se ha registrado como Pendiente de Contacto.`,
      });
      navigate("/servicios");
    } catch (err: any) {
      console.error("Unexpected error creating service:", err);
      toast({ title: "Error", description: "Error inesperado al crear el servicio", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <UnsavedChangesDialog />
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
            {/* Client searchable selector */}
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Popover open={clientOpen} onOpenChange={setClientOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn("w-full justify-between font-normal", !clientId && "text-muted-foreground")}
                  >
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
                           <CommandItem
                            key={c.id}
                            value={`${c.name} ${c.companyName} ${c.dni} ${c.taxId} ${c.phone} ${c.email}`}
                            onSelect={() => handleClientChange(c.id)}
                          >
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

          {/* Assigned branch */}
          {(() => {
            const assignedBranchId = findBranchForClient(selectedClient?.clusterId ?? "", selectedClient?.city, selectedClient?.province);
            const assignedBranch = branches.find(b => b.id === assignedBranchId);
            return (
              <div className="flex items-center gap-2 pt-1">
                <Label className="text-xs text-muted-foreground">Sede asignada:</Label>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                  assignedBranch ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {assignedBranch?.name ?? "Sin sede (selecciona cliente)"}
                </span>
              </div>
            );
          })()}

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

          {/* Budget section when "Presupuesto" is selected */}
          {serviceType === "Presupuesto" && (
            <div className="mt-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Este servicio requiere presupuesto</span>
                </div>
                {linkedBudget ? (
                  <Link
                    to={`/presupuestos/${linkedBudget.id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver presupuesto {linkedBudget.id}
                  </Link>
                ) : (
                  <Button size="sm" variant="default" onClick={handleCreateBudget} disabled={saving}>
                    <FileText className="w-4 h-4 mr-1" />
                    {saving ? "Guardando..." : "Crear presupuesto"}
                  </Button>
                )}
              </div>
              {!linkedBudget && (
                <p className="text-xs text-muted-foreground mt-2">
                  Al crear el presupuesto, el servicio se guardará automáticamente y se vinculará al presupuesto.
                </p>
              )}
            </div>
          )}
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
        </CardContent>
      </Card>

      {/* ── SECTION 4: Photos ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Fotografías</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado actual */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-muted-foreground" />
              Estado actual
            </Label>
            <p className="text-xs text-muted-foreground">Fotos del estado actual antes de la intervención</p>
            <input
              ref={currentStateRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setCurrentStateImages((prev) => [...prev, ...files]);
                e.target.value = "";
              }}
            />
            {currentStateImages.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-2">
                {currentStateImages.map((f, i) => (
                  <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCurrentStateImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              className="border-2 border-dashed border-border rounded-lg p-5 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => currentStateRef.current?.click()}
            >
              <Image className="w-7 h-7 text-muted-foreground mx-auto mb-1.5" />
              <p className="text-sm text-muted-foreground">
                Arrastra fotos o <span className="text-primary font-medium">seleccionar archivos</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG · Máx. 20MB por archivo</p>
            </div>
          </div>

          <Separator />

          {/* Estado reparado */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="w-4 h-4 text-muted-foreground" />
              Estado reparado
            </Label>
            <p className="text-xs text-muted-foreground">Fotos del estado tras la reparación</p>
            <input
              ref={repairedStateRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setRepairedStateImages((prev) => [...prev, ...files]);
                e.target.value = "";
              }}
            />
            {repairedStateImages.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-2">
                {repairedStateImages.map((f, i) => (
                  <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setRepairedStateImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              className="border-2 border-dashed border-border rounded-lg p-5 text-center hover:border-success/50 transition-colors cursor-pointer"
              onClick={() => repairedStateRef.current?.click()}
            >
              <Image className="w-7 h-7 text-muted-foreground mx-auto mb-1.5" />
              <p className="text-sm text-muted-foreground">
                Arrastra fotos o <span className="text-success font-medium">seleccionar archivos</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG · Máx. 20MB por archivo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 5: Assignment & Scheduling ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">5. Asignación y Planificación</CardTitle>
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
                emptyText={`No hay operarios disponibles para ${specialty}`}
                options={[
                  { value: "none", label: "Sin asignar" },
                  ...availableOperators.map((o) => ({
                    value: o.id,
                    label: o.name,
                    subtitle: `NPS ${o.npsMean} · ${o.activeServices} activos · ${o.specialty}`,
                  })),
                ]}
              />
              {selectedOperator && (
                <p className="text-xs text-muted-foreground">
                  {selectedOperator.specialty}{selectedOperator.secondarySpecialty ? ` + ${selectedOperator.secondarySpecialty}` : ""} · Clústeres: {selectedOperator.clusterIds.join(", ")} · Resp. media: {selectedOperator.avgResponseTime} min
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Clúster / Zona</Label>
              <Input value={selectedClient?.clusterId ?? ""} readOnly className="bg-muted" placeholder="Se asigna automáticamente del cliente" />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fecha inicio prevista</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !scheduledDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "d MMM yyyy", { locale: es }) : "Sin fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} initialFocus className={cn("p-3 pointer-events-auto")} />
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
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !scheduledEndDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledEndDate ? format(scheduledEndDate, "d MMM yyyy", { locale: es }) : "Sin fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={scheduledEndDate} onSelect={setScheduledEndDate} initialFocus className={cn("p-3 pointer-events-auto")} />
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

      

      {/* ── SECTION 6: Internal notes ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">6. Notas internas</CardTitle>
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
        <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
        <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> {saving ? "Guardando..." : "Registrar (Pte. Contacto)"}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving}>
          <Send className="w-4 h-4 mr-2" /> {saving ? "Guardando..." : "Registrar y Agendar"}
        </Button>
      </div>

      {/* Budget creation prompt */}
      <AlertDialog open={showBudgetPrompt} onOpenChange={setShowBudgetPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Crear presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Has seleccionado que este servicio requiere presupuesto. ¿Quieres crearlo ahora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Más tarde</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateBudget}>Crear presupuesto</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}
