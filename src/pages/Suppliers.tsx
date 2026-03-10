import { useState } from "react";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, Supplier } from "@/hooks/useSuppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Truck,
  Phone,
  Mail,
  Edit,
  Loader2,
} from "lucide-react";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/shared/BulkActionBar";
import { exportCsv } from "@/lib/exportCsv";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const emptyForm = () => ({
  name: "",
  taxId: "",
  phone: "",
  email: "",
  address: "",
  streetNumber: "",
  floor: "",
  addressExtra: "",
  city: "",
  province: "",
  contactPerson: "",
  notes: "",
  iban: "",
  paymentTerms: "Contado",
  dueDays: 30,
  active: true,
});

export default function Suppliers() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const qc = useQueryClient();

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.taxId.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  const { selectedIds, toggle, toggleAll, clear, allSelected, someSelected, count } = useBulkSelect(filtered);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      taxId: s.taxId,
      phone: s.phone,
      email: s.email,
      address: s.address,
      streetNumber: s.streetNumber,
      floor: s.floor,
      addressExtra: s.addressExtra,
      city: s.city,
      province: s.province,
      contactPerson: s.contactPerson,
      notes: s.notes,
      iban: s.iban,
      paymentTerms: s.paymentTerms,
      dueDays: s.dueDays,
      active: s.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const updateField = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            Proveedores
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona tus proveedores para órdenes de compra y facturación
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo proveedor
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, CIF o contacto..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Bulk actions */}
      <BulkActionBar
        count={count}
        onClear={clear}
        entityName="proveedores"
        onDelete={async () => {
          const ids = Array.from(selectedIds);
          for (const id of ids) {
            await supabase.from("suppliers").delete().eq("id", id);
          }
          qc.invalidateQueries({ queryKey: ["suppliers"] });
          clear();
        }}
        onExport={() => {
          const sel = filtered.filter((s) => selectedIds.has(s.id));
          const headers = ["Nombre", "CIF/NIF", "Contacto", "Email", "Teléfono", "Ciudad", "Cond. Pago", "Estado"];
          const csvRows = sel.map((s) => [s.name, s.taxId, s.contactPerson, s.email, s.phone, s.city, `${s.paymentTerms} ${s.dueDays}d`, s.active ? "Activo" : "Inactivo"]);
          exportCsv("proveedores.csv", headers, csvRows);
        }}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {suppliers.length === 0
                ? "No hay proveedores registrados. Crea el primero."
                : "No se encontraron proveedores con ese filtro."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Seleccionar todos"
                    />
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CIF/NIF</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Cond. pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(s)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs">{s.taxId || "—"}</TableCell>
                    <TableCell>{s.contactPerson || "—"}</TableCell>
                    <TableCell>
                      {s.phone && (
                        <span className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" /> {s.phone}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.paymentTerms} · {s.dueDays}d
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.active ? "default" : "secondary"}>
                        {s.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre comercial *</Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Ej: Saltoki" />
            </div>
            <div className="space-y-1.5">
              <Label>CIF / NIF</Label>
              <Input value={form.taxId} onChange={(e) => updateField("taxId", e.target.value)} placeholder="B12345678" />
            </div>
            <div className="space-y-1.5">
              <Label>Persona de contacto</Label>
              <Input value={form.contactPerson} onChange={(e) => updateField("contactPerson", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Dirección</Label>
              <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Provincia</Label>
              <Input value={form.province} onChange={(e) => updateField("province", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>IBAN</Label>
              <Input value={form.iban} onChange={(e) => updateField("iban", e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Condiciones de pago</Label>
              <Select value={form.paymentTerms} onValueChange={(v) => updateField("paymentTerms", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contado">Contado</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Giro_Bancario">Giro bancario</SelectItem>
                  <SelectItem value="Confirming">Confirming</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Días de vencimiento</Label>
              <Input type="number" min={0} value={form.dueDays} onChange={(e) => updateField("dueDays", Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(v) => updateField("active", v)} />
              <Label>Activo</Label>
            </div>
            <div className="col-span-full space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={3} placeholder="Observaciones..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button disabled={!form.name.trim() || isSaving} onClick={handleSave}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Guardar cambios" : "Crear proveedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
