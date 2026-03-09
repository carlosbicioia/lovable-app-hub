import { useState, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useBranches } from "@/hooks/useBranches";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ClientFormData {
  clientType: "Particular" | "Empresa";
  name: string;
  companyName: string;
  dni: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  clusterId: string;
  collaboratorId: string | null;
  collaboratorName: string | null;
  planType: string;
  lastServiceDate: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ClientFormData;
  setForm: React.Dispatch<React.SetStateAction<ClientFormData>>;
  onSave: () => void;
  collaborators: { id: string; companyName: string }[];
  title: string;
  saveLabel: string;
}

export default function ClientFormDialog({ open, onOpenChange, form, setForm, onSave, collaborators, title, saveLabel }: Props) {
  const { data: plans = [] } = useSubscriptionPlans();
  const activePlans = plans.filter((p) => p.active);
  const upd = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const initialSnapshot = useRef<string>("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      initialSnapshot.current = JSON.stringify(form);
    }
  }, [open]);

  const isDirty = open && initialSnapshot.current !== "" && JSON.stringify(form) !== initialSnapshot.current;

  const handleClose = useCallback((nextOpen: boolean) => {
    if (!nextOpen && isDirty) {
      setShowLeaveConfirm(true);
    } else {
      onOpenChange(nextOpen);
    }
  }, [isDirty, onOpenChange]);

  const handleCollaboratorChange = (value: string) => {
    if (value === "none") {
      setForm((prev) => ({ ...prev, collaboratorId: null, collaboratorName: null }));
    } else {
      const collab = collaborators.find((c) => c.id === value);
      setForm((prev) => ({ ...prev, collaboratorId: value, collaboratorName: collab?.companyName ?? null }));
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1.5">
            <Label>Tipo de cliente</Label>
            <Select value={form.clientType} onValueChange={(v) => setForm((prev) => ({ ...prev, clientType: v as "Particular" | "Empresa" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Particular">Particular</SelectItem>
                <SelectItem value="Empresa">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.clientType === "Empresa" ? (
            <>
              <div className="space-y-1.5">
                <Label>Razón Social *</Label>
                <Input value={form.companyName} onChange={(e) => upd("companyName", e.target.value)} placeholder="Nombre de la empresa" />
              </div>
              <div className="space-y-1.5">
                <Label>CIF *</Label>
                <Input value={form.taxId} onChange={(e) => upd("taxId", e.target.value)} placeholder="B12345678" />
              </div>
              <div className="space-y-1.5">
                <Label>Persona de contacto</Label>
                <Input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Nombre del contacto" />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Nombre completo" />
              </div>
              <div className="space-y-1.5">
                <Label>DNI *</Label>
                <Input value={form.dni} onChange={(e) => upd("dni", e.target.value)} placeholder="12345678A" />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="email@ejemplo.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input value={form.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="612345678" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Dirección</Label>
            <Input value={form.address} onChange={(e) => upd("address", e.target.value)} placeholder="Calle, número, piso" />
          </div>
          <div className="space-y-1.5">
            <Label>Ciudad</Label>
            <Input value={form.city} onChange={(e) => upd("city", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Provincia</Label>
            <Input value={form.province} onChange={(e) => upd("province", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Código postal</Label>
            <Input value={form.postalCode} onChange={(e) => upd("postalCode", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={form.planType} onValueChange={(v) => upd("planType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ninguno">Ninguno</SelectItem>
                {activePlans.map((p) => (
                  <SelectItem key={p.slug} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Colaborador</Label>
            <Select value={form.collaboratorId ?? "none"} onValueChange={handleCollaboratorChange}>
              <SelectTrigger><SelectValue placeholder="Sin colaborador" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin colaborador</SelectItem>
                {collaborators.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave}>{saveLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Abandonar el proceso?</AlertDialogTitle>
          <AlertDialogDescription>
            Tienes cambios sin guardar. Si sales ahora, perderás toda la información introducida.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowLeaveConfirm(false)}>Continuar editando</AlertDialogCancel>
          <AlertDialogAction onClick={() => { setShowLeaveConfirm(false); onOpenChange(false); }}>Salir sin guardar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
