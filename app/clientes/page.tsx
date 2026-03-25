"use client";

import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { useCollaborators } from "@/hooks/useCollaborators";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useBranches } from "@/hooks/useBranches";
import { Search, Plus, Filter, Loader2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import type { DbClient } from "@/hooks/useClients";
import ClientFormDialog, { type ClientFormData } from "@/components/clients/ClientFormDialog";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import BulkActionBar from "@/components/shared/BulkActionBar";
import { exportCsv } from "@/lib/exportCsv";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useServiceOrigins } from "@/hooks/useServiceOrigins";
import type { ServiceOrigin } from "@/types/urbango";

const defaultPlanColor = "bg-muted text-muted-foreground border-border";

const emptyClient = (): ClientFormData => ({
  clientType: "Particular",
  name: "", lastName: "", companyName: "", dni: "", taxId: "", email: "", phone: "",
  address: "", streetNumber: "", floor: "", addressExtra: "",
  postalCode: "", city: "", province: "",
  clusterId: "", collaboratorId: null, collaboratorName: null, planType: "Ninguno", lastServiceDate: null, origin: "Directo",
});

const clientToForm = (c: DbClient): ClientFormData => ({
  clientType: c.clientType,
  name: c.name, lastName: c.lastName, companyName: c.companyName, dni: c.dni, taxId: c.taxId, email: c.email, phone: c.phone,
  address: c.address, streetNumber: c.streetNumber, floor: c.floor, addressExtra: c.addressExtra,
  postalCode: c.postalCode, city: c.city, province: c.province,
  clusterId: c.clusterId, collaboratorId: c.collaboratorId, collaboratorName: c.collaboratorName,
  planType: c.planType, lastServiceDate: c.lastServiceDate, origin: c.origin as ServiceOrigin,
});

