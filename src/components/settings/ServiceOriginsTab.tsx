import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, Save, X, Users, GripVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useServiceOrigins,
  useCreateServiceOrigin,
  useUpdateServiceOrigin,
  useDeleteServiceOrigin,
  type ServiceOriginRow,
} from "@/hooks/useServiceOrigins";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ServiceOriginsTab() {
  const { data: origins = [], isLoading } = useServiceOrigins();
  const createOrigin = useCreateServiceOrigin();
  const updateOrigin = useUpdateServiceOrigin();
  const deleteOrigin = useDeleteServiceOrigin();

  const [newName, setNewName] = useState("");
  const [newShowCollab, setNewShowCollab] = useState(false);
  const [newIsAssistance, setNewIsAssistance] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editShowCollab, setEditShowCollab] = useState(false);
  const [editIsAssistance, setEditIsAssistance] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceOriginRow | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const maxOrder = origins.length > 0 ? Math.max(...origins.map(o => o.sort_order)) + 1 : 0;
    createOrigin.mutate({ name: newName.trim(), show_collaborator: newShowCollab, is_assistance: newIsAssistance, sort_order: maxOrder });
    setNewName("");
    setNewShowCollab(false);
    setNewIsAssistance(false);
  };

  const startEdit = (o: ServiceOriginRow) => {
    setEditingId(o.id);
    setEditName(o.name);
    setEditShowCollab(o.show_collaborator);
    setEditIsAssistance(o.is_assistance);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateOrigin.mutate({ id: editingId, name: editName.trim(), show_collaborator: editShowCollab });
    setEditingId(null);
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Orígenes de servicio</CardTitle>
        <CardDescription>Configura los orígenes que aparecen en el formulario de nuevo servicio. Marca "Mostrar colaborador" para los orígenes que requieran seleccionar un colaborador (ej. B2B).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new */}
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label>Nombre</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej: Teléfono" onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <Switch checked={newShowCollab} onCheckedChange={setNewShowCollab} id="new-collab" />
            <Label htmlFor="new-collab" className="text-xs whitespace-nowrap"><Users className="w-3 h-3 inline mr-1" />Colaborador</Label>
          </div>
          <Button size="sm" onClick={handleCreate} disabled={!newName.trim()} className="gap-1"><Plus className="w-4 h-4" /> Añadir</Button>
        </div>

        {/* List */}
        <div className="divide-y divide-border rounded-md border border-border">
          {origins.map((o, idx) => (
            <div
              key={o.id}
              draggable={editingId !== o.id}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(idx));
                (e.currentTarget as HTMLElement).classList.add("opacity-40");
              }}
              onDragEnd={(e) => {
                (e.currentTarget as HTMLElement).classList.remove("opacity-40");
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                (e.currentTarget as HTMLElement).classList.add("ring-2", "ring-primary/40");
              }}
              onDragLeave={(e) => {
                (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-primary/40");
              }}
              onDrop={(e) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-primary/40");
                const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                const toIdx = idx;
                if (fromIdx === toIdx || isNaN(fromIdx)) return;
                const reordered = [...origins];
                const [moved] = reordered.splice(fromIdx, 1);
                reordered.splice(toIdx, 0, moved);
                reordered.forEach((origin, i) => {
                  if (origin.sort_order !== i) {
                    updateOrigin.mutate({ id: origin.id, sort_order: i });
                  }
                });
              }}
              className="flex items-center gap-3 px-4 py-3 transition-all cursor-grab active:cursor-grabbing"
            >
              {editingId === o.id ? (
                <>
                  <GripVertical className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 h-8" onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
                  <div className="flex items-center gap-2">
                    <Switch checked={editShowCollab} onCheckedChange={setEditShowCollab} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap"><Users className="w-3 h-3 inline mr-1" />Colab.</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Save className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                </>
              ) : (
                <>
                  <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  <span className="flex-1 font-medium text-sm">{o.name}</span>
                  {o.show_collaborator && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"><Users className="w-3 h-3 inline mr-1" />Colaborador</span>}
                  <Switch checked={o.active} onCheckedChange={(v) => updateOrigin.mutate({ id: o.id, active: v })} />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(o)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(o)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </>
              )}
            </div>
          ))}
          {origins.length === 0 && <p className="text-center py-6 text-muted-foreground text-sm">No hay orígenes configurados</p>}
        </div>
      </CardContent>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar origen?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará el origen <strong>{deleteTarget?.name}</strong>. Los servicios existentes conservarán su origen actual.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) { deleteOrigin.mutate(deleteTarget.id); setDeleteTarget(null); } }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
