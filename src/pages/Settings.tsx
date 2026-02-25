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
  Building2, Users, Shield, FileText, Bell, Palette, Mail,
  Plus, Trash2, Upload, Clock, Wrench, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCompanySettings, useUpdateCompanySettings } from "@/hooks/useCompanySettings";
import { useAppUsers, useCreateAppUser, useUpdateAppUser, useDeleteAppUser } from "@/hooks/useAppUsers";
import { Skeleton } from "@/components/ui/skeleton";

const roles = [
  { value: "admin", label: "Administrador", desc: "Acceso total al sistema" },
  { value: "gestor", label: "Gestor", desc: "Gestión de servicios, presupuestos y clientes" },
  { value: "operario", label: "Operario", desc: "Solo acceso a sus servicios asignados" },
  { value: "lectura", label: "Solo lectura", desc: "Visualización sin edición" },
];

export default function Settings() {
  const { data: settings, isLoading: settingsLoading } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const { data: users, isLoading: usersLoading } = useAppUsers();
  const createUser = useCreateAppUser();
  const updateUser = useUpdateAppUser();
  const deleteUser = useDeleteAppUser();

  // Company form state
  const [companyForm, setCompanyForm] = useState<Record<string, any>>({});
  const [operativeForm, setOperativeForm] = useState<Record<string, any>>({});
  const [docsForm, setDocsForm] = useState<Record<string, any>>({});
  const [appearanceForm, setAppearanceForm] = useState<Record<string, any>>({});

  // New user dialog
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "operario" });

  // Protocol state
  const [protocolItems, setProtocolItems] = useState([
    { label: "Contacto con cliente (SLA 12h)", description: "Primer contacto telefónico o por email dentro del SLA establecido", enabled: true },
    { label: "Diagnóstico multimedia", description: "Recibir fotos o vídeos del problema reportado", enabled: true },
    { label: "Técnico asignado (por cluster y especialidad)", description: "Asignar un técnico del cluster correcto con la especialidad adecuada", enabled: true },
    { label: "Material preparado", description: "Confirmar que los materiales necesarios están disponibles", enabled: true },
    { label: "Presupuesto gestionado", description: "Solo para servicios con presupuesto: enviar y obtener aprobación", enabled: true },
    { label: "NPS recogido", description: "Recoger la encuesta de satisfacción al finalizar", enabled: true },
  ]);
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
        legal_conditions: settings.legal_conditions,
        document_footer: settings.document_footer,
        service_prefix: settings.service_prefix,
        invoice_prefix: settings.invoice_prefix,
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
    if (!newUser.name || !newUser.email) return;
    createUser.mutate(newUser, {
      onSuccess: () => {
        setShowNewUser(false);
        setNewUser({ name: "", email: "", role: "operario" });
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

              <div className="space-y-2">
                <Label>Logotipo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm"><Upload className="w-3.5 h-3.5 mr-1.5" /> Subir logo</Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG o SVG, máximo 2 MB</p>
                  </div>
                </div>
              </div>

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
                <CardTitle className="text-base">Usuarios del sistema</CardTitle>
                <CardDescription>Gestiona quién puede acceder a la plataforma</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowNewUser(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Añadir usuario
              </Button>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {(users ?? []).map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">{u.name.split(" ").map(n => n[0]).join("")}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full border",
                          u.role === "admin" ? "bg-primary/10 text-primary border-primary/20" :
                          u.role === "gestor" ? "bg-info/10 text-info border-info/20" :
                          "bg-muted text-muted-foreground border-border"
                        )}>
                          {roles.find(r => r.value === u.role)?.label ?? u.role}
                        </span>
                        <Switch
                          checked={u.active}
                          onCheckedChange={(checked) => updateUser.mutate({ id: u.id, active: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteUser.mutate(u.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
                <Label>Condiciones legales</Label>
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
                {protocolItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.enabled}
                        onCheckedChange={(checked) =>
                          setProtocolItems((prev) =>
                            prev.map((p, idx) => idx === i ? { ...p, enabled: checked } : p)
                          )
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setProtocolItems((prev) => prev.filter((_, idx) => idx !== i))}
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
                        disabled={!newStepLabel.trim()}
                        onClick={() => {
                          setProtocolItems((prev) => [
                            ...prev,
                            { label: newStepLabel.trim(), description: newStepDesc.trim(), enabled: true },
                          ]);
                          setNewStepLabel("");
                          setNewStepDesc("");
                          setShowNewStep(false);
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

                <p className="text-xs text-muted-foreground">Los cambios se aplicarán a todos los servicios nuevos. Los servicios existentes mantendrán su protocolo actual.</p>
              </div>
            </CardContent>
          </Card>
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
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewUser(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={createUser.isPending || !newUser.name || !newUser.email}>
              {createUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