export default function Clients() {
  const [search, setSearch] = useState("");
  const { data: clients = [], isLoading } = useClients();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DbClient | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyClient());
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const { collaborators } = useCollaborators();
  const { data: serviceOrigins = [] } = useServiceOrigins();
  const hasAssistanceOrigin = serviceOrigins.some(o => o.is_assistance && o.active);
  const [isAssistanceClient, setIsAssistanceClient] = useState(false);
  const { data: plans = [] } = useSubscriptionPlans();
  const { data: branches = [] } = useBranches();
  const branchByCluster = useMemo(() => {
    const m: Record<string, string> = {};
    branches.forEach((b) => { b.cluster_ids.forEach((cid) => { m[cid] = b.name; }); });
    return m;
  }, [branches]);
  const planColorMap = useMemo(() => {
    const m: Record<string, string> = { Ninguno: defaultPlanColor };
    plans.forEach((p) => { m[p.name] = p.color; });
    return m;
  }, [plans]);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: finishedCounts = {} } = useQuery({
    queryKey: ["client-finished-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("client_id").eq("status", "Finalizado");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((s) => { counts[s.client_id] = (counts[s.client_id] || 0) + 1; });
      return counts;
    },
  });

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.dni.toLowerCase().includes(q) ||
      c.taxId.toLowerCase().includes(q)
    );
  });

  const bulk = useBulkSelect(filtered);

  const validateForm = () => {
    if (form.clientType === "Empresa") return !!(form.companyName.trim() && form.taxId.trim());
    if (isAssistanceClient) return !!form.name.trim();
    if (!form.name.trim() || !form.dni.trim()) return false;
    const dniLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
    const v = form.dni.trim().toUpperCase();
    const nieMatch = v.match(/^([XYZ])(\d{7})([A-Z])$/);
    if (nieMatch) {
      const prefix = { X: "0", Y: "1", Z: "2" }[nieMatch[1]] ?? "0";
      return dniLetters[parseInt(prefix + nieMatch[2], 10) % 23] === nieMatch[3];
    }
    const dniMatch = v.match(/^(\d{8})([A-Z])$/);
    if (dniMatch) return dniLetters[parseInt(dniMatch[1], 10) % 23] === dniMatch[2];
    return false;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    await createClient.mutateAsync(form as any);
    setForm(emptyClient());
    setCreateOpen(false);
  };

  const handleEdit = async () => {
    if (!editTarget || !validateForm()) return;
    await updateClient.mutateAsync({ ...form, id: editTarget.id } as DbClient);
    setEditTarget(null);
  };

  const handleBulkDelete = async () => {
    const ids = bulk.selectedItems.map((c) => c.id);
    for (const id of ids) { await supabase.from("clients").delete().eq("id", id); }
    bulk.clear();
    qc.invalidateQueries({ queryKey: ["clients"] });
    toast({ title: `${ids.length} cliente(s) eliminado(s)` });
  };

  const handleBulkExport = () => {
    const headers = ["ID", "Tipo", "Nombre", "Apellidos", "Razón Social", "DNI", "CIF", "Email", "Teléfono", "Calle", "Número", "Piso", "Adicional", "Ciudad", "Provincia", "CP", "Plan", "Colaborador", "Últ. Servicio"];
    const rows = bulk.selectedItems.map((c) => [
      c.id, c.clientType, c.name, c.lastName, c.companyName, c.dni, c.taxId, c.email, c.phone, c.address, c.streetNumber, c.floor, c.addressExtra, c.city, c.province, c.postalCode, c.planType, c.collaboratorName ?? "Directo", c.lastServiceDate ?? "",
    ]);
    exportCsv("clientes.csv", headers, rows);
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
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Nuevo Cliente</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, email, teléfono, DNI..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
      </div>

      <BulkActionBar count={bulk.count} onClear={bulk.clear} onDelete={handleBulkDelete} onExport={handleBulkExport} entityName="clientes" />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-3 w-10"><Checkbox checked={bulk.allSelected} onCheckedChange={bulk.toggleAll} className={bulk.someSelected ? "data-[state=unchecked]:bg-primary/20" : ""} /></th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">ID</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">DNI/CIF</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Nombre</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Apellidos</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Dirección</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Ciudad</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Sede</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Colaborador</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Plan</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Finalizados</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Últ. Servicio</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className={cn("border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer", bulk.selectedIds.has(c.id) && "bg-primary/5")} onClick={() => openEdit(c)}>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={bulk.selectedIds.has(c.id)} onCheckedChange={() => bulk.toggle(c.id)} /></td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                  <td className="px-5 py-3"><span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", c.clientType === "Empresa" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>{c.clientType}</span></td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.clientType === "Empresa" ? c.taxId : c.dni}</td>
                  <td className="px-5 py-3"><p className="font-medium text-card-foreground">{c.clientType === "Empresa" ? c.companyName : c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></td>
                  <td className="px-5 py-3 text-muted-foreground">{c.clientType === "Empresa" ? "" : c.lastName}</td>
                  <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate">{c.address}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.city}</td>
                  <td className="px-5 py-3"><span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", branchByCluster[c.clusterId] ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground")}>{branchByCluster[c.clusterId] ?? "—"}</span></td>
                  <td className="px-5 py-3 text-muted-foreground">{c.collaboratorName ?? <span className="italic">Directo</span>}</td>
                  <td className="px-5 py-3"><span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", planColorMap[c.planType] ?? defaultPlanColor)}>{c.planType}</span></td>
                  <td className="px-5 py-3 text-center"><span className={cn("inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-full text-xs font-semibold", (finishedCounts[c.id] ?? 0) > 0 ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>{finishedCounts[c.id] ?? 0}</span></td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{c.lastServiceDate ? new Date(c.lastServiceDate).toLocaleDateString("es-ES") : "—"}</td>
                  <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ClientFormDialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setIsAssistanceClient(false); }} form={form} setForm={setForm} onSave={handleCreate} collaborators={collaborators} title="Nuevo Cliente" saveLabel="Crear cliente" dniOptional={isAssistanceClient} />
      <ClientFormDialog open={!!editTarget} onOpenChange={(open) => { if (!open) { setEditTarget(null); setIsAssistanceClient(false); } }} form={form} setForm={setForm} onSave={handleEdit} collaborators={collaborators} title={`Editar ${editTarget?.id ?? ""}`} saveLabel="Guardar cambios" dniOptional={isAssistanceClient} />
    </div>
  );
}
