import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMonthlyTargets, useUpsertMonthlyTarget, useDeleteMonthlyTarget, type MonthlyTarget } from "@/hooks/useMonthlyTargets";
import { Plus, Loader2, Target, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

type MetricKey = "targetRevenue" | "targetServices" | "targetNps" | "targetMargin" | "targetMaxCosts" | "targetNewClients" | "targetAvgResponseHours";

interface MetricRow {
  key: MetricKey;
  label: string;
  group?: string;
  format: (v: number) => string;
  color: string;
  editable: boolean;
  step?: number;
  max?: number;
}

const metricRows: MetricRow[] = [
  { key: "targetRevenue", label: "Ventas objetivo", group: "Ingresos", format: v => `${v.toLocaleString()}€`, color: "hsl(var(--primary))", editable: true },
  { key: "targetMaxCosts", label: "Costes máximos", format: v => `${v.toLocaleString()}€`, color: "hsl(var(--destructive))", editable: false },
  { key: "targetMargin", label: "Margen objetivo", group: "Rendimiento", format: v => `${v}%`, color: "hsl(142 71% 45%)", editable: true, max: 100 },
  { key: "targetServices", label: "Nº servicios", format: v => String(v), color: "hsl(var(--primary))", editable: true, step: 1 },
  { key: "targetNps", label: "NPS medio", format: v => v.toFixed(1), color: "hsl(45 93% 47%)", editable: true, step: 0.1, max: 10 },
  { key: "targetNewClients", label: "Nuevos clientes", group: "Clientes", format: v => String(v), color: "hsl(262 83% 58%)", editable: true, step: 1 },
  { key: "targetAvgResponseHours", label: "Tiempo respuesta", format: v => `${v}h`, color: "hsl(var(--muted-foreground))", editable: true, step: 0.5 },
];

export default function MonthlyTargetsTab() {
  const { data: targets = [], isLoading } = useMonthlyTargets();
  const upsert = useUpsertMonthlyTarget();
  const remove = useDeleteMonthlyTarget();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newForm, setNewForm] = useState(emptyForm);
  const [editingCell, setEditingCell] = useState<{ monthId: string; key: MetricKey } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const currentMonth = format(new Date(), "yyyy-MM");

  const sorted = useMemo(
    () => [...targets].sort((a, b) => a.month.localeCompare(b.month)),
    [targets]
  );

  const formatMonthShort = (m: string) => {
    try {
      const d = parse(m, "yyyy-MM", new Date());
      return format(d, "MMM yy", { locale: es });
    } catch {
      return m;
    }
  };

  const chartData = useMemo(
    () =>
      sorted.map(t => ({
        name: formatMonthShort(t.month),
        ventas: t.targetRevenue,
        costes: t.targetMaxCosts,
      })),
    [sorted]
  );

  const startEdit = (monthId: string, key: MetricKey, currentValue: number) => {
    setEditingCell({ monthId, key });
    setEditValue(String(currentValue));
  };

  const saveEdit = (target: MonthlyTarget) => {
    if (!editingCell) return;
    const numVal = Number(editValue);
    const updated: any = { ...target, [editingCell.key]: numVal };
    // recalc costs
    if (editingCell.key === "targetRevenue" || editingCell.key === "targetMargin") {
      const rev = editingCell.key === "targetRevenue" ? numVal : target.targetRevenue;
      const mar = editingCell.key === "targetMargin" ? numVal : target.targetMargin;
      updated.targetMaxCosts = mar > 0 ? Math.round(rev * (1 - mar / 100)) : target.targetMaxCosts;
    }
    upsert.mutate(
      { id: updated.id, month: updated.month, targetRevenue: updated.targetRevenue, targetServices: updated.targetServices, targetNps: updated.targetNps, targetMargin: updated.targetMargin, targetMaxCosts: updated.targetMaxCosts, targetNewClients: updated.targetNewClients, targetAvgResponseHours: updated.targetAvgResponseHours, notes: updated.notes },
      { onSuccess: () => setEditingCell(null) }
    );
  };

  const cancelEdit = () => setEditingCell(null);

  const handleNewRevenueChange = (v: number) => {
    setNewForm(prev => ({
      ...prev,
      targetRevenue: v,
      targetMaxCosts: prev.targetMargin > 0 ? Math.round(v * (1 - prev.targetMargin / 100)) : prev.targetMaxCosts,
    }));
  };

  const handleNewMarginChange = (v: number) => {
    setNewForm(prev => ({
      ...prev,
      targetMargin: v,
      targetMaxCosts: v > 0 ? Math.round(prev.targetRevenue * (1 - v / 100)) : prev.targetMaxCosts,
    }));
  };

  const handleNewSave = () => {
    upsert.mutate(newForm, {
      onSuccess: () => {
        setShowNewDialog(false);
        setNewForm(emptyForm);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
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
              <CardDescription>Haz clic en cualquier celda para editarla</CardDescription>
            </div>
            <Button size="sm" onClick={() => { setNewForm(emptyForm); setShowNewDialog(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo mes
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Sin objetivos definidos</p>
              <p className="text-xs text-muted-foreground mt-1">Crea el primer objetivo mensual para tu equipo</p>
              <Button size="sm" className="mt-4" onClick={() => { setNewForm(emptyForm); setShowNewDialog(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Crear objetivo
              </Button>
            </div>
          ) : (
            <>
              {/* Chart */}
              {sorted.length >= 2 && (
                <div className="px-6 pt-2 pb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => `${v.toLocaleString()}€`}
                      />
                      <Line type="monotone" dataKey="ventas" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Ventas" />
                      <Line type="monotone" dataKey="costes" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 4 }} name="Costes máx." />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Pivot table: rows=metrics, cols=months */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] sticky left-0 bg-card z-10">Indicador</TableHead>
                      {sorted.map(t => {
                        const isCurrent = t.month === currentMonth;
                        return (
                          <TableHead
                            key={t.month}
                            className={cn(
                              "text-center min-w-[120px] capitalize relative",
                              isCurrent && "bg-primary/5"
                            )}
                          >
                            <span>{formatMonthShort(t.month)}</span>
                            {isCurrent && (
                              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                            )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metricRows.map((row, idx) => (
                      <>
                        {row.group && (
                          <TableRow key={`group-${row.group}`} className="bg-muted/30 hover:bg-muted/30">
                            <TableCell
                              colSpan={sorted.length + 1}
                              className="sticky left-0 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                                {row.group}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow key={row.key}>
                          <TableCell className="sticky left-0 bg-card z-10 font-medium text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: row.color }} />
                              {row.label}
                            </div>
                          </TableCell>
                          {sorted.map(t => {
                            const val = t[row.key] as number;
                            const isEditing = editingCell?.monthId === t.id && editingCell.key === row.key;
                            const isCurrent = t.month === currentMonth;

                            if (isEditing) {
                              return (
                                <TableCell key={t.id} className={cn("p-1 text-center", isCurrent && "bg-primary/5")}>
                                  <Input
                                    autoFocus
                                    type="number"
                                    className="h-8 text-center text-sm w-full"
                                    value={editValue}
                                    min={0}
                                    max={row.max}
                                    step={row.step || 1}
                                    onChange={e => setEditValue(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === "Enter") saveEdit(t);
                                      if (e.key === "Escape") cancelEdit();
                                    }}
                                    onBlur={() => saveEdit(t)}
                                  />
                                </TableCell>
                              );
                            }

                            return (
                              <TableCell
                                key={t.id}
                                className={cn(
                                  "text-center tabular-nums text-sm",
                                  isCurrent && "bg-primary/5 font-semibold",
                                  row.editable && "cursor-pointer hover:bg-muted/50 transition-colors",
                                  !row.editable && "text-muted-foreground"
                                )}
                                onClick={() => row.editable && startEdit(t.id, row.key, val)}
                              >
                                {row.format(val)}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </>
                    ))}
                    {/* Delete row */}
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="sticky left-0 bg-card z-10" />
                      {sorted.map(t => (
                        <TableCell key={t.id} className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-muted-foreground hover:text-destructive"
                            onClick={() => remove.mutate(t.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* New month dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo objetivo mensual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mes</Label>
              <Input type="month" value={newForm.month} onChange={e => setNewForm(p => ({ ...p, month: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Ventas (€)" value={newForm.targetRevenue} onChange={handleNewRevenueChange} />
              <FieldInput label="Servicios" value={newForm.targetServices} onChange={v => setNewForm(p => ({ ...p, targetServices: v }))} step={1} />
              <FieldInput label="NPS" value={newForm.targetNps} onChange={v => setNewForm(p => ({ ...p, targetNps: v }))} step={0.1} max={10} />
              <FieldInput label="Margen %" value={newForm.targetMargin} onChange={handleNewMarginChange} max={100} />
              <FieldInput label="Nuevos clientes" value={newForm.targetNewClients} onChange={v => setNewForm(p => ({ ...p, targetNewClients: v }))} step={1} />
              <FieldInput label="Resp. media (h)" value={newForm.targetAvgResponseHours} onChange={v => setNewForm(p => ({ ...p, targetAvgResponseHours: v }))} step={0.5} />
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm">
              <span className="text-muted-foreground">Costes máx. calculados: </span>
              <span className="font-bold">€{newForm.targetMaxCosts.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={newForm.notes} onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Observaciones..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleNewSave} disabled={upsert.isPending || !newForm.month}>
              {upsert.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear objetivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldInput({ label, value, onChange, step = 1, max }: { label: string; value: number; onChange: (v: number) => void; step?: number; max?: number }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="number" min={0} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}
