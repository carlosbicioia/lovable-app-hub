import { useState } from "react";
import { mockOperators } from "@/data/mockData";
import { useServices } from "@/hooks/useServices";
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
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const specialtyIcon: Record<Specialty, React.ReactNode> = {
  "Fontanería/Agua": <Droplets className="w-4 h-4" />,
  "Electricidad/Luz": <Zap className="w-4 h-4" />,
  Clima: <Wind className="w-4 h-4" />,
};

const specialtyColor: Record<Specialty, string> = {
  "Fontanería/Agua": "bg-info/15 text-info border-info/30",
  "Electricidad/Luz": "bg-warning/15 text-warning border-warning/30",
  Clima: "bg-success/15 text-success border-success/30",
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
function OperatorList({ onSelect }: { onSelect: (op: Operator) => void }) {
  const [search, setSearch] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState<Specialty | "all">("all");
  const { services } = useServices();

  const filtered = mockOperators.filter((op) => {
    const matchSearch =
      op.name.toLowerCase().includes(search.toLowerCase()) ||
      op.id.toLowerCase().includes(search.toLowerCase()) ||
      op.city.toLowerCase().includes(search.toLowerCase());
    const matchSpecialty =
      filterSpecialty === "all" ||
      op.specialty === filterSpecialty ||
      op.secondarySpecialty === filterSpecialty;
    return matchSearch && matchSpecialty;
  });

  const totalActive = mockOperators.filter((o) => o.status === "Activo").length;
  const avgNps = mockOperators.reduce((sum, o) => sum + o.npsMean, 0) / mockOperators.length;
  const totalRevenue = mockOperators.reduce((sum, o) => sum + o.totalRevenue, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Operarios</h1>
        <p className="text-sm text-muted-foreground">Gestión del equipo técnico y rendimiento</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3.5 h-3.5" /> Total operarios
            </div>
            <p className="text-2xl font-bold text-foreground">{mockOperators.length}</p>
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
              {mockOperators.reduce((sum, o) => sum + o.completedServices, 0)}
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
        <div className="flex gap-1">
          {(["all", "Fontanería/Agua", "Electricidad/Luz", "Clima"] as const).map((s) => (
            <Button
              key={s}
              variant={filterSpecialty === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSpecialty(s)}
              className="text-xs"
            >
              {s === "all" ? "Todas" : s.split("/")[0]}
            </Button>
          ))}
        </div>
      </div>

      {/* Operator cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((op) => {
          const stCfg = statusConfig[op.status];
          const assignedServices = services.filter(
            (s) => s.operatorId === op.id && ["En_Curso", "Agendado"].includes(s.status)
          ).length;

          return (
            <Card
              key={op.id}
              className="cursor-pointer hover:ring-2 hover:ring-ring transition-all group"
              onClick={() => onSelect(op)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
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
                    <p className="text-xs text-muted-foreground">{op.id} · {op.city}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border", specialtyColor[op.specialty])}>
                        {specialtyIcon[op.specialty]}
                        {op.specialty.split("/")[0]}
                      </span>
                      {op.secondarySpecialty && (
                        <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border opacity-70", specialtyColor[op.secondarySpecialty])}>
                          {specialtyIcon[op.secondarySpecialty]}
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
function OperatorDetail({ operator, onBack }: { operator: Operator; onBack: () => void }) {
  const stCfg = statusConfig[operator.status];
  const { services } = useServices();

  const operatorServices = services.filter((s) => s.operatorId === operator.id);
  const activeServices = operatorServices.filter((s) => ["En_Curso", "Agendado", "Pendiente_Contacto"].includes(s.status));
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
            <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", specialtyColor[operator.specialty])}>
              {specialtyIcon[operator.specialty]} {operator.specialty}
            </span>
            {operator.secondarySpecialty && (
              <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", specialtyColor[operator.secondarySpecialty])}>
                {specialtyIcon[operator.secondarySpecialty]} {operator.secondarySpecialty}
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

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="services">Servicios ({operatorServices.length})</TabsTrigger>
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
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Acceso app</p>
                  <p className="text-sm text-foreground">{operator.email}</p>
                  <p className="text-xs text-muted-foreground">Contraseña gestionada vía sistema de autenticación</p>
                </div>
              </CardContent>
            </Card>
          </div>
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
      </Tabs>
    </div>
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

// ─── MAIN ──────────────────────────────────────────────────
export default function Operators() {
  const [selected, setSelected] = useState<Operator | null>(null);

  if (selected) {
    return <OperatorDetail operator={selected} onBack={() => setSelected(null)} />;
  }

  return <OperatorList onSelect={setSelected} />;
}
