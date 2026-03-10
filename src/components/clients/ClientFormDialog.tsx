import { useState, useCallback, useRef, useEffect, useMemo } from "react";

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

function validateDni(value: string): { valid: boolean; message?: string } {
  const v = value.trim().toUpperCase();
  if (!v) return { valid: false };

  // NIE: starts with X, Y, Z
  const nieMatch = v.match(/^([XYZ])(\d{7})([A-Z])$/);
  if (nieMatch) {
    const prefix = { X: "0", Y: "1", Z: "2" }[nieMatch[1]] ?? "0";
    const num = parseInt(prefix + nieMatch[2], 10);
    const expected = DNI_LETTERS[num % 23];
    return expected === nieMatch[3]
      ? { valid: true }
      : { valid: false, message: `Letra incorrecta, debería ser ${expected}` };
  }

  // DNI: 8 digits + letter
  const dniMatch = v.match(/^(\d{8})([A-Z])$/);
  if (dniMatch) {
    const num = parseInt(dniMatch[1], 10);
    const expected = DNI_LETTERS[num % 23];
    return expected === dniMatch[2]
      ? { valid: true }
      : { valid: false, message: `Letra incorrecta, debería ser ${expected}` };
  }

  return { valid: false, message: "Formato inválido (ej: 12345678A o X1234567A)" };
}
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useBranches } from "@/hooks/useBranches";
import PostalCodeFields from "@/components/shared/PostalCodeFields";
import { useServiceOrigins } from "@/hooks/useServiceOrigins";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ClientFormData {
  clientType: "Particular" | "Empresa";
  name: string;
  lastName: string;
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
  origin: string;
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
  dniOptional?: boolean;
  isAssistanceAvailable?: boolean;
  isAssistance?: boolean;
  onAssistanceChange?: (v: boolean) => void;
}

export default function ClientFormDialog({ open, onOpenChange, form, setForm, onSave, collaborators, title, saveLabel, dniOptional, isAssistanceAvailable, isAssistance, onAssistanceChange }: Props) {
  const { data: plans = [] } = useSubscriptionPlans();
  const { data: branches = [] } = useBranches();
  const { data: serviceOrigins = [] } = useServiceOrigins();
  const activePlans = plans.filter((p) => p.active);
  const activeBranches = branches.filter((b) => b.active);
  const activeOrigins = serviceOrigins.filter((o) => o.active);

  // Resolve current branch from clusterId
  const currentBranchId = useMemo(() => {
    if (!form.clusterId) return "none";
    const found = branches.find((b) => b.cluster_ids.includes(form.clusterId));
    return found?.id ?? "none";
  }, [form.clusterId, branches]);

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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className={isAssistanceAvailable ? "" : "col-span-2"}>
            <div className="space-y-1.5">
              <Label>Tipo de cliente</Label>
              <Select value={form.clientType} onValueChange={(v) => setForm((prev) => ({ ...prev, clientType: v as "Particular" | "Empresa" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Particular">Particular</SelectItem>
                  <SelectItem value="Empresa">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isAssistanceAvailable && form.clientType === "Particular" && (
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <Switch checked={isAssistance} onCheckedChange={onAssistanceChange} id="assistance-toggle" />
                <Label htmlFor="assistance-toggle" className="text-sm whitespace-nowrap">Asistencia</Label>
              </div>
            </div>
          )}
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
                <Label>Nombre de contacto</Label>
                <Input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Nombre" />
              </div>
              <div className="space-y-1.5">
                <Label>Apellidos de contacto</Label>
                <Input value={form.lastName} onChange={(e) => upd("lastName", e.target.value)} placeholder="Apellidos" />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Nombre" />
              </div>
              <div className="space-y-1.5">
                <Label>Apellidos *</Label>
                <Input value={form.lastName} onChange={(e) => upd("lastName", e.target.value)} placeholder="Apellidos" />
              </div>
              <div className="space-y-1.5">
                <Label>DNI {!dniOptional && "*"}</Label>
                <Input value={form.dni} onChange={(e) => upd("dni", e.target.value)} placeholder="12345678A"
                  className={form.dni.trim() ? (validateDni(form.dni).valid ? "border-success" : "border-destructive") : ""} />
                {form.dni.trim() && !validateDni(form.dni).valid && validateDni(form.dni).message && (
                  <p className="text-xs text-destructive">{validateDni(form.dni).message}</p>
                )}
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
          <PostalCodeFields
            postalCode={form.postalCode}
            onPostalCodeChange={(v) => upd("postalCode", v)}
            province={form.province}
            onProvinceChange={(v) => upd("province", v)}
            city={form.city}
            onCityChange={(v) => upd("city", v)}
          />
          <div className="space-y-1.5">
            <Label>Sede</Label>
            <Select value={currentBranchId} onValueChange={(v) => {
              if (v === "none") {
                setForm((prev) => ({ ...prev, clusterId: "" }));
              } else {
                const branch = activeBranches.find((b) => b.id === v);
                if (branch && branch.cluster_ids.length > 0) {
                  setForm((prev) => ({ ...prev, clusterId: branch.cluster_ids[0] }));
                }
              }
            }}>
              <SelectTrigger><SelectValue placeholder="Sin sede" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin sede</SelectItem>
                {activeBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label>Origen</Label>
            <Select value={form.origin} onValueChange={(v) => upd("origin", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {activeOrigins.map((o) => (
                  <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>
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
