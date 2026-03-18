import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Pencil, Loader2, GripVertical, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  useSpecialties, useCreateSpecialty, useUpdateSpecialty, useDeleteSpecialty,
  useCertifications, useCreateCertification, useUpdateCertification, useDeleteCertification,
  type SpecialtyRow, type CertificationRow,
} from "@/hooks/useIndustrialConfig";
import { iconMap, colorOptions, iconOptions } from "./settingsConstants";

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
);

export default function IndustrialConfigTab() {
  const { data: specialties, isLoading: specLoading } = useSpecialties();
  const createSpec = useCreateSpecialty();
  const updateSpec = useUpdateSpecialty();
  const deleteSpec = useDeleteSpecialty();

  const { data: certifications, isLoading: certLoading } = useCertifications();
  const createCert = useCreateCertification();
  const updateCert = useUpdateCertification();
  const deleteCert = useDeleteCertification();

  const [showNewSpec, setShowNewSpec] = useState(false);
  const [newSpecName, setNewSpecName] = useState("");
  const [newSpecIcon, setNewSpecIcon] = useState("Wrench");
  const [newSpecColor, setNewSpecColor] = useState(colorOptions[0].value);

  const [showNewCert, setShowNewCert] = useState(false);
  const [newCertName, setNewCertName] = useState("");
  const [newCertDesc, setNewCertDesc] = useState("");

  const [editSpec, setEditSpec] = useState<SpecialtyRow | null>(null);
  const [editCert, setEditCert] = useState<CertificationRow | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ type: "spec" | "cert"; id: string; name: string } | null>(null);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const handleDeleteClick = async (type: "spec" | "cert", id: string, name: string) => {
    setDeleteTarget({ type, id, name });
    setUsageCount(null);
    setUsageLoading(true);
    try {
      if (type === "spec") {
        const { count } = await supabase
          .from("operators")
          .select("id", { count: "exact", head: true })
          .or(`specialty.eq.${name},secondary_specialty.eq.${name}`);
        setUsageCount(count ?? 0);
      } else {
        const { count } = await supabase
          .from("operators")
          .select("id", { count: "exact", head: true })
          .contains("certifications", [name]);
        setUsageCount(count ?? 0);
      }
    } catch {
      setUsageCount(0);
    } finally {
      setUsageLoading(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "spec") deleteSpec.mutate(deleteTarget.id);
    else deleteCert.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleCreateSpec = () => {
    if (!newSpecName.trim()) return;
    createSpec.mutate({ name: newSpecName.trim(), icon: newSpecIcon, color: newSpecColor }, {
      onSuccess: () => { setShowNewSpec(false); setNewSpecName(""); setNewSpecIcon("Wrench"); setNewSpecColor(colorOptions[0].value); },
    });
  };

  const handleCreateCert = () => {
    if (!newCertName.trim()) return;
    createCert.mutate({ name: newCertName.trim(), description: newCertDesc.trim() }, {
      onSuccess: () => { setShowNewCert(false); setNewCertName(""); setNewCertDesc(""); },
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── ESPECIALIDADES ─── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Especialidades</CardTitle>
            <CardDescription>Define las especialidades técnicas disponibles para los operarios</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {specLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <>
              {(specialties ?? []).map((sp, idx) => (
                <div
                  key={sp.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(idx)); (e.currentTarget as HTMLElement).classList.add("opacity-40"); }}
                  onDragEnd={(e) => { (e.currentTarget as HTMLElement).classList.remove("opacity-40"); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; (e.currentTarget as HTMLElement).classList.add("ring-2", "ring-primary/40"); }}
                  onDragLeave={(e) => { (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-primary/40"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-primary/40");
                    const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                    if (fromIdx === idx || isNaN(fromIdx)) return;
                    const reordered = [...(specialties ?? [])];
                    const [moved] = reordered.splice(fromIdx, 1);
                    reordered.splice(idx, 0, moved);
                    reordered.forEach((s, i) => { if (s.sort_order !== i) updateSpec.mutate({ id: s.id, sort_order: i }); });
                  }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-lg border", sp.color)}>
                      {iconMap[sp.icon] ?? <Wrench className="w-4 h-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{sp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sp.active ? "Activa" : "Inactiva"}
                        {sp.hourly_rate > 0 && <span className="ml-2">· €{sp.hourly_rate}/h</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={sp.active} onCheckedChange={(checked) => updateSpec.mutate({ id: sp.id, active: checked })} />
                    <Button variant="ghost" size="icon" onClick={() => setEditSpec(sp)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick("spec", sp.id, sp.name)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
              {showNewSpec ? (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Nombre *</Label>
                    <Input value={newSpecName} onChange={(e) => setNewSpecName(e.target.value)} placeholder="Ej: Gas Natural" autoFocus />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Icono</Label>
                      <Select value={newSpecIcon} onValueChange={setNewSpecIcon}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{iconOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Color</Label>
                      <Select value={newSpecColor} onValueChange={setNewSpecColor}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{colorOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewSpec(false)}>Cancelar</Button>
                    <Button size="sm" disabled={!newSpecName.trim() || createSpec.isPending} onClick={handleCreateSpec}>
                      {createSpec.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Añadir
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowNewSpec(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Añadir especialidad
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── CERTIFICACIONES ─── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Certificaciones</CardTitle>
            <CardDescription>Define las certificaciones disponibles para asignar a los operarios</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {certLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <>
              {(certifications ?? []).map((cert, idx) => (
                <div
                  key={cert.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(idx)); (e.currentTarget as HTMLElement).classList.add("opacity-40"); }}
                  onDragEnd={(e) => { (e.currentTarget as HTMLElement).classList.remove("opacity-40"); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; (e.currentTarget as HTMLElement).classList.add("ring-2", "ring-primary/40"); }}
                  onDragLeave={(e) => { (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-primary/40"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-primary/40");
                    const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                    if (fromIdx === idx || isNaN(fromIdx)) return;
                    const reordered = [...(certifications ?? [])];
                    const [moved] = reordered.splice(fromIdx, 1);
                    reordered.splice(idx, 0, moved);
                    reordered.forEach((c, i) => { if (c.sort_order !== i) updateCert.mutate({ id: c.id, sort_order: i }); });
                  }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{cert.name}</p>
                      {cert.description && <p className="text-xs text-muted-foreground">{cert.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={cert.active} onCheckedChange={(checked) => updateCert.mutate({ id: cert.id, active: checked })} />
                    <Button variant="ghost" size="icon" onClick={() => setEditCert(cert)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick("cert", cert.id, cert.name)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
              {showNewCert ? (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Nombre *</Label>
                    <Input value={newCertName} onChange={(e) => setNewCertName(e.target.value)} placeholder="Ej: Certificado F-Gas" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Descripción</Label>
                    <Input value={newCertDesc} onChange={(e) => setNewCertDesc(e.target.value)} placeholder="Ej: Requerido para instalaciones de gas fluorado" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewCert(false)}>Cancelar</Button>
                    <Button size="sm" disabled={!newCertName.trim() || createCert.isPending} onClick={handleCreateCert}>
                      {createCert.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Añadir
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowNewCert(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Añadir certificación
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Specialty Dialog */}
      <Dialog open={!!editSpec} onOpenChange={(o) => !o && setEditSpec(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar especialidad</DialogTitle></DialogHeader>
          {editSpec && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editSpec.name} onChange={(e) => setEditSpec({ ...editSpec, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Icono</Label>
                  <Select value={editSpec.icon} onValueChange={(v) => setEditSpec({ ...editSpec, icon: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{iconOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select value={editSpec.color} onValueChange={(v) => setEditSpec({ ...editSpec, color: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{colorOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSpec(null)}>Cancelar</Button>
            <Button disabled={updateSpec.isPending} onClick={() => {
              if (!editSpec) return;
              updateSpec.mutate({ id: editSpec.id, name: editSpec.name, icon: editSpec.icon, color: editSpec.color }, { onSuccess: () => setEditSpec(null) });
            }}>
              {updateSpec.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Certification Dialog */}
      <Dialog open={!!editCert} onOpenChange={(o) => !o && setEditCert(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar certificación</DialogTitle></DialogHeader>
          {editCert && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editCert.name} onChange={(e) => setEditCert({ ...editCert, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={editCert.description} onChange={(e) => setEditCert({ ...editCert, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCert(null)}>Cancelar</Button>
            <Button disabled={updateCert.isPending} onClick={() => {
              if (!editCert) return;
              updateCert.mutate({ id: editCert.id, name: editCert.name, description: editCert.description }, { onSuccess: () => setEditCert(null) });
            }}>
              {updateCert.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shared Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {deleteTarget?.type === "spec" ? "especialidad" : "certificación"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {usageLoading ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Comprobando operarios afectados…</span>
              ) : usageCount && usageCount > 0 ? (
                <>
                  <span className="font-semibold text-destructive">⚠ {usageCount} operario{usageCount > 1 ? "s" : ""}</span>{" "}
                  {usageCount > 1 ? "tienen" : "tiene"} asignada la {deleteTarget?.type === "spec" ? "especialidad" : "certificación"}{" "}
                  <strong>{deleteTarget?.name}</strong>. {deleteTarget?.type === "spec"
                    ? "Conservarán el valor actual pero dejará de estar disponible en los desplegables."
                    : "Conservarán el valor actual pero dejará de estar disponible para asignar."}
                </>
              ) : (
                <>No hay operarios usando <strong>{deleteTarget?.name}</strong>. Esta acción no se puede deshacer.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={usageLoading}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
