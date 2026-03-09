import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Loader2, ShieldCheck, X, Home, Euro, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSubscriptionPlans, useCreateSubscriptionPlan, useUpdateSubscriptionPlan, useDeleteSubscriptionPlan,
  type SubscriptionPlan,
} from "@/hooks/useSubscriptionPlans";

const colorOptions = [
  { value: "bg-info/15 text-info border-info/30", label: "Azul" },
  { value: "bg-warning/15 text-warning border-warning/30", label: "Naranja" },
  { value: "bg-success/15 text-success border-success/30", label: "Verde" },
  { value: "bg-destructive/15 text-destructive border-destructive/30", label: "Rojo" },
  { value: "bg-primary/15 text-primary border-primary/30", label: "Primario" },
  { value: "bg-muted text-muted-foreground border-border", label: "Neutro" },
];

const emptyPlan = (): Omit<SubscriptionPlan, "id"> => ({
  name: "",
  slug: "",
  description: "",
  monthlyPrice: 0,
  annualPrice: 0,
  minMonths: 12,
  founderPrice: null,
  founderSlots: null,
  maxHomes: null,
  features: [],
  color: "bg-primary/15 text-primary border-primary/30",
  active: true,
  sortOrder: 0,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function SubscriptionPlansTab() {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const deletePlan = useDeleteSubscriptionPlan();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SubscriptionPlan, "id">>(emptyPlan());
  const [newFeature, setNewFeature] = useState("");

  const openCreate = () => {
    setEditId(null);
    setForm(emptyPlan());
    setDialogOpen(true);
  };

  const openEdit = (p: SubscriptionPlan) => {
    setEditId(p.id);
    setForm({ ...p });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const slug = form.slug || slugify(form.name);
    const payload = { ...form, slug };
    if (editId) {
      await updatePlan.mutateAsync({ ...payload, id: editId });
    } else {
      await createPlan.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setForm((f) => ({ ...f, features: [...f.features, newFeature.trim()] }));
    setNewFeature("");
  };

  const removeFeature = (idx: number) => {
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  };

  const saving = createPlan.isPending || updatePlan.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Planes de Suscripción</CardTitle>
            <CardDescription>Configura los planes que se asignan a clientes</CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo plan
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
          ) : (plans ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No hay planes configurados</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" /> Crear primer plan
              </Button>
            </div>
          ) : (
            (plans ?? []).map((plan) => (
              <div key={plan.id} className="rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn("inline-flex items-center justify-center w-10 h-10 rounded-xl border text-lg font-bold", plan.color)}>
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-card-foreground">{plan.name}</h3>
                        {!plan.active && <Badge variant="outline" className="text-[10px]">Inactivo</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={plan.active}
                      onCheckedChange={(checked) => updatePlan.mutate({ id: plan.id, active: checked })}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(plan)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar plan "{plan.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>Los clientes con este plan asignado mantendrán la referencia pero el plan ya no estará disponible.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePlan.mutate(plan.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Pricing info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <Euro className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Mensual</p>
                      <p className="text-sm font-semibold text-card-foreground">{plan.monthlyPrice} €/mes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground">Anual</p>
                      <p className="text-sm font-semibold text-card-foreground">{plan.annualPrice} €/año</p>
                    </div>
                  </div>
                  {plan.founderPrice != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">Fundadores</p>
                        <p className="text-sm font-semibold text-card-foreground">{plan.founderPrice} €/mes ({plan.founderSlots} plazas)</p>
                      </div>
                    </div>
                  )}
                  {plan.maxHomes != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <Home className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">Límite</p>
                        <p className="text-sm font-semibold text-card-foreground">{plan.maxHomes} hogares</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features */}
                {plan.features.length > 0 && (
                  <ul className="space-y-1 list-none">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-success mt-0.5 shrink-0">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar plan" : "Nuevo plan de suscripción"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del plan *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} placeholder="Ej: Hogar Protegido" />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select value={form.color} onValueChange={(v) => setForm((f) => ({ ...f, color: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <div className="flex items-center gap-2">
                          <span className={cn("w-3 h-3 rounded-full border", o.value)} />
                          {o.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Breve descripción del plan" rows={2} />
            </div>

            {/* Pricing */}
            <div>
              <h4 className="text-sm font-medium text-card-foreground mb-3">Precios</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Precio mensual (€)</Label>
                  <Input type="number" value={form.monthlyPrice} onChange={(e) => setForm((f) => ({ ...f, monthlyPrice: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Precio anual (€)</Label>
                  <Input type="number" value={form.annualPrice} onChange={(e) => setForm((f) => ({ ...f, annualPrice: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Permanencia (meses)</Label>
                  <Input type="number" value={form.minMonths} onChange={(e) => setForm((f) => ({ ...f, minMonths: Number(e.target.value) }))} />
                </div>
              </div>
            </div>

            {/* Founder pricing */}
            <div>
              <h4 className="text-sm font-medium text-card-foreground mb-3">Oferta fundadores (opcional)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Precio fundador (€/mes)</Label>
                  <Input type="number" value={form.founderPrice ?? ""} onChange={(e) => setForm((f) => ({ ...f, founderPrice: e.target.value ? Number(e.target.value) : null }))} placeholder="—" />
                </div>
                <div className="space-y-2">
                  <Label>Plazas fundadores</Label>
                  <Input type="number" value={form.founderSlots ?? ""} onChange={(e) => setForm((f) => ({ ...f, founderSlots: e.target.value ? Number(e.target.value) : null }))} placeholder="—" />
                </div>
                <div className="space-y-2">
                  <Label>Máx. hogares activos</Label>
                  <Input type="number" value={form.maxHomes ?? ""} onChange={(e) => setForm((f) => ({ ...f, maxHomes: e.target.value ? Number(e.target.value) : null }))} placeholder="—" />
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-medium text-card-foreground mb-3">Servicios incluidos</h4>
              <div className="space-y-2">
                {form.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
                    <span className="text-xs text-success font-medium">✓</span>
                    <span className="text-sm text-card-foreground flex-1">{f}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFeature(i)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                    placeholder="Ej: Intervención garantizada en 12h"
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={addFeature} disabled={!newFeature.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button disabled={!form.name.trim() || saving} onClick={handleSave}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editId ? "Guardar cambios" : "Crear plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
