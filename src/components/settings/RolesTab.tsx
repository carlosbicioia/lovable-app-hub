import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { roles } from "./settingsConstants";

export default function RolesTab() {
  return (
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
              {role.value !== "admin" && <Button variant="outline" size="sm">Editar permisos</Button>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["Dashboard", "Dashboard Avanzado", "Informes", "Informes Avanzados", "Servicios", "Presupuestos", "Clientes", "Artículos", "Operarios", "Colaboradores", "Compras", "Configuración"].map((mod) => {
                const isChecked = role.value === "admin" ? true
                  : role.value === "gestor" ? !["Configuración"].includes(mod)
                  : role.value === "colaborador" ? ["Servicios"].includes(mod)
                  : role.value === "operario" ? ["Dashboard", "Servicios"].includes(mod)
                  : role.value === "lectura" ? ["Dashboard", "Servicios", "Presupuestos", "Clientes"].includes(mod)
                  : role.value === "pantalla" ? ["Dashboard"].includes(mod)
                  : false;
                return (
                  <div key={mod} className="flex items-center gap-2">
                    <Switch defaultChecked={isChecked} disabled={role.value === "admin"} />
                    <span className="text-xs text-card-foreground">{mod}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
