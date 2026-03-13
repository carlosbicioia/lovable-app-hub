import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Star, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCollaborators, type CollaboratorInput } from "@/hooks/useCollaborators";
import { useBranches } from "@/hooks/useBranches";
import type { Collaborator, CollaboratorCategory } from "@/types/urbango";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/shared/BulkActionBar";
import { exportCsv } from "@/lib/exportCsv";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const categoryColors: Record<string, string> = {
  Administrador: "bg-info/15 text-info border-info/30",
  Corredor: "bg-primary/15 text-primary border-primary/30",
  Gestoría: "bg-success/15 text-success border-success/30",
  Otros: "bg-muted text-muted-foreground border-border",
};

const categories: CollaboratorCategory[] = ["Administrador", "Corredor", "Gestoría", "Otros"];

const emptyForm: CollaboratorInput = {
  companyName: "",
  category: "Administrador",
  email: "",
  phone: "",
  contactPerson: "",
  taxId: "",
  address: "",
  streetNumber: "",
  floor: "",
  addressExtra: "",
  city: "",
  province: "",
  postalCode: "",
  website: "",
  notes: "",
  branchId: null,
  commissionRate: 15,
};

export default function Collaborators() {
  const navigate = useNavigate();
  const { collaborators, loading, create, update, remove } = useCollaborators();
  const { data: branches = [] } = useBranches();
  const activeBranches = branches.filter((b) => b.active);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CollaboratorInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Collaborator | null>(null);

  const filtered = collaborators.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    const matchesBranch = branchFilter === "all" || c.branchId === branchFilter;
    return matchesSearch && matchesCategory && matchesBranch;
  });

  const { selectedIds, toggle, toggleAll, clear, allSelected, someSelected, count } = useBulkSelect(filtered);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Collaborator) => {
    setEditingId(c.id);
    setForm({
      companyName: c.companyName,
      category: c.category,
      email: c.email,
      phone: c.phone,
      contactPerson: c.contactPerson,
      taxId: c.taxId,
      address: c.address,
      streetNumber: c.streetNumber,
      floor: c.floor,
      addressExtra: c.addressExtra,
      city: c.city,
      province: c.province,
      postalCode: c.postalCode,
      website: c.website,
      notes: c.notes,
      branchId: c.branchId ?? null,
      commissionRate: c.commissionRate ?? 15,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      toast({ title: "Error", description: "El nombre de empresa es obligatorio", variant: "destructive" });
      return;
    }
    if (!form.taxId.trim()) {
      toast({ title: "Error", description: "El NIF/CIF es obligatorio", variant: "destructive" });
      return;
    }
    if (!form.phone.trim()) {
      toast({ title: "Error", description: "El teléfono es obligatorio", variant: "destructive" });
      return;
    }
    if (!form.address.trim()) {
      toast({ title: "Error", description: "La dirección es obligatoria", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = editingId
      ? await update(editingId, form)
      : await create(form);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar el colaborador", variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Colaborador actualizado" : "Colaborador creado" });
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await remove(deleteTarget.id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar el colaborador", variant: "destructive" });
    } else {
      toast({ title: "Colaborador eliminado" });
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Colaboradores</h1>
          <p className="text-muted-foreground text-sm mt-1">{collaborators.length} colaboradores B2B</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Colaborador
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar empresa, contacto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-1.5">
          {["all", ...categories].map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              size="sm"
              className={cn(
                "text-xs h-8",
                categoryFilter !== cat && cat !== "all" && categoryColors[cat]
              )}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === "all" ? "Todos" : cat}
            </Button>
          ))}
        </div>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
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
        entityName="colaboradores"
        onDelete={async () => {
          const ids = Array.from(selectedIds);
          for (const id of ids) {
            await supabase.from("collaborators").delete().eq("id", id);
          }
          qc.invalidateQueries({ queryKey: ["collaborators"] });
          clear();
        }}
        onExport={() => {
          const sel = filtered.filter((c) => selectedIds.has(c.id));
          const headers = ["ID", "Empresa", "Categoría", "Contacto", "Email", "Teléfono", "Clientes", "Servicios activos", "NPS"];
          const csvRows = sel.map((c) => [c.id, c.companyName, c.category, c.contactPerson, c.email, c.phone, c.totalClients.toString(), c.activeServices.toString(), c.npsMean.toString()]);
          exportCsv("colaboradores.csv", headers, csvRows);
        }}
      />

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No se encontraron colaboradores</p>
          <p className="text-sm mt-1">Prueba con otra búsqueda o crea uno nuevo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const isSelected = selectedIds.has(c.id);
            return (
            <div
              key={c.id}
              className={cn("bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow group cursor-pointer", isSelected && "ring-2 ring-primary")}
              onClick={() => navigate(`/colaboradores/${c.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggle(c.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-card-foreground truncate">{c.companyName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {c.contactPerson} · {c.email}
                      {(() => { const br = activeBranches.find(b => b.id === c.branchId); return br ? ` · ${br.name}` : ''; })()}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", categoryColors[c.category])}>
                    {c.category}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-display font-bold text-card-foreground">{c.activeServices}</p>
                  <p className="text-xs text-muted-foreground">Activos</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-display font-bold text-card-foreground">{c.totalClients}</p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                    <span className="text-lg font-display font-bold text-card-foreground">{c.npsMean}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">NPS</p>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Colaborador" : "Nuevo Colaborador"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifica los datos del colaborador." : "Rellena los datos para crear un nuevo colaborador."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Nombre de empresa *</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  placeholder="Ej: Fincas Reunidas SL"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxId">NIF / CIF</Label>
                <Input
                  id="taxId"
                  value={form.taxId}
                  onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                  placeholder="B12345678"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoría</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as CollaboratorCategory }))}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactPerson">Persona de contacto</Label>
                <Input
                  id="contactPerson"
                  value={form.contactPerson}
                  onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                  placeholder="Ej: Antonio Pérez"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="info@empresa.es"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="912345678"
                />
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6 space-y-1.5">
                <Label>Calle</Label>
                <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Nombre de la calle" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Número</Label>
                <Input value={form.streetNumber} onChange={(e) => setForm((f) => ({ ...f, streetNumber: e.target.value }))} placeholder="Nº" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Piso</Label>
                <Input value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))} placeholder="1ºA" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Adicional</Label>
                <Input value={form.addressExtra} onChange={(e) => setForm((f) => ({ ...f, addressExtra: e.target.value }))} placeholder="Esc, puerta..." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="province">Provincia</Label>
                <Input
                  id="province"
                  value={form.province}
                  onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postalCode">C.P.</Label>
                <Input
                  id="postalCode"
                  value={form.postalCode}
                  onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                  placeholder="28001"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Web</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="www.empresa.es"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="branchId">Sede</Label>
              <Select value={form.branchId ?? "none"} onValueChange={(v) => setForm((f) => ({ ...f, branchId: v === "none" ? null : v }))}>
                <SelectTrigger id="branchId"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sede</SelectItem>
                  {activeBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Observaciones internas..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear colaborador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente <strong>{deleteTarget?.companyName}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
