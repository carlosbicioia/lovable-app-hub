import { useClients, useCreateClient } from "@/hooks/useClients";
import { Search, Plus, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClientPlanType } from "@/types/urbango";

const planColors: Record<string, string> = {
  Agua: "bg-info/15 text-info border-info/30",
  Luz: "bg-warning/15 text-warning border-warning/30",
  Clima: "bg-primary/15 text-primary border-primary/30",
  Ninguno: "bg-muted text-muted-foreground border-border",
};

const emptyClient = () => ({
  name: "", dni: "", email: "", phone: "", address: "", postalCode: "", city: "", province: "",
  clusterId: "", collaboratorId: null as string | null, collaboratorName: null as string | null, planType: "Ninguno", lastServiceDate: null as string | null,
});



export default function Clients() {
  const [search, setSearch] = useState("");
  const { data: clients = [], isLoading } = useClients();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyClient());
  const createClient = useCreateClient();

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name.trim() || !form.dni.trim()) {
      return;
    }
    await createClient.mutateAsync(form);
    setForm(emptyClient());
    setOpen(false);
  };

  const upd = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} clientes registrados</p>
        </div>
        <Button onClick={() => setOpen(true)}>
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
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">DNI</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Nombre</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Dirección</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Ciudad</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Colaborador</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Plan</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Últ. Servicio</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.dni}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-card-foreground">{c.name}</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog nuevo cliente */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Nombre completo" />
            </div>
            <div className="space-y-1.5">
              <Label>DNI *</Label>
              <Input value={form.dni} onChange={(e) => upd("dni", e.target.value)} placeholder="12345678A" />
            </div>
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
                  {(["Ninguno", "Agua", "Luz", "Clima"] as ClientPlanType[]).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Crear cliente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
