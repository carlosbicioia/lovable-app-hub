import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Building2, Users, Shield, FileText, Bell, Palette, Mail, Globe,
  Plus, Trash2, Upload, Clock, Wrench,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/* ---------- mock data ---------- */
const mockUsers = [
  { id: "U1", name: "Carlos García", email: "carlos@urbango.es", role: "admin", active: true },
  { id: "U2", name: "María López", email: "maria@urbango.es", role: "gestor", active: true },
  { id: "U3", name: "Pedro Ruiz", email: "pedro@urbango.es", role: "operario", active: false },
];

const roles = [
  { value: "admin", label: "Administrador", desc: "Acceso total al sistema" },
  { value: "gestor", label: "Gestor", desc: "Gestión de servicios, presupuestos y clientes" },
  { value: "operario", label: "Operario", desc: "Solo acceso a sus servicios asignados" },
  { value: "lectura", label: "Solo lectura", desc: "Visualización sin edición" },
];

export default function Settings() {
  const [users] = useState(mockUsers);

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
                  <Input defaultValue="UrbanGO Facility Services S.L." />
                </div>
                <div className="space-y-2">
                  <Label>CIF / NIF</Label>
                  <Input defaultValue="B12345678" />
                </div>
                <div className="space-y-2">
                  <Label>Dirección fiscal</Label>
                  <Input defaultValue="Calle Gran Vía 42, 28013 Madrid" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input defaultValue="+34 911 234 567" />
                </div>
                <div className="space-y-2">
                  <Label>Email de contacto</Label>
                  <Input type="email" defaultValue="admin@urbango.es" />
                </div>
                <div className="space-y-2">
                  <Label>Sitio web</Label>
                  <Input defaultValue="https://urbango.es" />
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
                <Button>Guardar cambios</Button>
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
                  <Input type="number" defaultValue="12" />
                </div>
                <div className="space-y-2">
                  <Label>SLA resolución (horas)</Label>
                  <Input type="number" defaultValue="72" />
                </div>
                <div className="space-y-2">
                  <Label>IVA por defecto (%)</Label>
                  <Input type="number" defaultValue="21" />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select defaultValue="EUR">
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
                <Button>Guardar cambios</Button>
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
              <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" /> Añadir usuario</Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {users.map((u) => (
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
                      <Switch checked={u.active} />
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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

        {/* ===== DOCUMENTOS / PRESUPUESTOS ===== */}
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
                  <Input defaultValue="PRE-" />
                </div>
                <div className="space-y-2">
                  <Label>Siguiente número</Label>
                  <Input type="number" defaultValue="1042" />
                </div>
                <div className="space-y-2">
                  <Label>Validez por defecto (días)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>Formato de fecha</Label>
                  <Select defaultValue="dd/MM/yyyy">
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
                <Textarea
                  rows={4}
                  defaultValue="Este presupuesto tiene una validez de 30 días naturales desde la fecha de emisión. Los precios indicados no incluyen IVA salvo indicación expresa. Los trabajos se realizarán según la normativa vigente."
                />
              </div>

              <div className="space-y-2">
                <Label>Nota al pie del documento</Label>
                <Textarea
                  rows={2}
                  defaultValue="UrbanGO Facility Services S.L. — CIF B12345678 — admin@urbango.es"
                />
              </div>

              <div className="flex justify-end">
                <Button>Guardar plantilla</Button>
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
                  <Input defaultValue="SRV-" />
                </div>
                <div className="space-y-2">
                  <Label>Prefijo de factura</Label>
                  <Input defaultValue="FAC-" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Guardar</Button>
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
                <Select defaultValue="system">
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
                <Select defaultValue="es">
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
                <Select defaultValue="europe_madrid">
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="europe_madrid">Europe/Madrid (CET)</SelectItem>
                    <SelectItem value="europe_london">Europe/London (GMT)</SelectItem>
                    <SelectItem value="america_mexico">America/Mexico City (CST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button>Guardar preferencias</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
