import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Building2, Users, Shield, FileText, Bell, Palette, Mail, KeyRound,
  Plus, Trash2, Upload, Clock, Wrench, Loader2, HardHat,
  Pencil, Droplets, Zap, Wind, Percent, Flame, ThermometerSun,
  Paintbrush, Hammer, Cable, Lock, Pipette, Gauge, Cog,
  ShieldCheck as ShieldCheckIcon, Fan, Plug, Construction, Database,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useProtocolSteps, useUpdateProtocolStep, useCreateProtocolStep, useDeleteProtocolStep } from "@/hooks/useProtocolSteps";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompanySettings, useUpdateCompanySettings } from "@/hooks/useCompanySettings";
import { useAppUsers, useCreateAppUser, useUpdateAppUser, useDeleteAppUser } from "@/hooks/useAppUsers";
import { useSystemUsers, useUpdateUserRole, useManageUser } from "@/hooks/useSystemUsers";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSpecialties, useCreateSpecialty, useUpdateSpecialty, useDeleteSpecialty,
  useCertifications, useCreateCertification, useUpdateCertification, useDeleteCertification,
  type SpecialtyRow, type CertificationRow,
} from "@/hooks/useIndustrialConfig";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import TaxTypesConfigTab from "@/components/settings/TaxTypesConfigTab";
import BulkImportTab from "@/components/settings/BulkImportTab";
import SubscriptionPlansTab from "@/components/settings/SubscriptionPlansTab";

const roles = [
  { value: "admin", label: "Administrador", desc: "Acceso total al sistema" },
  { value: "gestor", label: "Gestor", desc: "Gestión de servicios, presupuestos y clientes" },
  { value: "operario", label: "Operario", desc: "Solo acceso a sus servicios asignados" },
  { value: "lectura", label: "Solo lectura", desc: "Visualización sin edición" },
];

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
);

const iconMap: Record<string, React.ReactNode> = {
  Droplets: <Droplets className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Wind: <Wind className="w-4 h-4" />,
  Wrench: <Wrench className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  ThermometerSun: <ThermometerSun className="w-4 h-4" />,
  Paintbrush: <Paintbrush className="w-4 h-4" />,
  Hammer: <Hammer className="w-4 h-4" />,
  Cable: <Cable className="w-4 h-4" />,
  Lock: <Lock className="w-4 h-4" />,
  Pipette: <Pipette className="w-4 h-4" />,
  Gauge: <Gauge className="w-4 h-4" />,
  Cog: <Cog className="w-4 h-4" />,
  Fan: <Fan className="w-4 h-4" />,
  Plug: <Plug className="w-4 h-4" />,
  Construction: <Construction className="w-4 h-4" />,
};

const colorOptions = [
  { value: "bg-info/15 text-info border-info/30", label: "Azul (Info)" },
  { value: "bg-warning/15 text-warning border-warning/30", label: "Naranja (Warning)" },
  { value: "bg-success/15 text-success border-success/30", label: "Verde (Success)" },
  { value: "bg-destructive/15 text-destructive border-destructive/30", label: "Rojo (Destructive)" },
  { value: "bg-primary/15 text-primary border-primary/30", label: "Primario" },
  { value: "bg-muted text-muted-foreground border-border", label: "Neutro" },
];

const iconOptions = [
  { value: "Droplets", label: "💧 Agua / Fontanería" },
  { value: "Zap", label: "⚡ Electricidad" },
  { value: "Wind", label: "🌀 Clima / Aire" },
  { value: "Flame", label: "🔥 Gas / Calefacción" },
  { value: "ThermometerSun", label: "🌡 Calor / Solar" },
  { value: "Fan", label: "🌬 Ventilación" },
  { value: "Plug", label: "🔌 Conexiones" },
  { value: "Cable", label: "🔗 Cableado" },
  { value: "Paintbrush", label: "🖌 Pintura / Acabados" },
  { value: "Hammer", label: "🔨 Albañilería" },
  { value: "Construction", label: "🏗 Obra civil" },
  { value: "Lock", label: "🔒 Cerrajería" },
  { value: "Pipette", label: "🧪 Químicos" },
  { value: "Gauge", label: "📊 Medición" },
  { value: "Cog", label: "⚙ Mecánica" },
  { value: "Wrench", label: "🔧 General" },
];

