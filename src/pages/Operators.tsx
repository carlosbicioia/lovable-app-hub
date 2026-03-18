import { useState, useMemo } from "react";
import { useOperators } from "@/hooks/useOperators";
import { useServices } from "@/hooks/useServices";
import { useBranches } from "@/hooks/useBranches";
import { useSpecialties, useCertifications } from "@/hooks/useIndustrialConfig";
import { useTimeRecords, useCreateTimeRecord, useDeleteTimeRecord } from "@/hooks/useTimeRecords";
import { useToast } from "@/hooks/use-toast";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/shared/BulkActionBar";
import { exportCsv } from "@/lib/exportCsv";
import { useArticles } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import OperatorEditForm from "@/components/operators/OperatorEditForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  Droplets,
  Zap,
  Wind,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  Wrench,
  Car,
  ShieldCheck,
  CalendarDays,
  ArrowLeft,
  TrendingUp,
  Activity,
  Users,
  Plus,
  X,
  Save,
  Loader2,
  Trash2,
  Palmtree,
  Hammer,
} from "lucide-react";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Operator, Specialty, OperatorStatus } from "@/types/urbango";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const fallbackIconMap: Record<string, React.ReactNode> = {
  Droplets: <Droplets className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Wind: <Wind className="w-4 h-4" />,
  Hammer: <Hammer className="w-4 h-4" />,
  Wrench: <Wrench className="w-4 h-4" />,
};

// These are kept as fallback defaults; the dynamic data comes from useSpecialties()
const specialtyIcon: Record<string, React.ReactNode> = {
  "Fontanería/Agua": <Droplets className="w-4 h-4" />,
  "Electricidad/Luz": <Zap className="w-4 h-4" />,
  Clima: <Wind className="w-4 h-4" />,
  Carpintería_Metálica: <Hammer className="w-4 h-4" />,
};

const specialtyColor: Record<string, string> = {
  "Fontanería/Agua": "bg-info/15 text-info border-info/30",
  "Electricidad/Luz": "bg-warning/15 text-warning border-warning/30",
  Clima: "bg-success/15 text-success border-success/30",
  Carpintería_Metálica: "bg-orange-500/15 text-orange-600 border-orange-500/30",
};

