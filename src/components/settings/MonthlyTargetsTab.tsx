import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMonthlyTargets, useUpsertMonthlyTarget, useDeleteMonthlyTarget, type MonthlyTarget } from "@/hooks/useMonthlyTargets";
import { Plus, Pencil, Trash2, Loader2, Target, Euro, Wrench, Star, Percent, Users, Clock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const emptyForm = {
  month: format(new Date(), "yyyy-MM"),
  targetRevenue: 0,
  targetServices: 0,
  targetNps: 8,
  targetMargin: 30,
  targetMaxCosts: 0,
  targetNewClients: 0,
  targetAvgResponseHours: 12,
  notes: "",
};

export default function MonthlyTargetsTab() {
  const { data: targets = [], isLoading } = useMonthlyTargets();
  const upsert = useUpsertMonthlyTarget();
  const remove = useDeleteMonthlyTarget();

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (t: MonthlyTarget) => {
    setEditingId(t.id);
    setForm({
      month: t.month,
      targetRevenue: t.targetRevenue,
      targetServices: t.targetServices,
      targetNps: t.targetNps,
      targetMargin: t.targetMargin,
      targetMaxCosts: t.targetMaxCosts,
      targetNewClients: t.targetNewClients,
      targetAvgResponseHours: t.targetAvgResponseHours,
      notes: t.notes,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    upsert.mutate(
      { ...form, ...(editingId ? { id: editingId } : {}) },
      { onSuccess: () => setShowDialog(false) }
    );
  };

  // Auto-calculate max costs when revenue or margin change
  const handleRevenueChange = (v: number) => {
    setForm(prev => ({
      ...prev,
      targetRevenue: v,
      targetMaxCosts: prev.targetMargin > 0 ? Math.round(v * (1 - prev.targetMargin / 100)) : prev.targetMaxCosts,
    }));
  };

  const handleMarginChange = (v: number) => {
    setForm(prev => ({
      ...prev,
      targetMargin: v,
      targetMaxCosts: v > 0 ? Math.round(prev.targetRevenue * (1 - v / 100)) : prev.targetMaxCosts,
    }));
  };

  const formatMonth = (m: string) => {
    try {
      const d = parse(m, "yyyy-MM", new Date());
      return format(d, "MMMM yyyy", { locale: es });
    } catch {
      return m;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Objetivos Mensuales
              </CardTitle>
              <CardDescription>Define los objetivos clave de rendimiento para cada mes</CardDescription>
            </div>
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo mes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {targets.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Sin objetivos definidos</p>
              <p className="text-xs text-muted-foreground mt-1">Crea el primer objetivo mensual para tu equipo</p>
              <Button size="sm" className="mt-4" onClick={openNew}>
                <Plus className="w-4 h-4 mr-1" /> Crear objetivo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {targets.map((t) => {
                const isCurrentMonth = t.month === format(new Date(), "yyyy-MM");
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "border rounded-lg p-4 hover:bg-muted/30 transition-colors",
                      isCurrentMonth ? "border-primary/40 bg-primary/5" : "border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <CalendarDays className={cn("w-5 h-5", isCurrentMonth ? "text-primary" : "text-muted-foreground")} />
                        <span className="font-semibold text-foreground capitalize">{formatMonth(t.month)}</span>
                        {isCurrentMonth && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                            Mes actual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(t)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-destructive hover:text-destructive"
                          onClick={() => remove.mutate(t.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                      <MetricCard icon={Euro} label="Ventas" value={`€${t.targetRevenue.toLocaleString()}`} color="text-success" />
                      <MetricCard icon={Wrench} label="Servicios" value={String(t.targetServices)} color="text-primary" />
                      <MetricCard icon={Star} label="NPS" value={t.targetNps.toFixed(1)} color="text-warning" />
                      <MetricCard icon={Percent} label="Margen" value={`${t.targetMargin}%`} color="text-info" />
                      <MetricCard icon={Euro} label="Costes máx." value={`€${t.targetMaxCosts.toLocaleString()}`} color="text-destructive" />
                      <MetricCard icon={Users} label="Nuevos clientes" value={String(t.targetNewClients)} color="text-foreground" />
                      <MetricCard icon={Clock} label="Resp. media" value={`${t.targetAvgResponseHours}h`} color="text-muted-foreground" />
                    </div>

                    {t.notes && (
                      <p className="text-xs text-muted-foreground mt-3 italic">{t.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar objetivo" : "Nuevo objetivo mensual"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mes</Label>
              <Input
                type="month"
                value={form.month}
                onChange={(e) => setForm(prev => ({ ...prev, month: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Euro className="w-3.5 h-3.5 text-success" /> Ventas objetivo (€)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.targetRevenue}
                  onChange={(e) => handleRevenueChange(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-primary" /> Nº servicios objetivo
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.targetServices}
                  onChange={(e) => setForm(prev => ({ ...prev, targetServices: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-warning" /> NPS medio objetivo
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={form.targetNps}
                  onChange={(e) => setForm(prev => ({ ...prev, targetNps: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-info" /> Margen objetivo (%)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.targetMargin}
                  onChange={(e) => handleMarginChange(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Costes máximos calculados</p>
                  <p className="text-lg font-bold text-foreground">€{form.targetMaxCosts.toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ventas × (1 − Margen) = €{form.targetRevenue.toLocaleString()} × {((100 - form.targetMargin) / 100).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Nuevos clientes
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.targetNewClients}
                  onChange={(e) => setForm(prev => ({ ...prev, targetNewClients: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Tiempo respuesta (horas)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.targetAvgResponseHours}
                  onChange={(e) => setForm(prev => ({ ...prev, targetAvgResponseHours: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observaciones, contexto o prioridades del mes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsert.isPending || !form.month}>
              {upsert.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Guardar cambios" : "Crear objetivo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("w-3.5 h-3.5", color)} />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn("text-sm font-bold", color)}>{value}</p>
    </div>
  );
}
