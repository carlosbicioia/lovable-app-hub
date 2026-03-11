import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMonthlyTargets, useUpsertMonthlyTarget, useDeleteMonthlyTarget, type MonthlyTarget } from "@/hooks/useMonthlyTargets";
import { Plus, Pencil, Trash2, Loader2, Target, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

type EditingRow = {
  id: string;
  targetRevenue: number;
  targetServices: number;
  targetNps: number;
  targetMargin: number;
  targetMaxCosts: number;
  targetNewClients: number;
  targetAvgResponseHours: number;
  notes: string;
};

export default function MonthlyTargetsTab() {
  const { data: targets = [], isLoading } = useMonthlyTargets();
  const upsert = useUpsertMonthlyTarget();
  const remove = useDeleteMonthlyTarget();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newForm, setNewForm] = useState(emptyForm);
  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);

  const formatMonth = (m: string) => {
    try {
      const d = parse(m, "yyyy-MM", new Date());
      return format(d, "MMM yyyy", { locale: es });
    } catch {
      return m;
    }
  };

  const startEdit = (t: MonthlyTarget) => {
    setEditingRow({
      id: t.id,
      targetRevenue: t.targetRevenue,
      targetServices: t.targetServices,
      targetNps: t.targetNps,
      targetMargin: t.targetMargin,
      targetMaxCosts: t.targetMaxCosts,
      targetNewClients: t.targetNewClients,
      targetAvgResponseHours: t.targetAvgResponseHours,
      notes: t.notes,
    });
  };

  const cancelEdit = () => setEditingRow(null);

  const saveEdit = (month: string) => {
    if (!editingRow) return;
    upsert.mutate(
      { ...editingRow, month },
      { onSuccess: () => setEditingRow(null) }
    );
  };

  const updateEditField = (field: keyof EditingRow, value: number | string) => {
    if (!editingRow) return;
    const updated = { ...editingRow, [field]: value };
    // Auto-calc max costs
    if (field === "targetRevenue" || field === "targetMargin") {
      const rev = field === "targetRevenue" ? (value as number) : updated.targetRevenue;
      const mar = field === "targetMargin" ? (value as number) : updated.targetMargin;
      updated.targetMaxCosts = mar > 0 ? Math.round(rev * (1 - mar / 100)) : updated.targetMaxCosts;
    }
    setEditingRow(updated);
  };

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
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const isCurrentMonth = (m: string) => m === format(new Date(), "yyyy-MM");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Objetivos Mensuales
              </CardTitle>
              <CardDescription>Haz clic en el lápiz para editar directamente en la tabla</CardDescription>
            </div>
            <Button size="sm" onClick={() => { setNewForm(emptyForm); setShowNewDialog(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo mes
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {targets.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Sin objetivos definidos</p>
              <p className="text-xs text-muted-foreground mt-1">Crea el primer objetivo mensual para tu equipo</p>
              <Button size="sm" className="mt-4" onClick={() => { setNewForm(emptyForm); setShowNewDialog(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Crear objetivo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Mes</TableHead>
                  <TableHead className="text-right">Ventas (€)</TableHead>
                  <TableHead className="text-right">Servicios</TableHead>
                  <TableHead className="text-right">NPS</TableHead>
                  <TableHead className="text-right">Margen %</TableHead>
                  <TableHead className="text-right">Costes máx. (€)</TableHead>
                  <TableHead className="text-right">Nuevos clientes</TableHead>
                  <TableHead className="text-right">Resp. (h)</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((t) => {
                  const editing = editingRow?.id === t.id;
                  const current = isCurrentMonth(t.month);
                  return (
                    <TableRow key={t.id} className={cn(current && "bg-primary/5")}>
                      <TableCell className="font-medium">
                        <span className="capitalize">{formatMonth(t.month)}</span>
                        {current && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-bold align-middle">
                            Actual
                          </span>
                        )}
                      </TableCell>

                      {editing ? (
                        <>
                          <EditCell value={editingRow.targetRevenue} onChange={v => updateEditField("targetRevenue", v)} />
                          <EditCell value={editingRow.targetServices} onChange={v => updateEditField("targetServices", v)} step={1} />
                          <EditCell value={editingRow.targetNps} onChange={v => updateEditField("targetNps", v)} step={0.1} max={10} />
                          <EditCell value={editingRow.targetMargin} onChange={v => updateEditField("targetMargin", v)} max={100} />
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            €{editingRow.targetMaxCosts.toLocaleString()}
                          </TableCell>
                          <EditCell value={editingRow.targetNewClients} onChange={v => updateEditField("targetNewClients", v)} step={1} />
                          <EditCell value={editingRow.targetAvgResponseHours} onChange={v => updateEditField("targetAvgResponseHours", v)} step={0.5} />
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-primary" onClick={() => saveEdit(t.month)} disabled={upsert.isPending}>
                                {upsert.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={cancelEdit}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-right tabular-nums">€{t.targetRevenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right tabular-nums">{t.targetServices}</TableCell>
                          <TableCell className="text-right tabular-nums">{t.targetNps.toFixed(1)}</TableCell>
                          <TableCell className="text-right tabular-nums">{t.targetMargin}%</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">€{t.targetMaxCosts.toLocaleString()}</TableCell>
                          <TableCell className="text-right tabular-nums">{t.targetNewClients}</TableCell>
                          <TableCell className="text-right tabular-nums">{t.targetAvgResponseHours}h</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => startEdit(t)}>
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
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
              <Field label="Ventas (€)" value={newForm.targetRevenue} onChange={handleNewRevenueChange} />
              <Field label="Servicios" value={newForm.targetServices} onChange={v => setNewForm(p => ({ ...p, targetServices: v }))} step={1} />
              <Field label="NPS" value={newForm.targetNps} onChange={v => setNewForm(p => ({ ...p, targetNps: v }))} step={0.1} max={10} />
              <Field label="Margen %" value={newForm.targetMargin} onChange={handleNewMarginChange} max={100} />
              <Field label="Nuevos clientes" value={newForm.targetNewClients} onChange={v => setNewForm(p => ({ ...p, targetNewClients: v }))} step={1} />
              <Field label="Resp. media (h)" value={newForm.targetAvgResponseHours} onChange={v => setNewForm(p => ({ ...p, targetAvgResponseHours: v }))} step={0.5} />
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

function EditCell({ value, onChange, step = 1, max }: { value: number; onChange: (v: number) => void; step?: number; max?: number }) {
  return (
    <TableCell className="p-1">
      <Input
        type="number"
        className="h-8 text-right text-sm w-full"
        value={value}
        min={0}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
      />
    </TableCell>
  );
}

function Field({ label, value, onChange, step = 1, max }: { label: string; value: number; onChange: (v: number) => void; step?: number; max?: number }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type="number" min={0} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}
