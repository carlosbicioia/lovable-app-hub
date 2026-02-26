import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Building2, Star, Pencil, Trash2, Users, Wrench, Settings, Upload, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Collaborator, CollaboratorCategory } from "@/types/urbango";

const categoryColors: Record<string, string> = {
  Administrador: "bg-info/15 text-info border-info/30",
  Corredor: "bg-primary/15 text-primary border-primary/30",
  Gestoría: "bg-success/15 text-success border-success/30",
  Otros: "bg-muted text-muted-foreground border-border",
};

const categories: CollaboratorCategory[] = ["Administrador", "Corredor", "Gestoría", "Otros"];

interface AssignedClient {
  id: string;
  clientName: string;
  clientId: string;
  address: string;
}

interface AssignedService {
  id: string;
  clientName: string;
  specialty: string;
  status: string;
  scheduledAt: string | null;
  urgency: string;
}

const statusColors: Record<string, string> = {
  Pendiente_Contacto: "bg-warning/15 text-warning border-warning/30",
  Agendado: "bg-info/15 text-info border-info/30",
  En_Curso: "bg-primary/15 text-primary border-primary/30",
  Finalizado: "bg-success/15 text-success border-success/30",
  Liquidado: "bg-muted text-muted-foreground border-border",
};

export default function CollaboratorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    companyName: "", category: "Administrador" as CollaboratorCategory,
    email: "", phone: "", contactPerson: "",
  });
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<AssignedClient[]>([]);
  const [services, setServices] = useState<AssignedService[]>([]);
  const [portalEnabled, setPortalEnabled] = useState(false);
  const [portalEmail, setPortalEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contacts, setContacts] = useState<{ name: string; email: string; phone: string }[]>([]);

  const fetchCollaborator = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("collaborators" as any)
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      toast({ title: "Error", description: "Colaborador no encontrado", variant: "destructive" });
      navigate("/colaboradores");
      return;
    }
    const row = data as any;
    const c: Collaborator = {
      id: row.id, companyName: row.company_name, category: row.category,
      email: row.email, phone: row.phone, contactPerson: row.contact_person,
      npsMean: Number(row.nps_mean), activeServices: row.active_services,
      totalClients: row.total_clients,
    };
    setCollaborator(c);
    setForm({
      companyName: c.companyName, category: c.category,
      email: c.email, phone: c.phone, contactPerson: c.contactPerson,
    });
    setPortalEmail(c.email);
    setLoading(false);
  }, [id, navigate]);

  const fetchClients = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("services" as any)
      .select("client_name, client_id, address")
      .eq("collaborator_id", id);
    if (data) {
      const unique = new Map<string, AssignedClient>();
      (data as any[]).forEach((s) => {
        if (!unique.has(s.client_id)) {
          unique.set(s.client_id, {
            id: s.client_id, clientName: s.client_name,
            clientId: s.client_id, address: s.address || "",
          });
        }
      });
      setClients(Array.from(unique.values()));
    }
  }, [id]);

  const fetchServices = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("services" as any)
      .select("id, client_name, specialty, status, scheduled_at, urgency")
      .eq("collaborator_id", id)
      .order("created_at", { ascending: false });
    if (data) {
      setServices((data as any[]).map((s) => ({
        id: s.id, clientName: s.client_name, specialty: s.specialty,
        status: s.status, scheduledAt: s.scheduled_at, urgency: s.urgency,
      })));
    }
  }, [id]);

  useEffect(() => {
    fetchCollaborator();
    fetchClients();
    fetchServices();
  }, [fetchCollaborator, fetchClients, fetchServices]);

  const handleSave = async () => {
    if (!id || !form.companyName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("collaborators" as any)
      .update({
        company_name: form.companyName, category: form.category,
        email: form.email, phone: form.phone, contact_person: form.contactPerson,
      } as any)
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    } else {
      toast({ title: "Colaborador actualizado" });
      setEditing(false);
      fetchCollaborator();
    }
  };

  const addContact = () => setContacts((c) => [...c, { name: "", email: "", phone: "" }]);
  const removeContact = (i: number) => setContacts((c) => c.filter((_, idx) => idx !== i));
  const updateContact = (i: number, field: string, value: string) =>
    setContacts((c) => c.map((ct, idx) => idx === i ? { ...ct, [field]: value } : ct));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!collaborator) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/colaboradores")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-display font-bold text-foreground truncate">
                {collaborator.companyName}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", categoryColors[collaborator.category])}>
                  {collaborator.category}
                </span>
                <span className="text-sm text-muted-foreground">{collaborator.id}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-6 text-center">
            <div>
              <p className="text-xl font-display font-bold text-foreground">{collaborator.activeServices}</p>
              <p className="text-xs text-muted-foreground">Servicios activos</p>
            </div>
            <div>
              <p className="text-xl font-display font-bold text-foreground">{collaborator.totalClients}</p>
              <p className="text-xs text-muted-foreground">Clientes</p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <p className="text-xl font-display font-bold text-foreground">{collaborator.npsMean}</p>
              <p className="text-xs text-muted-foreground ml-1">NPS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-0">
          <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5">
            <Building2 className="w-4 h-4 mr-2" /> Datos generales
          </TabsTrigger>
          <TabsTrigger value="clients" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5">
            <Users className="w-4 h-4 mr-2" /> Clientes asignados
          </TabsTrigger>
          <TabsTrigger value="services" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5">
            <Wrench className="w-4 h-4 mr-2" /> Servicios asignados
          </TabsTrigger>
          <TabsTrigger value="config" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5">
            <Settings className="w-4 h-4 mr-2" /> Configuración
          </TabsTrigger>
        </TabsList>

        {/* Tab: Datos generales */}
        <TabsContent value="general" className="mt-6">
          <div className="bg-card rounded-xl border border-border p-6 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-card-foreground">Información del colaborador</h2>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm({ companyName: collaborator.companyName, category: collaborator.category, email: collaborator.email, phone: collaborator.phone, contactPerson: collaborator.contactPerson }); }}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre de empresa</Label>
                {editing ? (
                  <Input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
                ) : (
                  <p className="text-sm text-foreground">{collaborator.companyName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                {editing ? (
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as CollaboratorCategory }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-foreground">{collaborator.category}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Persona de contacto</Label>
                {editing ? (
                  <Input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} />
                ) : (
                  <p className="text-sm text-foreground">{collaborator.contactPerson || "—"}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  {editing ? (
                    <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  ) : (
                    <p className="text-sm text-foreground">{collaborator.email || "—"}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  {editing ? (
                    <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  ) : (
                    <p className="text-sm text-foreground">{collaborator.phone || "—"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Clientes asignados */}
        <TabsContent value="clients" className="mt-6">
          <div className="bg-card rounded-xl border border-border">
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-card-foreground">
                Clientes asignados
                <span className="text-sm font-normal text-muted-foreground ml-2">({clients.length})</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Clientes que tienen servicios vinculados a este colaborador
              </p>
            </div>
            {clients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No hay clientes asignados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Cliente</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Dirección</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{c.clientId}</TableCell>
                      <TableCell className="font-medium">{c.clientName}</TableCell>
                      <TableCell className="text-muted-foreground">{c.address || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Tab: Servicios asignados */}
        <TabsContent value="services" className="mt-6">
          <div className="bg-card rounded-xl border border-border">
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-card-foreground">
                Servicios asignados
                <span className="text-sm font-normal text-muted-foreground ml-2">({services.length})</span>
              </h2>
            </div>
            {services.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No hay servicios asignados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Urgencia</TableHead>
                    <TableHead>Fecha programada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/servicios/${s.id}`)}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{s.id}</TableCell>
                      <TableCell className="font-medium">{s.clientName}</TableCell>
                      <TableCell>{s.specialty}</TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", statusColors[s.status] || "bg-muted text-muted-foreground border-border")}>
                          {s.status.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell>{s.urgency}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString("es-ES") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Tab: Configuración */}
        <TabsContent value="config" className="mt-6 space-y-6 max-w-2xl">
          {/* Portal access */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">Acceso al portal</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Configura el acceso del colaborador a su portal de gestión
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Portal habilitado</Label>
                  <p className="text-xs text-muted-foreground">Permite al colaborador acceder al portal</p>
                </div>
                <Switch checked={portalEnabled} onCheckedChange={setPortalEnabled} />
              </div>
              {portalEnabled && (
                <div className="space-y-1.5">
                  <Label>Email de acceso</Label>
                  <Input value={portalEmail} onChange={(e) => setPortalEmail(e.target.value)} placeholder="email@empresa.es" />
                  <p className="text-xs text-muted-foreground">Se enviará una invitación a este email</p>
                </div>
              )}
            </div>
          </div>

          {/* Logo */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">Logo del colaborador</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Logo que aparecerá en documentos y presupuestos asociados
            </p>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <Button variant="outline" size="sm">
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Subir logo
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 2MB</p>
              </div>
            </div>
          </div>

          {/* Assigned contacts */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Contactos asignados</h2>
                <p className="text-sm text-muted-foreground">
                  Personas de contacto adicionales del colaborador
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addContact}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Añadir contacto
              </Button>
            </div>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No hay contactos adicionales</p>
            ) : (
              <div className="space-y-3">
                {contacts.map((ct, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nombre</Label>
                        <Input value={ct.name} onChange={(e) => updateContact(i, "name", e.target.value)} placeholder="Nombre" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input value={ct.email} onChange={(e) => updateContact(i, "email", e.target.value)} placeholder="Email" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Teléfono</Label>
                        <Input value={ct.phone} onChange={(e) => updateContact(i, "phone", e.target.value)} placeholder="Teléfono" className="h-8 text-sm" />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0 mt-5" onClick={() => removeContact(i)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