function IndustrialConfigTab() {
  const { data: specialties, isLoading: specLoading } = useSpecialties();
  const createSpec = useCreateSpecialty();
  const updateSpec = useUpdateSpecialty();
  const deleteSpec = useDeleteSpecialty();

  const { data: certifications, isLoading: certLoading } = useCertifications();
  const createCert = useCreateCertification();
  const updateCert = useUpdateCertification();
  const deleteCert = useDeleteCertification();

  const [showNewSpec, setShowNewSpec] = useState(false);
  const [newSpecName, setNewSpecName] = useState("");
  const [newSpecIcon, setNewSpecIcon] = useState("Wrench");
  const [newSpecColor, setNewSpecColor] = useState(colorOptions[0].value);

  const [showNewCert, setShowNewCert] = useState(false);
  const [newCertName, setNewCertName] = useState("");
  const [newCertDesc, setNewCertDesc] = useState("");

  const [editSpec, setEditSpec] = useState<SpecialtyRow | null>(null);
  const [editCert, setEditCert] = useState<CertificationRow | null>(null);

  const handleCreateSpec = () => {
    if (!newSpecName.trim()) return;
    createSpec.mutate({ name: newSpecName.trim(), icon: newSpecIcon, color: newSpecColor }, {
      onSuccess: () => { setShowNewSpec(false); setNewSpecName(""); setNewSpecIcon("Wrench"); setNewSpecColor(colorOptions[0].value); },
    });
  };

  const handleCreateCert = () => {
    if (!newCertName.trim()) return;
    createCert.mutate({ name: newCertName.trim(), description: newCertDesc.trim() }, {
      onSuccess: () => { setShowNewCert(false); setNewCertName(""); setNewCertDesc(""); },
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── ESPECIALIDADES ─── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Especialidades</CardTitle>
            <CardDescription>Define las especialidades técnicas disponibles para los operarios</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {specLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <>
              {(specialties ?? []).map((sp) => (
                <div key={sp.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-lg border", sp.color)}>
                      {iconMap[sp.icon] ?? <Wrench className="w-4 h-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{sp.name}</p>
                      <p className="text-xs text-muted-foreground">{sp.active ? "Activa" : "Inactiva"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sp.active}
                      onCheckedChange={(checked) => updateSpec.mutate({ id: sp.id, active: checked })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => setEditSpec(sp)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar especialidad?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer. Los operarios que tengan esta especialidad no se verán afectados.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteSpec.mutate(sp.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              {showNewSpec ? (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Nombre *</Label>
                    <Input value={newSpecName} onChange={(e) => setNewSpecName(e.target.value)} placeholder="Ej: Gas Natural" autoFocus />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Icono</Label>
                      <Select value={newSpecIcon} onValueChange={setNewSpecIcon}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {iconOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Color</Label>
                      <Select value={newSpecColor} onValueChange={setNewSpecColor}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {colorOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewSpec(false)}>Cancelar</Button>
                    <Button size="sm" disabled={!newSpecName.trim() || createSpec.isPending} onClick={handleCreateSpec}>
                      {createSpec.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Añadir
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowNewSpec(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Añadir especialidad
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── CERTIFICACIONES ─── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Certificaciones</CardTitle>
            <CardDescription>Define las certificaciones disponibles para asignar a los operarios</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {certLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <>
              {(certifications ?? []).map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{cert.name}</p>
                      {cert.description && <p className="text-xs text-muted-foreground">{cert.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={cert.active}
                      onCheckedChange={(checked) => updateCert.mutate({ id: cert.id, active: checked })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => setEditCert(cert)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar certificación?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteCert.mutate(cert.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}

              {showNewCert ? (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Nombre *</Label>
                    <Input value={newCertName} onChange={(e) => setNewCertName(e.target.value)} placeholder="Ej: Certificado F-Gas" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Descripción</Label>
                    <Input value={newCertDesc} onChange={(e) => setNewCertDesc(e.target.value)} placeholder="Ej: Requerido para instalaciones de gas fluorado" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewCert(false)}>Cancelar</Button>
                    <Button size="sm" disabled={!newCertName.trim() || createCert.isPending} onClick={handleCreateCert}>
                      {createCert.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Añadir
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowNewCert(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Añadir certificación
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Specialty Dialog */}
      <Dialog open={!!editSpec} onOpenChange={(o) => !o && setEditSpec(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar especialidad</DialogTitle></DialogHeader>
          {editSpec && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editSpec.name} onChange={(e) => setEditSpec({ ...editSpec, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Icono</Label>
                  <Select value={editSpec.icon} onValueChange={(v) => setEditSpec({ ...editSpec, icon: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Select value={editSpec.color} onValueChange={(v) => setEditSpec({ ...editSpec, color: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSpec(null)}>Cancelar</Button>
            <Button disabled={updateSpec.isPending} onClick={() => {
              if (!editSpec) return;
              updateSpec.mutate({ id: editSpec.id, name: editSpec.name, icon: editSpec.icon, color: editSpec.color }, {
                onSuccess: () => setEditSpec(null),
              });
            }}>
              {updateSpec.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Certification Dialog */}
      <Dialog open={!!editCert} onOpenChange={(o) => !o && setEditCert(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar certificación</DialogTitle></DialogHeader>
          {editCert && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editCert.name} onChange={(e) => setEditCert({ ...editCert, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={editCert.description} onChange={(e) => setEditCert({ ...editCert, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCert(null)}>Cancelar</Button>
            <Button disabled={updateCert.isPending} onClick={() => {
              if (!editCert) return;
              updateCert.mutate({ id: editCert.id, name: editCert.name, description: editCert.description }, {
                onSuccess: () => setEditCert(null),
              });
            }}>
              {updateCert.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LogoUploadSection({ logoUrl, onUploaded }: { logoUrl: string | null; onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayUrl = localPreview || logoUrl;

  const handleUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 2 MB");
      return;
    }
    // Show local preview immediately
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `logo.${ext}`;
      await supabase.storage.from("company-assets").remove([path]);
      const { error } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
      onUploaded(`${urlData.publicUrl}?t=${Date.now()}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Error al subir el logotipo");
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Logotipo</Label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden">
          {displayUrl ? (
            <img src={displayUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <Upload className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
            {uploading ? "Subiendo..." : "Subir logo"}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">PNG, SVG o JPG, máximo 2 MB</p>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { data: settings, isLoading: settingsLoading } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const { data: users, isLoading: usersLoading } = useAppUsers();
  const createUser = useCreateAppUser();
  const updateUser = useUpdateAppUser();
  const deleteUser = useDeleteAppUser();
  const { data: systemUsers, isLoading: systemUsersLoading } = useSystemUsers();
  const updateRole = useUpdateUserRole();
  const manageUser = useManageUser();
  const queryClient = useQueryClient();
  const { data: collaboratorsList } = useQuery({
    queryKey: ["collaborators_list"],
    queryFn: async () => {
      const { data } = await supabase.from("collaborators").select("id, company_name").order("company_name");
      return data ?? [];
    },
  });

  // Company form state
  const [companyForm, setCompanyForm] = useState<Record<string, any>>({});
  const [operativeForm, setOperativeForm] = useState<Record<string, any>>({});
  const [docsForm, setDocsForm] = useState<Record<string, any>>({});
  const [appearanceForm, setAppearanceForm] = useState<Record<string, any>>({});

  // New user dialog
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "operario", password: "", collaborator_id: "" });

  // Edit user dialog
  const [editingUser, setEditingUser] = useState<{ id: string; full_name: string; email: string; role: string | null; collaborator_id: string | null } | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", role: "", collaborator_id: "" });
  const updateAppUser = useUpdateAppUser();
  const deleteAppUser = useDeleteAppUser();
  const [resetPwUser, setResetPwUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Protocol - now from DB
  const { data: protocolItems = [], isLoading: protocolLoading } = useProtocolSteps();
  const updateStep = useUpdateProtocolStep();
  const createStep = useCreateProtocolStep();
  const deleteStep = useDeleteProtocolStep();
  const [newStepLabel, setNewStepLabel] = useState("");
  const [newStepDesc, setNewStepDesc] = useState("");
  const [showNewStep, setShowNewStep] = useState(false);

  // Sync forms when settings load
  useEffect(() => {
    if (settings) {
      setCompanyForm({
        company_name: settings.company_name,
        tax_id: settings.tax_id,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
      });
      setOperativeForm({
        sla_first_contact_hours: settings.sla_first_contact_hours,
        sla_resolution_hours: settings.sla_resolution_hours,
        default_vat: settings.default_vat,
        currency: settings.currency,
      });
      setDocsForm({
        budget_prefix: settings.budget_prefix,
        budget_next_number: settings.budget_next_number,
        budget_validity_days: settings.budget_validity_days,
        date_format: settings.date_format,
        budget_terms: (settings as any).budget_terms ?? "",
        legal_conditions: settings.legal_conditions,
        document_footer: settings.document_footer,
        service_prefix: settings.service_prefix,
        invoice_prefix: settings.invoice_prefix,
        purchase_order_prefix: (settings as any).purchase_order_prefix ?? "OC-",
      });
      setAppearanceForm({
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
      });
    }
  }, [settings]);

  const handleSaveCompany = () => updateSettings.mutate(companyForm);
  const handleSaveOperative = () => updateSettings.mutate(operativeForm);
  const handleSaveDocs = () => updateSettings.mutate(docsForm);
  const handleSaveAppearance = () => updateSettings.mutate(appearanceForm);

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    createUser.mutate(newUser, {
      onSuccess: () => {
        setShowNewUser(false);
        setNewUser({ name: "", email: "", role: "operario", password: "", collaborator_id: "" });
      },
    });
  };

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Administra tu empresa, usuarios y preferencias del sistema</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="company" className="text-sm gap-1.5"><Building2 className="w-3.5 h-3.5" /> Empresa</TabsTrigger>
          <TabsTrigger value="users" className="text-sm gap-1.5"><Users className="w-3.5 h-3.5" /> Usuarios</TabsTrigger>
          <TabsTrigger value="roles" className="text-sm gap-1.5"><Shield className="w-3.5 h-3.5" /> Permisos</TabsTrigger>
          <TabsTrigger value="documents" className="text-sm gap-1.5"><FileText className="w-3.5 h-3.5" /> Documentos</TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm gap-1.5"><Bell className="w-3.5 h-3.5" /> Notificaciones</TabsTrigger>
          <TabsTrigger value="appearance" className="text-sm gap-1.5"><Palette className="w-3.5 h-3.5" /> Apariencia</TabsTrigger>
          <TabsTrigger value="protocol" className="text-sm gap-1.5"><Wrench className="w-3.5 h-3.5" /> Protocolo</TabsTrigger>
          <TabsTrigger value="industrial" className="text-sm gap-1.5"><HardHat className="w-3.5 h-3.5" /> Industriales</TabsTrigger>
          <TabsTrigger value="fiscal" className="text-sm gap-1.5"><Percent className="w-3.5 h-3.5" /> Fiscal</TabsTrigger>
          <TabsTrigger value="plans" className="text-sm gap-1.5"><ShieldCheckIcon className="w-3.5 h-3.5" /> Planes</TabsTrigger>
          <TabsTrigger value="import" className="text-sm gap-1.5"><Database className="w-3.5 h-3.5" /> Importar datos</TabsTrigger>
        </TabsList>

        {/* ===== EMPRESA ===== */}
        <TabsContent value="company" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de la empresa</CardTitle>
              <CardDescription>Información legal y de contacto que aparecerá en documentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razón social</Label>
                  <Input value={companyForm.company_name ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, company_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>CIF / NIF</Label>
                  <Input value={companyForm.tax_id ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, tax_id: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Dirección fiscal</Label>
                  <Input value={companyForm.address ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={companyForm.phone ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Email de contacto</Label>
                  <Input type="email" value={companyForm.email ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Sitio web</Label>
                  <Input value={companyForm.website ?? ""} onChange={(e) => setCompanyForm(p => ({ ...p, website: e.target.value }))} />
                </div>
              </div>

              <Separator />

              <LogoUploadSection logoUrl={settings?.logo_url ?? null} onUploaded={(url) => updateSettings.mutate({ logo_url: url })} />

              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} disabled={updateSettings.isPending}>
                  {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración operativa</CardTitle>
              <CardDescription>Parámetros generales del negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SLA primer contacto (horas)</Label>
                  <Input type="number" value={operativeForm.sla_first_contact_hours ?? ""} onChange={(e) => setOperativeForm(p => ({ ...p, sla_first_contact_hours: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>SLA resolución (horas)</Label>
                  <Input type="number" value={operativeForm.sla_resolution_hours ?? ""} onChange={(e) => setOperativeForm(p => ({ ...p, sla_resolution_hours: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>IVA por defecto (%)</Label>
                  <Input type="number" value={operativeForm.default_vat ?? ""} onChange={(e) => setOperativeForm(p => ({ ...p, default_vat: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select value={operativeForm.currency ?? "EUR"} onValueChange={(v) => setOperativeForm(p => ({ ...p, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                      <SelectItem value="USD">$ Dólar (USD)</SelectItem>
                      <SelectItem value="GBP">£ Libra (GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveOperative} disabled={updateSettings.isPending}>
                  {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== USUARIOS ===== */}
        <TabsContent value="users" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Usuarios con acceso</CardTitle>
                <CardDescription>Usuarios autenticados en la plataforma y sus roles asignados</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{systemUsers?.length ?? 0} usuario(s)</span>
                <Button size="sm" onClick={() => setShowNewUser(true)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Nuevo Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {systemUsersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (systemUsers ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No se encontraron usuarios registrados</p>
              ) : (
                <div className="divide-y divide-border">
                  {(systemUsers ?? []).map((u) => {
                    const initials = u.full_name
                      ? u.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                      : u.email?.[0]?.toUpperCase() ?? "?";
                    const roleCfg = roles.find(r => r.value === u.role);
                    return (
                      <div key={u.id} className={cn("flex items-center justify-between py-3 gap-4", u.banned && "opacity-50")}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden", u.banned ? "bg-muted" : "bg-primary/10")}>
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-primary">{initials}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-card-foreground truncate">{u.full_name || "Sin nombre"}</p>
                              {u.banned && (
                                <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-medium">Desactivado</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            <p className="text-[10px] text-muted-foreground/60">
                              Registrado: {new Date(u.created_at).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Select
                            value={u.role ?? "sin_rol"}
                            disabled={u.banned}
                            onValueChange={(v) => {
                              if (v === "sin_rol") return;
                              updateRole.mutate({ userId: u.id, role: v });
                            }}
                          >
                            <SelectTrigger className={cn(
                              "h-7 w-[140px] text-xs font-medium",
                              u.role === "admin" ? "border-primary/30 text-primary" :
                              u.role === "gestor" ? "border-info/30 text-info" :
                              u.role === "colaborador" ? "border-warning/30 text-warning" :
                              "border-border text-muted-foreground"
                            )}>
                              <SelectValue>{roleCfg?.label ?? (u.role === "colaborador" ? "Colaborador" : "Sin rol")}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sin_rol" disabled>
                                <p className="text-sm text-muted-foreground">Sin rol asignado</p>
                              </SelectItem>
                              {roles.map(r => (
                                <SelectItem key={r.value} value={r.value}>
                                  <div>
                                    <p className="text-sm">{r.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                                  </div>
                                </SelectItem>
                              ))}
                              <SelectItem value="colaborador">
                                <div>
                                  <p className="text-sm">Colaborador</p>
                                  <p className="text-[10px] text-muted-foreground">Acceso al portal de colaborador</p>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {u.collaborator_id && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {u.collaborator_id}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={!u.banned}
                              disabled={manageUser.isPending}
                              onCheckedChange={(checked) => {
                                manageUser.mutate({ userId: u.id, action: checked ? "unban" : "ban" });
                              }}
                              className="scale-75"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Restablecer contraseña"
                            onClick={() => {
                              setResetPwUser({ id: u.id, name: u.full_name, email: u.email });
                              setNewPassword("");
                            }}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingUser({ id: u.id, full_name: u.full_name, email: u.email, role: u.role, collaborator_id: u.collaborator_id });
                              setEditForm({ full_name: u.full_name, role: u.role ?? "operario", collaborator_id: u.collaborator_id ?? "" });
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (!confirm(`¿Eliminar permanentemente a ${u.full_name || u.email}? Esta acción no se puede deshacer.`)) return;
                              manageUser.mutate({ userId: u.id, action: "delete" });
                            }}
                            disabled={manageUser.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PERMISOS ===== */}
        <TabsContent value="roles" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Roles y permisos</CardTitle>
              <CardDescription>Define qué puede hacer cada rol en la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {roles.map((role) => (
                <div key={role.value} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{role.label}</p>
                      <p className="text-xs text-muted-foreground">{role.desc}</p>
                    </div>
                    {role.value !== "admin" && (
                      <Button variant="outline" size="sm">Editar permisos</Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["Servicios", "Presupuestos", "Clientes", "Artículos", "Operarios", "Colaboradores", "Informes", "Configuración"].map((mod) => (
                      <div key={mod} className="flex items-center gap-2">
                        <Switch
                          defaultChecked={role.value === "admin" || (role.value === "gestor" && mod !== "Configuración")}
                          disabled={role.value === "admin"}
                        />
                        <span className="text-xs text-card-foreground">{mod}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== DOCUMENTOS ===== */}
        <TabsContent value="documents" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plantilla de presupuesto</CardTitle>
              <CardDescription>Personaliza el aspecto y contenido de los presupuestos generados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prefijo de numeración</Label>
                  <Input value={docsForm.budget_prefix ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, budget_prefix: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Siguiente número</Label>
                  <Input type="number" value={docsForm.budget_next_number ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, budget_next_number: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Validez por defecto (días)</Label>
                  <Input type="number" value={docsForm.budget_validity_days ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, budget_validity_days: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Formato de fecha</Label>
                  <Select value={docsForm.date_format ?? "dd/MM/yyyy"} onValueChange={(v) => setDocsForm(p => ({ ...p, date_format: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                      <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Términos y condiciones del presupuesto</Label>
                <p className="text-xs text-muted-foreground">Se incluirán por defecto en todos los presupuestos nuevos</p>
                <Textarea rows={5} className="resize-y" value={docsForm.budget_terms ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, budget_terms: e.target.value }))} placeholder="Ej: La aceptación de este presupuesto implica el pago inicial del 50%..." />
              </div>

              <div className="space-y-2">
                <Label>Condiciones legales</Label>
                <p className="text-xs text-muted-foreground">Texto legal que aparecerá al pie de los presupuestos</p>
                <Textarea rows={4} value={docsForm.legal_conditions ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, legal_conditions: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Nota al pie del documento</Label>
                <Textarea rows={2} value={docsForm.document_footer ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, document_footer: e.target.value }))} />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveDocs} disabled={updateSettings.isPending}>
                  {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar plantilla
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Otros documentos</CardTitle>
              <CardDescription>Configura prefijos y formatos para partes de trabajo y facturas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prefijo de servicio</Label>
                  <Input value={docsForm.service_prefix ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, service_prefix: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Prefijo de factura</Label>
                  <Input value={docsForm.invoice_prefix ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, invoice_prefix: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Prefijo de orden de compra</Label>
                  <Input value={docsForm.purchase_order_prefix ?? ""} onChange={(e) => setDocsForm(p => ({ ...p, purchase_order_prefix: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveDocs} disabled={updateSettings.isPending}>
                  {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== NOTIFICACIONES ===== */}
        <TabsContent value="notifications" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferencias de notificaciones</CardTitle>
              <CardDescription>Configura qué eventos generan alertas y a quién se envían</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Nuevo servicio recibido", desc: "Alerta al gestor del cluster correspondiente", icon: Wrench },
                { label: "SLA próximo a vencer", desc: "Aviso cuando quedan menos de 4h para el SLA", icon: Clock },
                { label: "Presupuesto aprobado / rechazado", desc: "Notificación al creador del presupuesto", icon: FileText },
                { label: "NPS inferior al estándar", desc: "Alerta al gestor cuando NPS < 7", icon: Bell },
                { label: "Nuevo comentario del colaborador", desc: "Notificación al equipo interno", icon: Mail },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <n.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Switch defaultChecked />
                      <span className="text-xs text-muted-foreground">Email</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch defaultChecked />
                      <span className="text-xs text-muted-foreground">Push</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== APARIENCIA ===== */}
        <TabsContent value="appearance" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Apariencia</CardTitle>
              <CardDescription>Personaliza el aspecto visual de la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select value={appearanceForm.theme ?? "system"} onValueChange={(v) => setAppearanceForm(p => ({ ...p, theme: v }))}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select value={appearanceForm.language ?? "es"} onValueChange={(v) => setAppearanceForm(p => ({ ...p, language: v }))}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zona horaria</Label>
                <Select value={appearanceForm.timezone ?? "europe_madrid"} onValueChange={(v) => setAppearanceForm(p => ({ ...p, timezone: v }))}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="europe_madrid">Europe/Madrid (CET)</SelectItem>
                    <SelectItem value="europe_london">Europe/London (GMT)</SelectItem>
                    <SelectItem value="america_mexico">America/Mexico City (CST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveAppearance} disabled={updateSettings.isPending}>
                  {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar preferencias
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PROTOCOLO ===== */}
        <TabsContent value="protocol" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Protocolo de Gestión</CardTitle>
              <CardDescription>Define los pasos que el gestor debe completar en cada servicio. Estos aparecerán como checklist en la pantalla de detalle del servicio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {protocolLoading ? (
                  [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)
                ) : (
                  <>
                    {protocolItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.enabled}
                            onCheckedChange={(checked) =>
                              updateStep.mutate({ id: item.id, enabled: !!checked })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteStep.mutate(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {showNewStep ? (
                      <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Nombre del paso *</Label>
                          <Input
                            value={newStepLabel}
                            onChange={(e) => setNewStepLabel(e.target.value)}
                            placeholder="Ej: Verificar garantía del equipo"
                            autoFocus
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Descripción</Label>
                          <Input
                            value={newStepDesc}
                            onChange={(e) => setNewStepDesc(e.target.value)}
                            placeholder="Ej: Comprobar si el equipo está en período de garantía"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowNewStep(false);
                              setNewStepLabel("");
                              setNewStepDesc("");
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            disabled={!newStepLabel.trim() || createStep.isPending}
                            onClick={() => {
                              const stepId = newStepLabel.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                              createStep.mutate(
                                {
                                  stepId,
                                  label: newStepLabel.trim(),
                                  description: newStepDesc.trim(),
                                  sortOrder: protocolItems.length,
                                },
                                {
                                  onSuccess: () => {
                                    setNewStepLabel("");
                                    setNewStepDesc("");
                                    setShowNewStep(false);
                                    toast.success("Paso añadido al protocolo");
                                  },
                                  onError: (e: any) => toast.error(e.message),
                                }
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
        </TabsContent>

        {/* ===== INDUSTRIALES ===== */}
        <TabsContent value="industrial" className="space-y-6 mt-4">
          <IndustrialConfigTab />
        </TabsContent>

        {/* ===== FISCAL ===== */}
        <TabsContent value="fiscal" className="space-y-6 mt-4">
          <TaxTypesConfigTab />
        </TabsContent>

        {/* ===== PLANES DE SUSCRIPCIÓN ===== */}
        <TabsContent value="plans" className="space-y-6 mt-4">
          <SubscriptionPlansTab />
        </TabsContent>

        {/* ===== IMPORTAR DATOS ===== */}
        <TabsContent value="import" className="space-y-6 mt-4">
          <BulkImportTab />
        </TabsContent>
      </Tabs>

      {/* New User Dialog */}
      <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={newUser.name} onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Nombre y apellidos" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="usuario@empresa.es" />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <div>
                        <p className="text-sm font-medium">{r.label}</p>
                        <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="colaborador">
                    <div>
                      <p className="text-sm font-medium">Colaborador</p>
                      <p className="text-[10px] text-muted-foreground">Acceso al portal de colaborador</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newUser.role === "colaborador" && (
              <div className="space-y-2">
                <Label>Colaborador vinculado</Label>
                <Select value={newUser.collaborator_id} onValueChange={(v) => setNewUser(p => ({ ...p, collaborator_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar colaborador..." /></SelectTrigger>
                  <SelectContent>
                    {(collaboratorsList ?? []).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">El usuario tendrá acceso al portal de este colaborador</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número" />
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, una mayúscula y un número</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewUser(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={createUser.isPending || !newUser.name || !newUser.email || newUser.password.length < 8 || (newUser.role === "colaborador" && !newUser.collaborator_id)}>
              {createUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(p => ({ ...p, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editingUser.email} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        <div>
                          <p className="text-sm font-medium">{r.label}</p>
                          <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="colaborador">
                      <div>
                        <p className="text-sm font-medium">Colaborador</p>
                        <p className="text-[10px] text-muted-foreground">Acceso al portal de colaborador</p>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editForm.role === "colaborador" && (
                <div className="space-y-2">
                  <Label>Colaborador vinculado</Label>
                  <Select value={editForm.collaborator_id} onValueChange={(v) => setEditForm(p => ({ ...p, collaborator_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar colaborador..." /></SelectTrigger>
                    <SelectContent>
                      {(collaboratorsList ?? []).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!editingUser) return;
                if (!confirm(`¿Eliminar permanentemente a ${editingUser.full_name || editingUser.email}? Esta acción no se puede deshacer.`)) return;
                manageUser.mutate({ userId: editingUser.id, action: "delete" }, {
                  onSuccess: () => setEditingUser(null),
                });
              }}
              disabled={manageUser.isPending}
            >
              {manageUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Eliminar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
              <Button
                disabled={!editForm.full_name}
                onClick={async () => {
                  if (!editingUser) return;
                  // Update profile name
                  const { error: profileErr } = await supabase
                    .from("profiles")
                    .update({ full_name: editForm.full_name })
                    .eq("id", editingUser.id);
                  if (profileErr) {
                    toast.error("Error al actualizar perfil");
                    return;
                  }
                  // Update role and collaborator_id
                  const roleChanged = editForm.role !== (editingUser.role ?? "");
                  const collabChanged = editForm.collaborator_id !== (editingUser.collaborator_id ?? "");
                  if (roleChanged || collabChanged) {
                    // Check if user already has a role entry
                    const { data: existing } = await supabase
                      .from("user_roles")
                      .select("id")
                      .eq("user_id", editingUser.id)
                      .limit(1);
                    const updateData: Record<string, unknown> = { role: editForm.role };
                    if (editForm.role === "colaborador") {
                      updateData.collaborator_id = editForm.collaborator_id || null;
                    } else {
                      updateData.collaborator_id = null;
                    }
                    if (existing && existing.length > 0) {
                      await supabase.from("user_roles").update(updateData as any).eq("user_id", editingUser.id);
                    } else {
                      await supabase.from("user_roles").insert({ user_id: editingUser.id, ...updateData } as any);
                    }
                  }
                  toast.success("Usuario actualizado");
                  setEditingUser(null);
                  queryClient.invalidateQueries({ queryKey: ["system_users"] });
                }}
              >
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPwUser} onOpenChange={(o) => !o && setResetPwUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Establece una nueva contraseña para <strong>{resetPwUser?.name || resetPwUser?.email}</strong>
          </p>
          <div className="space-y-2">
            <Label>Nueva contraseña</Label>
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-destructive">La contraseña debe tener al menos 8 caracteres</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwUser(null)}>Cancelar</Button>
            <Button
              disabled={newPassword.length < 8 || manageUser.isPending}
              onClick={() => {
                manageUser.mutate(
                  { userId: resetPwUser!.id, action: "reset_password", new_password: newPassword },
                  { onSuccess: () => setResetPwUser(null) }
                );
              }}
            >
              {manageUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizar contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
