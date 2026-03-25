import { useState, useMemo } from "react";
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, type Vehicle } from "@/hooks/useVehicles";
import { useOperators } from "@/hooks/useOperators";
import { useBranches } from "@/hooks/useBranches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VoiceTextarea as Textarea } from "@/components/ui/voice-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, Plus, ArrowLeft, Car, Fuel, Calendar, Gauge, Shield, Wrench,
  MapPin, User, Pencil, Trash2, Save, Loader2, AlertTriangle, CheckCircle2, X,
} from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const emptyVehicle: Omit<Vehicle, "id"> = {
  plate: "", brand: "", model: "", year: new Date().getFullYear(), color: "",
  fuelType: "Diésel", vin: "", insuranceCompany: "", insurancePolicy: "",
  insuranceExpiry: null, itvExpiry: null, nextMaintenanceDate: null,
  lastMaintenanceDate: null, mileage: 0, status: "Activo",
  operatorId: null, branchId: null, photo: "", notes: "",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Activo: { label: "Activo", color: "bg-success/15 text-success border-success/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  Taller: { label: "En taller", color: "bg-warning/15 text-warning border-warning/30", icon: <Wrench className="w-3 h-3" /> },
  Inactivo: { label: "Inactivo", color: "bg-muted text-muted-foreground border-border", icon: <X className="w-3 h-3" /> },
};

const fuelTypes = ["Diésel", "Gasolina", "Híbrido", "Eléctrico", "GLP", "GNC"];

function getDaysUntil(date: string | null): number | null {
  if (!date) return null;
  return differenceInCalendarDays(parseISO(date), new Date());
}

function ExpiryBadge({ date, label }: { date: string | null; label: string }) {
  if (!date) return <span className="text-xs text-muted-foreground">Sin fecha</span>;
  const days = getDaysUntil(date)!;
  const isExpired = days < 0;
  const isWarning = days >= 0 && days <= 30;
  return (
    <div className="flex items-center gap-1.5">
      {(isExpired || isWarning) && <AlertTriangle className={cn("w-3 h-3", isExpired ? "text-destructive" : "text-warning")} />}
      <span className={cn("text-sm", isExpired ? "text-destructive font-medium" : isWarning ? "text-warning font-medium" : "text-foreground")}>
        {format(parseISO(date), "d MMM yyyy", { locale: es })}
      </span>
      {isExpired && <Badge variant="destructive" className="text-[10px] h-4 px-1">Vencido</Badge>}
      {isWarning && !isExpired && <Badge className="text-[10px] h-4 px-1 bg-warning/15 text-warning border-warning/30">{days}d</Badge>}
    </div>
  );
}

// ─── VEHICLE FORM ──────────────────────────────────────────
function VehicleForm({ initial, onSave, onCancel, saving }: {
  initial: Omit<Vehicle, "id"> & { id?: string };
  onSave: (v: Omit<Vehicle, "id"> & { id?: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const { data: operators = [] } = useOperators();
  const { data: branches = [] } = useBranches();
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Datos del vehículo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Matrícula *</Label>
                <Input value={form.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} placeholder="0000 XXX" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estado</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Marca</Label>
                <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Modelo</Label>
                <Input value={form.model} onChange={(e) => set("model", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Año</Label>
                <Input type="number" value={form.year ?? ""} onChange={(e) => set("year", e.target.value ? parseInt(e.target.value) : null)} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <Input value={form.color} onChange={(e) => set("color", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Combustible</Label>
                <Select value={form.fuelType} onValueChange={(v) => set("fuelType", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nº bastidor (VIN)</Label>
              <Input value={form.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} className="h-8 text-sm" placeholder="WVWZZZ3CZWE123456" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kilometraje</Label>
              <Input type="number" min={0} value={form.mileage} onChange={(e) => set("mileage", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Seguro, ITV y mantenimiento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Compañía de seguros</Label>
                <Input value={form.insuranceCompany} onChange={(e) => set("insuranceCompany", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nº póliza</Label>
                <Input value={form.insurancePolicy} onChange={(e) => set("insurancePolicy", e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vencimiento seguro</Label>
              <Input type="date" value={form.insuranceExpiry ?? ""} onChange={(e) => set("insuranceExpiry", e.target.value || null)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vencimiento ITV</Label>
              <Input type="date" value={form.itvExpiry ?? ""} onChange={(e) => set("itvExpiry", e.target.value || null)} className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Último mantenimiento</Label>
                <Input type="date" value={form.lastMaintenanceDate ?? ""} onChange={(e) => set("lastMaintenanceDate", e.target.value || null)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Próximo mantenimiento</Label>
                <Input type="date" value={form.nextMaintenanceDate ?? ""} onChange={(e) => set("nextMaintenanceDate", e.target.value || null)} className="h-8 text-sm" />
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Operario asignado</Label>
                <Select value={form.operatorId || "none"} onValueChange={(v) => set("operatorId", v === "none" ? null : v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {operators.map((op) => (
                      <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sede</Label>
                <Select value={form.branchId || "none"} onValueChange={(v) => set("branchId", v === "none" ? null : v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin sede</SelectItem>
                    {branches.filter((b) => b.active).map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notas</Label>
                <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="text-sm" placeholder="Observaciones..." />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(form)} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {form.id ? "Guardar cambios" : "Crear vehículo"}
        </Button>
      </div>
    </div>
  );
}

// ─── INFO ROW ──────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm text-foreground">{value || "—"}</div>
      </div>
    </div>
  );
}

// ─── VEHICLE DETAIL ────────────────────────────────────────
function VehicleDetail({ vehicle, onBack }: { vehicle: Vehicle; onBack: () => void }) {
  const { data: vehicles = [] } = useVehicles();
  const fresh = vehicles.find((v) => v.id === vehicle.id) ?? vehicle;
  const { data: operators = [] } = useOperators();
  const { data: branches = [] } = useBranches();
  const updateVehicle = useUpdateVehicle();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const stCfg = statusConfig[fresh.status] ?? statusConfig.Activo;
  const operator = operators.find((o) => o.id === fresh.operatorId);
  const branch = branches.find((b) => b.id === fresh.branchId);

  const handleSave = async (form: Omit<Vehicle, "id"> & { id?: string }) => {
    if (!form.plate.trim()) { toast.error("La matrícula es obligatoria"); return; }
    setSaving(true);
    try {
      await updateVehicle.mutateAsync({ id: fresh.id, ...form } as Vehicle);
      toast.success("Vehículo actualizado");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Car className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">{fresh.plate}</h2>
            <p className="text-sm text-muted-foreground">{fresh.brand} {fresh.model} {fresh.year ? `(${fresh.year})` : ""}</p>
          </div>
          <Badge variant="outline" className={cn("ml-2", stCfg.color)}>
            {stCfg.icon} <span className="ml-1">{stCfg.label}</span>
          </Badge>
        </div>
      </div>

      {isEditing ? (
        <VehicleForm
          initial={{ ...fresh }}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          saving={saving}
        />
      ) : (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
              <Pencil className="w-4 h-4" /> Editar
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Datos del vehículo</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={<Car className="w-4 h-4" />} label="Marca / Modelo" value={`${fresh.brand} ${fresh.model}`} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Año" value={fresh.year?.toString() ?? "—"} />
                <InfoRow icon={<span className="w-4 h-4 rounded-full border-2 border-border" style={{ backgroundColor: fresh.color.toLowerCase() }} />} label="Color" value={fresh.color} />
                <InfoRow icon={<Fuel className="w-4 h-4" />} label="Combustible" value={fresh.fuelType} />
                <InfoRow icon={<Shield className="w-4 h-4" />} label="Nº bastidor (VIN)" value={fresh.vin} />
                <InfoRow icon={<Gauge className="w-4 h-4" />} label="Kilometraje" value={`${fresh.mileage.toLocaleString("es-ES")} km`} />
                {operator && <InfoRow icon={<User className="w-4 h-4" />} label="Operario" value={operator.name} />}
                {branch && <InfoRow icon={<MapPin className="w-4 h-4" />} label="Sede" value={branch.name} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Seguro, ITV y mantenimiento</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={<Shield className="w-4 h-4" />} label="Compañía" value={fresh.insuranceCompany} />
                <InfoRow icon={<Shield className="w-4 h-4" />} label="Nº póliza" value={fresh.insurancePolicy} />
                <div className="flex items-start gap-3">
                  <div className="text-muted-foreground mt-0.5"><Calendar className="w-4 h-4" /></div>
                  <div className="flex-1"><p className="text-xs text-muted-foreground">Vencimiento seguro</p><ExpiryBadge date={fresh.insuranceExpiry} label="Seguro" /></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-muted-foreground mt-0.5"><Calendar className="w-4 h-4" /></div>
                  <div className="flex-1"><p className="text-xs text-muted-foreground">Vencimiento ITV</p><ExpiryBadge date={fresh.itvExpiry} label="ITV" /></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-muted-foreground mt-0.5"><Wrench className="w-4 h-4" /></div>
                  <div className="flex-1"><p className="text-xs text-muted-foreground">Último mantenimiento</p><ExpiryBadge date={fresh.lastMaintenanceDate} label="Mant." /></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-muted-foreground mt-0.5"><Wrench className="w-4 h-4" /></div>
                  <div className="flex-1"><p className="text-xs text-muted-foreground">Próximo mantenimiento</p><ExpiryBadge date={fresh.nextMaintenanceDate} label="Próx. mant." /></div>
                </div>
                {fresh.notes && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{fresh.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────
export default function Vehicles() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const { data: operators = [] } = useOperators();
  const createVehicle = useCreateVehicle();
  const deleteVehicle = useDeleteVehicle();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        v.plate.toLowerCase().includes(search.toLowerCase()) ||
        v.brand.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || v.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [vehicles, search, filterStatus]);

  const handleCreate = async (form: Omit<Vehicle, "id"> & { id?: string }) => {
    if (!form.plate.trim()) { toast.error("La matrícula es obligatoria"); return; }
    setSaving(true);
    try {
      await createVehicle.mutateAsync(form);
      toast.success("Vehículo creado");
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVehicle.mutateAsync(id);
      toast.success("Vehículo eliminado");
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  if (selectedVehicle) {
    return <VehicleDetail vehicle={selectedVehicle} onBack={() => setSelectedVehicle(null)} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeCount = vehicles.filter((v) => v.status === "Activo").length;
  const workshopCount = vehicles.filter((v) => v.status === "Taller").length;
  const expiringSoonCount = vehicles.filter((v) => {
    const itvDays = getDaysUntil(v.itvExpiry);
    const insDays = getDaysUntil(v.insuranceExpiry);
    return (itvDays !== null && itvDays <= 30) || (insDays !== null && insDays <= 30);
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Vehículos</h1>
          <p className="text-muted-foreground text-sm mt-1">{vehicles.length} vehículos registrados</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo vehículo
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-xl font-bold text-foreground">{vehicles.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Activos</p>
          <p className="text-xl font-bold text-success">{activeCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">En taller</p>
          <p className="text-xl font-bold text-warning">{workshopCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vencimientos próximos</p>
          <p className="text-xl font-bold text-destructive">{expiringSoonCount}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por matrícula, marca o modelo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Matrícula</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Marca / Modelo</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Combustible</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Operario</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Km</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">ITV</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Seguro</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-center px-5 py-3 text-muted-foreground font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const st = statusConfig[v.status] ?? statusConfig.Activo;
                const op = operators.find((o) => o.id === v.operatorId);
                return (
                  <tr
                    key={v.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedVehicle(v)}
                  >
                    <td className="px-5 py-3 font-mono font-semibold text-foreground">{v.plate}</td>
                    <td className="px-5 py-3">
                      <span className="text-foreground">{v.brand} {v.model}</span>
                      {v.year && <span className="ml-1 text-xs text-muted-foreground">({v.year})</span>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{v.fuelType}</td>
                    <td className="px-5 py-3 text-muted-foreground">{op?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{v.mileage.toLocaleString("es-ES")}</td>
                    <td className="px-5 py-3"><ExpiryBadge date={v.itvExpiry} label="ITV" /></td>
                    <td className="px-5 py-3"><ExpiryBadge date={v.insuranceExpiry} label="Seguro" /></td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={cn("text-xs", st.color)}>{st.icon}<span className="ml-1">{st.label}</span></Badge>
                    </td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(v.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">
                    No se encontraron vehículos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo vehículo</DialogTitle>
          </DialogHeader>
          <VehicleForm
            initial={emptyVehicle}
            onSave={handleCreate}
            onCancel={() => setDialogOpen(false)}
            saving={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
