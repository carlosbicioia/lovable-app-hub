import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, Camera, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSpecialties, useCertifications } from "@/hooks/useIndustrialConfig";
import { useBranches } from "@/hooks/useBranches";
import type { DbOperator } from "@/hooks/useOperators";
import type { OperatorStatus } from "@/types/urbango";

interface Props {
  operator: DbOperator;
  onSaved: () => void;
}

export default function OperatorEditForm({ operator, onSaved }: Props) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: dbSpecialties } = useSpecialties();
  const { data: dbCertifications } = useCertifications();
  const { data: branches = [] } = useBranches();
  const activeBranches = branches.filter((b) => b.active);
  const activeSpecs = (dbSpecialties ?? []).filter((s) => s.active);
  const activeCerts = (dbCertifications ?? []).filter((c) => c.active);

  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Form state
  const [form, setForm] = useState({
    first_name: operator.firstName,
    last_name: operator.lastName,
    dni: operator.dni,
    email: operator.email,
    phone: operator.phone,
    address: operator.address,
    street_number: operator.streetNumber,
    floor: operator.floor,
    address_extra: operator.addressExtra,
    city: operator.city,
    province: operator.province,
    specialty: operator.specialty,
    secondary_specialty: operator.secondarySpecialty ?? "",
    status: operator.status as string,
    available: operator.available,
    vehicle_plate: operator.vehiclePlate ?? "",
    hire_date: operator.hireDate ?? "",
    color: operator.color,
    cluster_id: operator.clusterId,
    cluster_ids: operator.clusterIds.join(", "),
    certifications: operator.certifications,
    branch_id: operator.branchId ?? "",
  });

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const toggleCert = (certName: string) => {
    setForm((f) => ({
      ...f,
      certifications: f.certifications.includes(certName)
        ? f.certifications.filter((c) => c !== certName)
        : [...f.certifications, certName],
    }));
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Nombre y apellido son obligatorios");
      return;
    }

    setSaving(true);
    try {
      let photoUrl = operator.photo;

      // Upload photo if changed
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `operators/${operator.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, photoFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }

      const clusterIds = form.cluster_ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from("operators")
        .update({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          name: `${form.first_name.trim()} ${form.last_name.trim()}`,
          dni: form.dni.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          province: form.province.trim(),
          specialty: form.specialty,
          secondary_specialty: form.secondary_specialty || null,
          status: form.status,
          available: form.available,
          vehicle_plate: form.vehicle_plate.trim() || null,
          hire_date: form.hire_date || null,
          color: form.color,
          cluster_id: clusterIds[0] ?? form.cluster_id,
          cluster_ids: clusterIds,
          certifications: form.certifications,
          photo: photoUrl,
          branch_id: form.branch_id || null,
        })
        .eq("id", operator.id);

      if (error) throw error;

      await qc.invalidateQueries({ queryKey: ["operators"] });
      toast.success("Operario actualizado");
      onSaved();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const currentPhoto = photoPreview ?? operator.photo;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Photo + personal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={currentPhoto}
                  alt={operator.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Haz clic para cambiar la foto</p>
                <p>JPG, PNG. Máx 5MB</p>
                {photoPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs mt-1 h-6 px-2 text-destructive"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  >
                    <X className="w-3 h-3 mr-1" /> Deshacer
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Apellido *</Label>
                <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">DNI / NIE</Label>
                <Input value={form.dni} onChange={(e) => set("dni", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha de alta</Label>
                <Input type="date" value={form.hire_date} onChange={(e) => set("hire_date", e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input value={form.email} onChange={(e) => set("email", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Dirección</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} className="h-8 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Ciudad</Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Provincia</Label>
                <Input value={form.province} onChange={(e) => set("province", e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Datos profesionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Estado</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                    <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                    <SelectItem value="Baja">Baja médica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 flex items-end gap-2 pb-0.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.available}
                    onCheckedChange={(v) => set("available", !!v)}
                    id="available"
                  />
                  <Label htmlFor="available" className="text-xs cursor-pointer">Disponible</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Especialidad principal</Label>
                <Select value={form.specialty} onValueChange={(v) => set("specialty", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {activeSpecs.map((s) => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Especialidad secundaria</Label>
                <Select value={form.secondary_specialty || "none"} onValueChange={(v) => set("secondary_specialty", v === "none" ? "" : v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {activeSpecs.map((s) => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Matrícula vehículo</Label>
              <Input value={form.vehicle_plate} onChange={(e) => set("vehicle_plate", e.target.value)} placeholder="0000 XXX" className="h-8 text-sm" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Clústeres (separados por coma)</Label>
              <Input value={form.cluster_ids} onChange={(e) => set("cluster_ids", e.target.value)} placeholder="CLU-01, CLU-02" className="h-8 text-sm" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Sede</Label>
              <Select value={form.branch_id || "none"} onValueChange={(v) => set("branch_id", v === "none" ? "" : v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sede</SelectItem>
                  {activeBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Color identificativo (HSL)</Label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg border border-border" style={{ backgroundColor: `hsl(${form.color})` }} />
                <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="210 80% 52%" className="h-8 text-sm flex-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Certificaciones</Label>
              <div className="flex flex-wrap gap-1.5">
                {activeCerts.map((cert) => {
                  const active = form.certifications.includes(cert.name);
                  return (
                    <Badge
                      key={cert.id}
                      variant={active ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleCert(cert.name)}
                    >
                      {active ? "✓ " : ""}{cert.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
