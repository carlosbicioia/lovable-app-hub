import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Plus, Trash2, Pencil, Save, X } from "lucide-react";
import SupplierAutocomplete from "./SupplierAutocomplete";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useServiceMaterialsUsed,
  useCreateServiceMaterial,
  useUpdateServiceMaterial,
  useDeleteServiceMaterial,
  type ServiceMaterialUsed,
} from "@/hooks/useServiceMaterialsUsed";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  serviceId: string;
  readOnly?: boolean;
}

export default function ServiceMaterials({ serviceId, readOnly }: Props) {
  const { data: materials = [], isLoading } = useServiceMaterialsUsed(serviceId);
  const createMat = useCreateServiceMaterial();
  const updateMat = useUpdateServiceMaterial();
  const deleteMat = useDeleteServiceMaterial();

  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ material: "", supplier_name: "", brand: "", model: "", purchase_date: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ material: "", supplier_name: "", brand: "", model: "", purchase_date: "" });
  const [deleteTarget, setDeleteTarget] = useState<ServiceMaterialUsed | null>(null);

  const handleCreate = () => {
    if (!newForm.material.trim()) return;
    createMat.mutate({
      service_id: serviceId,
      material: newForm.material.trim(),
      supplier_name: newForm.supplier_name.trim(),
      brand: newForm.brand.trim(),
      model: newForm.model.trim(),
      purchase_date: newForm.purchase_date || null,
    }, {
      onSuccess: () => {
        setShowNew(false);
        setNewForm({ material: "", supplier_name: "", brand: "", model: "", purchase_date: "" });
      },
    });
  };

  const startEdit = (m: ServiceMaterialUsed) => {
    setEditId(m.id);
    setEditForm({
      material: m.material,
      supplier_name: m.supplier_name,
      brand: m.brand,
      model: m.model,
      purchase_date: m.purchase_date ?? "",
    });
  };

  const saveEdit = () => {
    if (!editId || !editForm.material.trim()) return;
    updateMat.mutate({
      id: editId,
      service_id: serviceId,
      material: editForm.material.trim(),
      supplier_name: editForm.supplier_name.trim(),
      brand: editForm.brand.trim(),
      model: editForm.model.trim(),
      purchase_date: editForm.purchase_date || null,
    });
    setEditId(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" /> Materiales utilizados
          </CardTitle>
          {!showNew && !readOnly && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowNew(true)}>
              <Plus className="w-3.5 h-3.5" /> Añadir
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <>
              {showNew && (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Material *</Label>
                      <Input value={newForm.material} onChange={e => setNewForm(p => ({ ...p, material: e.target.value }))} placeholder="Ej: Grifo monomando" autoFocus />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Proveedor</Label>
                      <SupplierAutocomplete value={newForm.supplier_name} onChange={v => setNewForm(p => ({ ...p, supplier_name: v }))} placeholder="Ej: Comercial Urgel" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Marca</Label>
                      <Input value={newForm.brand} onChange={e => setNewForm(p => ({ ...p, brand: e.target.value }))} placeholder="Ej: Grohe" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Modelo</Label>
                      <Input value={newForm.model} onChange={e => setNewForm(p => ({ ...p, model: e.target.value }))} placeholder="Ej: Eurodisc Cosmopolitan" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Fecha de compra</Label>
                      <Input type="date" value={newForm.purchase_date} onChange={e => setNewForm(p => ({ ...p, purchase_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancelar</Button>
                    <Button size="sm" disabled={!newForm.material.trim() || createMat.isPending} onClick={handleCreate}>Añadir</Button>
                  </div>
                </div>
              )}

              {materials.length === 0 && !showNew && (
                <p className="text-sm text-muted-foreground italic text-center py-4">Sin materiales registrados. Añade los materiales utilizados para futuras reposiciones.</p>
              )}

              {materials.length > 0 && (
                <div className="divide-y divide-border rounded-md border border-border">
                  {materials.map(m => (
                    <div key={m.id} className="px-4 py-3">
                      {editId === m.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Material *</Label>
                              <Input value={editForm.material} onChange={e => setEditForm(p => ({ ...p, material: e.target.value }))} className="h-8" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Proveedor</Label>
                              <SupplierAutocomplete value={editForm.supplier_name} onChange={v => setEditForm(p => ({ ...p, supplier_name: v }))} placeholder="Ej: Comercial Urgel" className="h-8" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Marca</Label>
                              <Input value={editForm.brand} onChange={e => setEditForm(p => ({ ...p, brand: e.target.value }))} className="h-8" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Modelo</Label>
                              <Input value={editForm.model} onChange={e => setEditForm(p => ({ ...p, model: e.target.value }))} className="h-8" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Fecha de compra</Label>
                              <Input type="date" value={editForm.purchase_date} onChange={e => setEditForm(p => ({ ...p, purchase_date: e.target.value }))} className="h-8" />
                            </div>
                          </div>
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Save className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}><X className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-card-foreground">{m.material}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                              {m.supplier_name && <span>Proveedor: {m.supplier_name}</span>}
                              {m.brand && <span>Marca: {m.brand}</span>}
                              {m.model && <span>Modelo: {m.model}</span>}
                              {m.purchase_date && (
                                <span>Compra: {format(new Date(m.purchase_date), "dd MMM yyyy", { locale: es })}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(m)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(m)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará <strong>{deleteTarget?.material}</strong> del listado de materiales utilizados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteTarget) { deleteMat.mutate({ id: deleteTarget.id, service_id: serviceId }); setDeleteTarget(null); }
            }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
