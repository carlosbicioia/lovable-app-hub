import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Pencil, Loader2, MapPin, Building2, Phone, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch, type Branch } from "@/hooks/useBranches";

const emptyForm = {
  name: "",
  address: "",
  city: "",
  province: "",
  postal_code: "",
  phone: "",
  email: "",
  manager_name: "",
  cluster_ids: [] as string[],
  logo_url: null as string | null,
  active: true,
};

type BranchForm = typeof emptyForm;

function BranchFormFields({ form, setForm }: { form: BranchForm; setForm: (f: BranchForm) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre de la sede *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Sede Central Madrid" />
        </div>
        <div className="space-y-2">
          <Label>Responsable</Label>
          <Input value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} placeholder="Nombre del responsable" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Dirección</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Calle, número..." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Ciudad</Label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Provincia</Label>
          <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Código postal</Label>
          <Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Clusters/Zonas (separados por coma)</Label>
        <Input
          value={form.cluster_ids.join(", ")}
          onChange={(e) => setForm({ ...form, cluster_ids: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          placeholder="Ej: CLU-01, CLU-02, CL-MAD"
        />
        <p className="text-xs text-muted-foreground">Los servicios se asignarán automáticamente a esta sede según su cluster</p>
      </div>
    </div>
  );
}

export default function BranchesTab() {
  const { data: branches, isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<BranchForm>({ ...emptyForm });
  const [editBranch, setEditBranch] = useState<(Branch & { _form: BranchForm }) | null>(null);

  const handleCreate = () => {
    if (!newForm.name.trim()) return;
    createBranch.mutate(newForm, {
      onSuccess: () => {
        setShowNew(false);
        setNewForm({ ...emptyForm });
      },
    });
  };

  const handleEdit = (b: Branch) => {
    setEditBranch({
      ...b,
      _form: {
        name: b.name,
        address: b.address,
        city: b.city,
        province: b.province,
        postal_code: b.postal_code,
        phone: b.phone,
        email: b.email,
        manager_name: b.manager_name,
        cluster_ids: b.cluster_ids,
        logo_url: b.logo_url,
        active: b.active,
      },
    });
  };

  const handleSaveEdit = () => {
    if (!editBranch) return;
    updateBranch.mutate({ id: editBranch.id, ...editBranch._form }, {
      onSuccess: () => setEditBranch(null),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Sedes de la empresa</CardTitle>
            <CardDescription>Gestiona las sedes o delegaciones. Los servicios, operarios y colaboradores se asignarán a sedes según su zona.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Nueva Sede
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (branches ?? []).length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No hay sedes configuradas</p>
              <p className="text-xs text-muted-foreground mt-1">Añade la primera sede para organizar tu empresa por ubicaciones</p>
            </div>
          ) : (
            (branches ?? []).map((b) => (
              <div key={b.id} className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-card-foreground">{b.name}</p>
                      {!b.active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Inactiva</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {b.address && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.city ? `${b.address}, ${b.city}` : b.address}</span>
                      )}
                      {b.manager_name && (
                        <span className="flex items-center gap-1"><UserRound className="w-3 h-3" />{b.manager_name}</span>
                      )}
                      {b.phone && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{b.phone}</span>
                      )}
                      {b.email && (
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{b.email}</span>
                      )}
                    </div>
                    {b.cluster_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {b.cluster_ids.map((c) => (
                          <span key={c} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-info/10 text-info border border-info/20">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={b.active}
                    onCheckedChange={(checked) => updateBranch.mutate({ id: b.id, active: checked })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar sede "{b.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará la sede. Los operarios y servicios vinculados perderán su asignación de sede.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteBranch.mutate(b.id)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* New Branch Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva sede</DialogTitle></DialogHeader>
          <BranchFormFields form={newForm} setForm={setNewForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button disabled={!newForm.name.trim() || createBranch.isPending} onClick={handleCreate}>
              {createBranch.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Crear sede
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={!!editBranch} onOpenChange={(o) => !o && setEditBranch(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar sede</DialogTitle></DialogHeader>
          {editBranch && (
            <BranchFormFields form={editBranch._form} setForm={(f) => setEditBranch({ ...editBranch, _form: f })} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBranch(null)}>Cancelar</Button>
            <Button disabled={updateBranch.isPending} onClick={handleSaveEdit}>
              {updateBranch.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