const statusConfig: Record<OperatorStatus, { label: string; className: string }> = {
  Activo: { label: "Activo", className: "bg-success/15 text-success border-success/30" },
  Inactivo: { label: "Inactivo", className: "bg-muted text-muted-foreground border-border" },
  Vacaciones: { label: "Vacaciones", className: "bg-warning/15 text-warning border-warning/30" },
  Baja: { label: "Baja médica", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

function NpsIndicator({ value }: { value: number }) {
  const color = value >= 9 ? "text-success" : value >= 7 ? "text-warning" : "text-destructive";
  return (
    <span className={cn("font-bold text-lg", color)}>{value.toFixed(1)}</span>
  );
}

// ─── OPERATOR LIST ─────────────────────────────────────────
function OperatorList({ onSelect, onCreateNew }: { onSelect: (op: any) => void; onCreateNew: () => void }) {
  const [search, setSearch] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const { services } = useServices();
  const { data: dbSpecialties } = useSpecialties();
  const { data: allOperators = [] } = useOperators();
  const { data: branches = [] } = useBranches();
  const activeBranches = branches.filter((b) => b.active);
  const qc = useQueryClient();

  // Build dynamic icon/color maps from DB specialties
  const dynSpecialtyIcon: Record<string, React.ReactNode> = {};
  const dynSpecialtyColor: Record<string, string> = {};
  (dbSpecialties ?? []).filter(s => s.active).forEach(s => {
    dynSpecialtyIcon[s.name] = fallbackIconMap[s.icon] ?? <Wrench className="w-4 h-4" />;
    dynSpecialtyColor[s.name] = s.color;
  });
  const getSpecIcon = (name: string) => dynSpecialtyIcon[name] ?? specialtyIcon[name] ?? <Wrench className="w-4 h-4" />;
  const getSpecColor = (name: string) => dynSpecialtyColor[name] ?? specialtyColor[name] ?? "bg-muted text-muted-foreground border-border";
  const activeSpecNames = (dbSpecialties ?? []).filter(s => s.active).map(s => s.name);

  const filtered = allOperators.filter((op) => {
    const matchSearch =
      op.name.toLowerCase().includes(search.toLowerCase()) ||
      op.id.toLowerCase().includes(search.toLowerCase()) ||
      op.city.toLowerCase().includes(search.toLowerCase());
    const matchSpecialty =
      filterSpecialty === "all" ||
      op.specialty === filterSpecialty ||
      op.secondarySpecialty === filterSpecialty;
    const matchBranch = filterBranch === "all" || op.branchId === filterBranch;
    return matchSearch && matchSpecialty && matchBranch;
  });

  const { selectedIds, toggle, toggleAll, clear, allSelected, someSelected, count } = useBulkSelect(filtered);

  const totalActive = allOperators.filter((o) => o.status === "Activo").length;
  const avgNps = allOperators.length > 0 ? allOperators.reduce((sum, o) => sum + o.npsMean, 0) / allOperators.length : 0;
  const totalRevenue = allOperators.reduce((sum, o) => sum + o.totalRevenue, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Operarios</h1>
          <p className="text-sm text-muted-foreground">Gestión del equipo técnico y rendimiento</p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo operario
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3.5 h-3.5" /> Total operarios
            </div>
            <p className="text-2xl font-bold text-foreground">{allOperators.length}</p>
            <p className="text-xs text-muted-foreground">{totalActive} activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Star className="w-3.5 h-3.5" /> NPS medio
            </div>
            <NpsIndicator value={avgNps} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> Facturación total
            </div>
            <p className="text-2xl font-bold text-foreground">{(totalRevenue / 1000).toFixed(1)}k€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Wrench className="w-3.5 h-3.5" /> Servicios completados
            </div>
            <p className="text-2xl font-bold text-foreground">
              {allOperators.reduce((sum, o) => sum + o.completedServices, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, ID o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={filterSpecialty === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterSpecialty("all")}
            className="text-xs"
          >
            Todas
          </Button>
          {activeSpecNames.map((s) => (
            <Button
              key={s}
              variant={filterSpecialty === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSpecialty(s)}
              className="text-xs"
            >
              {s.split("/")[0]}
            </Button>
          ))}
        </div>
        <Select value={filterBranch} onValueChange={setFilterBranch}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <span className="text-muted-foreground mr-1">Sede:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {activeBranches.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      <BulkActionBar
        count={count}
        onClear={clear}
        onDelete={async () => {
          const ids = Array.from(selectedIds);
          for (const id of ids) {
            await supabase.from("operators").delete().eq("id", id);
          }
          qc.invalidateQueries({ queryKey: ["operators"] });
          clear();
        }}
        onExport={() => {
          const sel = filtered.filter((o) => selectedIds.has(o.id));
          const headers = ["ID", "Nombre", "Especialidad", "Ciudad", "Email", "Teléfono", "Estado"];
          const csvRows = sel.map((o) => [o.id, o.name, o.specialty, o.city, o.email, o.phone, o.status]);
          exportCsv("operarios.csv", headers, csvRows);
        }}
      />

      {/* Operator cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((op) => {
          const stCfg = statusConfig[op.status];
          const assignedServices = services.filter(
            (s) => s.operatorId === op.id && ["En_Curso", "Agendado", "Asignado"].includes(s.status)
          ).length;
          const isSelected = selectedIds.has(op.id);

          return (
            <Card
              key={op.id}
              className={cn("cursor-pointer hover:ring-2 hover:ring-ring transition-all group", isSelected && "ring-2 ring-primary")}
              onClick={() => onSelect(op)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggle(op.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 shrink-0"
                  />
                  {/* Avatar with color indicator */}
                  <div className="relative">
                    <img
                      src={op.photo}
                      alt={op.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card"
                      style={{ backgroundColor: `hsl(${op.color})` }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground truncate">{op.name}</h3>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", stCfg.className)}>
                        {stCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {op.id} · {op.city}
                      {(() => { const br = activeBranches.find(b => b.id === op.branchId); return br ? ` · ${br.name}` : ''; })()}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border", getSpecColor(op.specialty))}>
                        {getSpecIcon(op.specialty)}
                        {op.specialty.split("/")[0]}
                      </span>
                      {op.secondarySpecialty && (
                        <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border opacity-70", getSpecColor(op.secondarySpecialty))}>
                          {getSpecIcon(op.secondarySpecialty)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">NPS</p>
                    <NpsIndicator value={op.npsMean} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Servicios</p>
                    <p className="font-bold text-foreground">{op.completedServices}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Activos</p>
                    <p className="font-bold text-foreground">{assignedServices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── OPERATOR DETAIL ───────────────────────────────────────
function OperatorDetail({ operator: initialOperator, onBack }: { operator: Operator; onBack: () => void }) {
  const { data: allOperators = [] } = useOperators();
  // Use fresh data from query if available
  const operator = allOperators.find((o) => o.id === initialOperator.id) ?? initialOperator;
  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const stCfg = statusConfig[operator.status];
  const { services } = useServices();
  const { data: dbSpecialties } = useSpecialties();
  const { data: articlesData = [] } = useArticles();

  const getSpecIcon = (name: string) => {
    const sp = (dbSpecialties ?? []).find(s => s.name === name);
    if (sp) return fallbackIconMap[sp.icon] ?? <Wrench className="w-4 h-4" />;
    return specialtyIcon[name] ?? <Wrench className="w-4 h-4" />;
  };
  const getSpecColor = (name: string) => {
    const sp = (dbSpecialties ?? []).find(s => s.name === name);
    return sp?.color ?? specialtyColor[name] ?? "bg-muted text-muted-foreground border-border";
  };

  const operatorServices = services.filter((s) => s.operatorId === operator.id);
  const activeServices = operatorServices.filter((s) => ["En_Curso", "Agendado", "Asignado", "Pendiente_Contacto"].includes(s.status));
  const recentServices = [...operatorServices].sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  ).slice(0, 8);

  const avgRevPerService = operator.completedServices > 0
    ? operator.totalRevenue / operator.completedServices
    : 0;

  const chartData = operator.monthlyRevenue.map((m) => ({
    month: format(new Date(m.month + "-01"), "MMM", { locale: es }),
    revenue: m.revenue,
    services: m.services,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="relative">
          <img src={operator.photo} alt={operator.name} className="w-16 h-16 rounded-2xl object-cover" />
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background"
            style={{ backgroundColor: `hsl(${operator.color})` }}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-foreground">{operator.name}</h1>
            <span className={cn("text-xs px-2.5 py-0.5 rounded-full border font-medium", stCfg.className)}>
              {stCfg.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{operator.id} · {operator.city}, {operator.province}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", getSpecColor(operator.specialty))}>
              {getSpecIcon(operator.specialty)} {operator.specialty}
            </span>
            {operator.secondarySpecialty && (
              <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", getSpecColor(operator.secondarySpecialty))}>
                {getSpecIcon(operator.secondarySpecialty)} {operator.secondarySpecialty}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">NPS medio</p>
            <NpsIndicator value={operator.npsMean} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Servicios</p>
            <p className="text-xl font-bold text-foreground">{operator.completedServices}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Facturación</p>
            <p className="text-xl font-bold text-foreground">{(operator.totalRevenue / 1000).toFixed(1)}k€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">€/Servicio</p>
            <p className="text-xl font-bold text-foreground">{avgRevPerService.toFixed(0)}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Resp. media</p>
            <p className="text-xl font-bold text-foreground">{operator.avgResponseTime}min</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="services">Servicios ({operatorServices.length})</TabsTrigger>
          <TabsTrigger value="time-records">Registro horario</TabsTrigger>
          <TabsTrigger value="vacations">Vacaciones</TabsTrigger>
        </TabsList>

        {/* ─── INFO TAB ─── */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Personal data */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Datos personales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={operator.email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Teléfono" value={operator.phone} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Dirección" value={`${operator.address}, ${operator.city}`} />
                <InfoRow icon={<ShieldCheck className="w-4 h-4" />} label="DNI" value={operator.dni} />
                <InfoRow icon={<CalendarDays className="w-4 h-4" />} label="Alta" value={format(new Date(operator.hireDate), "d MMM yyyy", { locale: es })} />
                {operator.vehiclePlate && (
                  <InfoRow icon={<Car className="w-4 h-4" />} label="Vehículo" value={operator.vehiclePlate} />
                )}
              </CardContent>
            </Card>

            {/* Professional */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Datos profesionales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Clústeres asignados</p>
                  <div className="flex gap-1 flex-wrap">
                    {operator.clusterIds.map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Certificaciones</p>
                  <div className="flex gap-1 flex-wrap">
                    {operator.certifications.map((cert) => (
                      <Badge key={cert} variant="outline" className="text-xs">
                        <ShieldCheck className="w-3 h-3 mr-1" /> {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
                {/* Tarifas horarias */}
                {(('articleStandardHourId' in operator && operator.articleStandardHourId) || ('articleAppHourId' in operator && operator.articleAppHourId) || ('articleUrgencyHourId' in operator && operator.articleUrgencyHourId)) && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tarifas horarias</p>
                    <div className="space-y-1">
                      {([
                        { id: ('articleStandardHourId' in operator ? operator.articleStandardHourId : null) as string | null, label: "Estándar" },
                        { id: ('articleAppHourId' in operator ? operator.articleAppHourId : null) as string | null, label: "APP" },
                        { id: ('articleUrgencyHourId' in operator ? operator.articleUrgencyHourId : null) as string | null, label: "Urgencia" },
                      ] as const).map(({ id, label }) => {
                        if (!id) return null;
                        const art = articlesData.find((a) => a.id === id);
                        return art ? (
                          <div key={label} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium">{art.title} — €{art.costPrice.toFixed(2)}/h</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Acceso app</p>
                  <p className="text-sm text-foreground">{operator.email}</p>
                  <p className="text-xs text-muted-foreground">Contraseña gestionada vía sistema de autenticación</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── EDIT TAB ─── */}
        <TabsContent value="edit">
          <OperatorEditForm operator={operator as any} onSaved={() => setActiveTab("info")} />
        </TabsContent>

        {/* ─── PERFORMANCE TAB ─── */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Facturación mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value: number) => [`${value}€`, "Facturación"]}
                    />
                    <Bar dataKey="revenue" fill={`hsl(${operator.color})`} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Servicios por mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="services"
                      stroke={`hsl(${operator.color})`}
                      strokeWidth={2}
                      dot={{ fill: `hsl(${operator.color})`, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── SERVICES TAB ─── */}
        <TabsContent value="services">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {activeServices.length > 0 && (
                  <span className="text-primary mr-2">{activeServices.length} servicios activos</span>
                )}
                Historial reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentServices.map((s) => {
                  const statusCls =
                    s.status === "En_Curso" ? "bg-warning/15 text-warning" :
                    s.status === "Agendado" ? "bg-info/15 text-info" :
                    s.status === "Asignado" ? "bg-chart-4/15 text-chart-4" :
                    s.status === "Finalizado" ? "bg-success/15 text-success" :
                    s.status === "Liquidado" ? "bg-muted text-muted-foreground" :
                    "bg-destructive/15 text-destructive";

                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", specialtyColor[s.specialty])}>
                          {specialtyIcon[s.specialty]}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.id} · {s.clientName}</p>
                          <p className="text-xs text-muted-foreground">{s.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", statusCls)}>
                          {s.status.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(s.receivedAt), "dd/MM/yy")}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {recentServices.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin servicios registrados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── VACATIONS TAB ─── */}
        <TabsContent value="vacations">
          <VacationsSection operatorId={operator.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TimeRecordsSection({ operatorId }: { operatorId: string }) {
  const { data: records, isLoading } = useTimeRecords(operatorId);
  const createMutation = useCreateTimeRecord();
  const deleteMutation = useDeleteTimeRecord();
  const { services } = useServices();
  const { toast } = useToast();
  const [monthFilter, setMonthFilter] = useState(() => format(new Date(), "yyyy-MM"));
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [formHours, setFormHours] = useState("1");
  const [formServiceId, setFormServiceId] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const filtered = (records ?? []).filter((r) => r.recordDate.startsWith(monthFilter));
  const totalHours = filtered.reduce((sum, r) => sum + r.hours, 0);
  const totalDays = new Set(filtered.map((r) => r.recordDate)).size;

  const operatorServices = useMemo(
    () => services.filter((s) => s.operatorId === operatorId),
    [services, operatorId]
  );

  const handleSubmit = async () => {
    const hours = parseFloat(formHours);
    if (!formDate || isNaN(hours) || hours <= 0 || hours > 24) {
      toast({ title: "Datos inválidos", description: "Revisa la fecha y las horas (1-24)", variant: "destructive" });
      return;
    }
    try {
      await createMutation.mutateAsync({
        operatorId,
        serviceId: formServiceId || null,
        recordDate: formDate,
        hours,
        location: formLocation.trim(),
        notes: formNotes.trim() || null,
      });
      toast({ title: "Registro añadido" });
      setShowForm(false);
      setFormHours("1");
      setFormServiceId("");
      setFormLocation("");
      setFormNotes("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, operatorId });
      toast({ title: "Registro eliminado" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm">Registro horario</CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs font-mono">{totalDays} días</Badge>
            <Badge variant="secondary" className="text-xs font-mono">{totalHours.toFixed(1)}h</Badge>
          </div>
          <Input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-40 h-8 text-xs"
          />
          <Button size="sm" onClick={() => setShowForm(!showForm)} variant={showForm ? "secondary" : "default"} className="gap-1.5">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? "Cancelar" : "Añadir registro"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Manual entry form */}
        {showForm && (
          <div className="border border-border rounded-lg p-4 mb-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Fecha *</label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Horas *</label>
                <Input type="number" min="0.5" max="24" step="0.5" value={formHours} onChange={(e) => setFormHours(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Servicio</label>
                <Select value={formServiceId} onValueChange={setFormServiceId}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin servicio</SelectItem>
                    {operatorServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.id} – {s.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Ubicación</label>
                <Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Dirección o zona" className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Notas</label>
                <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Observaciones opcionales" className="h-8 text-sm" />
              </div>
              <Button size="sm" onClick={handleSubmit} disabled={createMutation.isPending} className="gap-1.5">
                {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Guardar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sin registros para este mes</p>
            <p className="text-xs text-muted-foreground mt-1">Puedes añadir registros manualmente con el botón superior</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors group">
                <div className="w-12 text-center">
                  <p className="text-lg font-bold text-foreground leading-none">
                    {format(new Date(r.recordDate), "dd")}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {format(new Date(r.recordDate), "EEE", { locale: es })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {r.serviceId && (
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">{r.serviceId}</Badge>
                    )}
                    <span className="text-sm text-foreground truncate">{r.location || "Sin ubicación"}</span>
                  </div>
                  {r.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.notes}</p>}
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.hours}h</p>
                    <p className="text-[10px] text-muted-foreground">{r.source}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => handleDelete(r.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ─── VACATIONS SECTION ─────────────────────────────────────
function VacationsSection({ operatorId }: { operatorId: string }) {
  const { toast } = useToast();
  const [vacations, setVacations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formStart, setFormStart] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [formEnd, setFormEnd] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [formNotes, setFormNotes] = useState("");
  const [yearFilter, setYearFilter] = useState(() => String(new Date().getFullYear()));

  const fetchVacations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("operator_vacations")
      .select("*")
      .eq("operator_id", operatorId)
      .order("start_date", { ascending: false });
    if (!error) setVacations(data ?? []);
    setLoading(false);
  };

  // biome-ignore lint: fetch on mount
  useState(() => { fetchVacations(); });

  const filtered = vacations.filter((v) => v.start_date.startsWith(yearFilter));
  const totalDays = filtered.reduce((sum: number, v: any) => sum + v.days, 0);

  const handleAdd = async () => {
    const start = parseISO(formStart);
    const end = parseISO(formEnd);
    const days = differenceInCalendarDays(end, start) + 1;
    if (days < 1) {
      toast({ title: "Fechas inválidas", description: "La fecha fin debe ser igual o posterior a la de inicio", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("operator_vacations").insert({
      operator_id: operatorId,
      start_date: formStart,
      end_date: formEnd,
      days,
      notes: formNotes.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vacaciones registradas" });
      setShowForm(false);
      setFormNotes("");
      fetchVacations();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("operator_vacations").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registro eliminado" });
      fetchVacations();
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palmtree className="w-4 h-4" /> Vacaciones disfrutadas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => setShowForm(!showForm)}>
              {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showForm ? "Cancelar" : "Añadir"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{totalDays}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Días en {yearFilter}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Periodos</p>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="p-3 rounded-lg border border-border bg-card space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Desde</label>
                <Input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hasta</label>
                <Input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Notas (opcional)</label>
              <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Ej: Vacaciones de verano" className="h-8 text-sm" />
            </div>
            <Button size="sm" onClick={handleAdd} className="gap-1">
              <Save className="w-3.5 h-3.5" /> Guardar
            </Button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sin vacaciones registradas en {yearFilter}</p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Palmtree className="w-4 h-4 text-success" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(parseISO(v.start_date), "d MMM", { locale: es })} – {format(parseISO(v.end_date), "d MMM yyyy", { locale: es })}
                    </p>
                    {v.notes && <p className="text-xs text-muted-foreground">{v.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{v.days} día{v.days !== 1 ? "s" : ""}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(v.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── MAIN ──────────────────────────────────────────────────
export default function Operators() {
  const [selected, setSelected] = useState<Operator | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const handleCreateNew = async () => {
    // Generate next ID
    const { data: lastOps } = await supabase
      .from("operators")
      .select("id")
      .ilike("id", "OP-%")
      .order("id", { ascending: false })
      .limit(1);
    const lastNum = lastOps?.[0] ? parseInt(lastOps[0].id.replace(/\D/g, ""), 10) || 0 : 0;
    const newId = `OP-${String(lastNum + 1).padStart(3, "0")}`;

    const { error } = await supabase.from("operators").insert({
      id: newId,
      first_name: "",
      last_name: "",
      name: "Nuevo operario",
      status: "Activo",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    await qc.invalidateQueries({ queryKey: ["operators"] });
    // Fetch fresh and navigate to detail
    const { data: freshOps } = await supabase.from("operators").select("*").eq("id", newId).single();
    if (freshOps) {
      const mapped: Operator = {
        id: freshOps.id,
        firstName: freshOps.first_name,
        lastName: freshOps.last_name,
        name: freshOps.name,
        dni: freshOps.dni,
        email: freshOps.email,
        phone: freshOps.phone,
        address: freshOps.address,
        streetNumber: freshOps.street_number ?? "",
        floor: freshOps.floor ?? "",
        addressExtra: freshOps.address_extra ?? "",
        city: freshOps.city,
        province: freshOps.province,
        photo: freshOps.photo,
        specialty: freshOps.specialty as Specialty,
        secondarySpecialty: freshOps.secondary_specialty as Specialty | null,
        clusterId: freshOps.cluster_id,
        clusterIds: freshOps.cluster_ids ?? [],
        status: freshOps.status as any,
        available: freshOps.available,
        npsMean: Number(freshOps.nps_mean),
        totalRevenue: Number(freshOps.total_revenue),
        completedServices: freshOps.completed_services,
        activeServices: freshOps.active_services,
        color: freshOps.color,
        hireDate: freshOps.hire_date ?? "",
        vehiclePlate: freshOps.vehicle_plate,
        certifications: freshOps.certifications ?? [],
        avgResponseTime: Number(freshOps.avg_response_time),
        lastServiceDate: freshOps.last_service_date,
        monthlyRevenue: [],
      };
      setSelected(mapped);
    }
  };

  if (selected) {
    return <OperatorDetail operator={selected} onBack={() => setSelected(null)} />;
  }

  return <OperatorList onSelect={setSelected} onCreateNew={handleCreateNew} />;
}
