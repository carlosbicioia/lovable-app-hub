import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Loader2, Pencil, Percent, Star } from "lucide-react";
import {
  useTaxTypes,
  useCreateTaxType,
  useUpdateTaxType,
  useDeleteTaxType,
  type TaxType,
} from "@/hooks/useTaxTypes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TaxTypesConfigTab() {
  const { data: taxTypes, isLoading } = useTaxTypes();
  const createTax = useCreateTaxType();
  const updateTax = useUpdateTaxType();
  const deleteTax = useDeleteTaxType();

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState<number>(21);

  const [editItem, setEditItem] = useState<TaxType | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTax.mutate(
      { name: newName.trim(), rate: newRate },
      {
        onSuccess: () => {
          setShowNew(false);
          setNewName("");
          setNewRate(21);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Tipos impositivos</CardTitle>
            <CardDescription>
              Configura los tipos de IVA o impuestos aplicables a las órdenes de compra
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <>
              {(taxTypes ?? []).map((tt) => (
                <div
                  key={tt.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-muted text-muted-foreground">
                      <Percent className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-card-foreground flex items-center gap-2">
                        {tt.name}
                        {tt.is_default && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Star className="w-3 h-3" /> Por defecto
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tt.rate}% · {tt.active ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!tt.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => updateTax.mutate({ id: tt.id, is_default: true })}
                      >
                        <Star className="w-3 h-3 mr-1" /> Predeterminar
                      </Button>
                    )}
                    <Switch
                      checked={tt.active}
                      onCheckedChange={(checked) =>
                        updateTax.mutate({ id: tt.id, active: checked })
                      }
                    />
                    <Button variant="ghost" size="icon" onClick={() => setEditItem(tt)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar tipo impositivo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Las órdenes existentes no se verán afectadas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTax.mutate(tt.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              {showNew ? (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Nombre *</Label>
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ej: IVA 21%"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Porcentaje *</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={newRate}
                        onChange={(e) => setNewRate(Number(e.target.value))}
                        placeholder="21"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      disabled={!newName.trim() || createTax.isPending}
                      onClick={handleCreate}
                    >
                      {createTax.isPending && (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      )}
                      Añadir
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowNew(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Añadir tipo impositivo
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar tipo impositivo</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Porcentaje</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={editItem.rate}
                  onChange={(e) =>
                    setEditItem({ ...editItem, rate: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Cancelar
            </Button>
            <Button
              disabled={updateTax.isPending}
              onClick={() => {
                if (!editItem) return;
                updateTax.mutate(
                  { id: editItem.id, name: editItem.name, rate: editItem.rate },
                  { onSuccess: () => setEditItem(null) }
                );
              }}
            >
              {updateTax.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
