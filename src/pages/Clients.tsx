import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { useCollaborators } from "@/hooks/useCollaborators";
import { Search, Plus, Filter, Loader2, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import type { DbClient } from "@/hooks/useClients";
import ClientFormDialog, { type ClientFormData } from "@/components/clients/ClientFormDialog";

const planColors: Record<string, string> = {
  Agua: "bg-info/15 text-info border-info/30",
  Luz: "bg-warning/15 text-warning border-warning/30",
  Clima: "bg-primary/15 text-primary border-primary/30",
  Ninguno: "bg-muted text-muted-foreground border-border",
};

const emptyClient = (): ClientFormData => ({
  clientType: "Particular",
  name: "", companyName: "", dni: "", taxId: "", email: "", phone: "", address: "", postalCode: "", city: "", province: "",
  clusterId: "", collaboratorId: null, collaboratorName: null, planType: "Ninguno", lastServiceDate: null,
});

const clientToForm = (c: DbClient): ClientFormData => ({
  clientType: c.clientType,
  name: c.name, companyName: c.companyName, dni: c.dni, taxId: c.taxId, email: c.email, phone: c.phone,
  address: c.address, postalCode: c.postalCode, city: c.city, province: c.province,
  clusterId: c.clusterId, collaboratorId: c.collaboratorId, collaboratorName: c.collaboratorName,
  planType: c.planType, lastServiceDate: c.lastServiceDate,
});

export default function Clients() {
  const [search, setSearch] = useState("");
  const { data: clients = [], isLoading } = useClients();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DbClient | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyClient());
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { collaborators } = useCollaborators();
  const [deleteTarget, setDeleteTarget] = useState<DbClient | null>(null);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );

  const validateForm = () => {
    if (form.clientType === "Empresa") {
      return !!(form.companyName.trim() && form.taxId.trim());
    }
    return !!(form.name.trim() && form.dni.trim());
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    await createClient.mutateAsync(form);
    setForm(emptyClient());
    setCreateOpen(false);
  };

  const handleEdit = async () => {
    if (!editTarget || !validateForm()) return;
    await updateClient.mutateAsync({ ...form, id: editTarget.id } as DbClient);
    setEditTarget(null);
  };

  const openCreate = () => { setForm(emptyClient()); setCreateOpen(true); };
  const openEdit = (c: DbClient) => { setForm(clientToForm(c)); setEditTarget(c); };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} clientes registrados</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, ID o ciudad..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">ID</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">DNI/CIF</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Nombre</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Dirección</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Ciudad</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Colaborador</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Plan</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Últ. Servicio</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openEdit(c)}>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", c.clientType === "Empresa" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
                      {c.clientType}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.clientType === "Empresa" ? c.taxId : c.dni}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-card-foreground">{c.clientType === "Empresa" ? c.companyName : c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate">{c.address}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.city}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.collaboratorName ?? <span className="italic">Directo</span>}</td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", planColors[c.planType])}>
                      {c.planType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {c.lastServiceDate ? new Date(c.lastServiceDate).toLocaleDateString("es-ES") : "—"}
                  </td>
                  <td className="px-2 py-3 flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog nuevo cliente */}
      <ClientFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        form={form}
        setForm={setForm}
        onSave={handleCreate}
        collaborators={collaborators}
        title="Nuevo Cliente"
        saveLabel="Crear cliente"
      />

      {/* Dialog editar cliente */}
      <ClientFormDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        form={form}
        setForm={setForm}
        onSave={handleEdit}
        collaborators={collaborators}
        title={`Editar ${editTarget?.id ?? ""}`}
        saveLabel="Guardar cambios"
      />

      {/* Dialog confirmar eliminación */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente el cliente <strong>{deleteTarget?.clientType === "Empresa" ? deleteTarget?.companyName : deleteTarget?.name}</strong> ({deleteTarget?.id}). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (deleteTarget) { deleteClient.mutate(deleteTarget.id); setDeleteTarget(null); } }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
