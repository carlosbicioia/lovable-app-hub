import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCompanySettings, useUpdateCompanySettings } from "@/hooks/useCompanySettings";

export default function AppearanceTab() {
  const { data: settings } = useCompanySettings();
  const updateSettings = useUpdateCompanySettings();
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (settings) {
      setForm({ theme: settings.theme, language: settings.language, timezone: settings.timezone });
    }
  }, [settings]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Apariencia</CardTitle>
        <CardDescription>Personaliza el aspecto visual de la plataforma</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tema</Label>
          <Select value={form.theme ?? "system"} onValueChange={(v) => setForm(p => ({ ...p, theme: v }))}>
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
          <Select value={form.language ?? "es"} onValueChange={(v) => setForm(p => ({ ...p, language: v }))}>
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
          <Select value={form.timezone ?? "europe_madrid"} onValueChange={(v) => setForm(p => ({ ...p, timezone: v }))}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="europe_madrid">Europe/Madrid (CET)</SelectItem>
              <SelectItem value="europe_london">Europe/London (GMT)</SelectItem>
              <SelectItem value="america_mexico">America/Mexico City (CST)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => updateSettings.mutate(form)} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar preferencias
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
