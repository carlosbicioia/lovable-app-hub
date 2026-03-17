import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProtocolSteps, useUpdateProtocolStep, useCreateProtocolStep, useDeleteProtocolStep } from "@/hooks/useProtocolSteps";

export default function ProtocolTab() {
  const { data: protocolItems = [], isLoading } = useProtocolSteps();
  const updateStep = useUpdateProtocolStep();
  const createStep = useCreateProtocolStep();
  const deleteStep = useDeleteProtocolStep();
  const [newStepLabel, setNewStepLabel] = useState("");
  const [newStepDesc, setNewStepDesc] = useState("");
  const [showNewStep, setShowNewStep] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Protocolo de Gestión</CardTitle>
        <CardDescription>Define los pasos que el gestor debe completar en cada servicio. Estos aparecerán como checklist en la pantalla de detalle del servicio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : (
            <>
              {protocolItems.map((item, idx) => (
                <div
                  key={item.id}
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
                    const reordered = [...protocolItems];
                    const [moved] = reordered.splice(fromIdx, 1);
                    reordered.splice(idx, 0, moved);
                    reordered.forEach((step, i) => { if (step.sortOrder !== i) updateStep.mutate({ id: step.id, sortOrder: i }); });
                  }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border transition-all cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={item.enabled} onCheckedChange={(checked) => updateStep.mutate({ id: item.id, enabled: !!checked })} />
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteStep.mutate(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {showNewStep ? (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Nombre del paso *</Label>
                    <Input value={newStepLabel} onChange={(e) => setNewStepLabel(e.target.value)} placeholder="Ej: Verificar garantía del equipo" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Descripción</Label>
                    <Input value={newStepDesc} onChange={(e) => setNewStepDesc(e.target.value)} placeholder="Ej: Comprobar si el equipo está en período de garantía" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => { setShowNewStep(false); setNewStepLabel(""); setNewStepDesc(""); }}>Cancelar</Button>
                    <Button
                      size="sm"
                      disabled={!newStepLabel.trim() || createStep.isPending}
                      onClick={() => {
                        const stepId = newStepLabel.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                        createStep.mutate(
                          { stepId, label: newStepLabel.trim(), description: newStepDesc.trim(), sortOrder: protocolItems.length },
                          { onSuccess: () => { setNewStepLabel(""); setNewStepDesc(""); setShowNewStep(false); toast.success("Paso añadido al protocolo"); }, onError: (e: any) => toast.error(e.message) }
                        );
                      }}
                    >
                      Añadir
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowNewStep(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Añadir paso al protocolo
                </Button>
              )}
            </>
          )}
          <p className="text-xs text-muted-foreground">Los cambios se aplican inmediatamente a todos los servicios y presupuestos.</p>
        </div>
      </CardContent>
    </Card>
  );
}
