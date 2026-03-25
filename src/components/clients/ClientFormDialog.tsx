"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ServiceOrigin } from "@/types/urbango";

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
  streetNumber: string;
  floor: string;
  addressExtra: string;
  postalCode: string;
  city: string;
  province: string;
  clusterId: string;
  collaboratorId: string | null;
  collaboratorName?: string | null;
  planType: string;
  lastServiceDate?: string | null;
  origin: ServiceOrigin;
}

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ClientFormData;
  setForm: (form: ClientFormData | ((prev: ClientFormData) => ClientFormData)) => void;
  onSave: () => Promise<void>;
  collaborators: { id: string; companyName: string }[];
  title: string;
  saveLabel: string;
  dniOptional?: boolean;
}

export default function ClientFormDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  collaborators,
  title,
  saveLabel,
}: ClientFormDialogProps) {
  
  const isCompany = form.clientType === "Empresa";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Tipo de Cliente</Label>
            <Select 
              value={form.clientType} 
              onValueChange={(v: "Particular"|"Empresa") => setForm(p => ({ ...p, clientType: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Particular">Particular</SelectItem>
                <SelectItem value="Empresa">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCompany ? (
            <>
              <div className="space-y-2 md:col-span-2">
                <Label>Nombre de la Empresa *</Label>
                <Input value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>CIF *</Label>
                <Input value={form.taxId} onChange={e => setForm(p => ({ ...p, taxId: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Persona de Contacto</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Apellidos</Label>
                <Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>DNI / NIE</Label>
                <Input value={form.dni} onChange={e => setForm(p => ({ ...p, dni: e.target.value }))} />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Teléfono *</Label>
            <Input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Dirección</Label>
            <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Ciudad</Label>
            <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
          </div>
          
          <div className="space-y-2">
            <Label>Cód. Postal</Label>
            <Input value={form.postalCode} onChange={e => setForm(p => ({ ...p, postalCode: e.target.value }))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isCompany ? (!form.companyName || !form.phone) : (!form.name || !form.phone)}>
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
