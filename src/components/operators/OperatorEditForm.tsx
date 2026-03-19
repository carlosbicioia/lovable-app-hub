import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, Camera, X, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSpecialties, useCertifications } from "@/hooks/useIndustrialConfig";
import { useBranches } from "@/hooks/useBranches";
import { useArticles } from "@/hooks/useArticles";
import { useVehicles } from "@/hooks/useVehicles";
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
  const { data: articlesData = [] } = useArticles();
  const { data: dbCertifications } = useCertifications();
  const { data: branches = [] } = useBranches();
  const { data: vehicles = [] } = useVehicles();
  const activeBranches = branches.filter((b) => b.active);
  const activeSpecs = (dbSpecialties ?? []).filter((s) => s.active);
  const activeCerts = (dbCertifications ?? []).filter((c) => c.active);
  const moArticles = articlesData.filter((a) => a.category === "Mano_de_Obra");

  // Find current vehicle assigned to this operator
  const assignedVehicle = vehicles.find((v) => v.operatorId === operator.id);

  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    // Personal
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
    hire_date: operator.hireDate ?? "",
    // Professional
    operator_type: operator.operatorType ?? "Plantilla",
    status: operator.status as string,
    available: operator.available,
    specialty: operator.specialty,
    secondary_specialty: operator.secondarySpecialty ?? "",
    cluster_ids: operator.clusterIds.join(", "),
    branch_id: operator.branchId ?? "",
    color: operator.color,
    certifications: operator.certifications,
    // Vehicle
    vehicle_id: assignedVehicle?.id ?? "",
    // Pricing - Cost
    cost_article_standard_hour_id: operator.costArticleStandardHourId ?? "",
    cost_article_app_hour_id: operator.costArticleAppHourId ?? "",
    cost_article_urgency_hour_id: operator.costArticleUrgencyHourId ?? "",
    // Pricing - Sale
    article_standard_hour_id: operator.articleStandardHourId ?? "",
    article_app_hour_id: operator.articleAppHourId ?? "",
    article_urgency_hour_id: operator.articleUrgencyHourId ?? "",
    // Urgency pricing - Cost
    cost_article_salida_id: operator.costArticleSalidaId ?? "",
    cost_article_dia_guardia_id: operator.costArticleDiaGuardiaId ?? "",
    cost_article_hora_guardia_id: operator.costArticleHoraGuardiaId ?? "",
    // Urgency pricing - Sale
    article_salida_id: operator.articleSalidaId ?? "",
    article_dia_guardia_id: operator.articleDiaGuardiaId ?? "",
    article_hora_guardia_id: operator.articleHoraGuardiaId ?? "",
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

      // Update operator
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
          street_number: form.street_number?.trim() ?? "",
          floor: form.floor?.trim() ?? "",
          address_extra: form.address_extra?.trim() ?? "",
          city: form.city.trim(),
          province: form.province.trim(),
          specialty: form.specialty,
          secondary_specialty: form.secondary_specialty || null,
          status: form.status,
          available: form.available,
          hire_date: form.hire_date || null,
          color: form.color,
          cluster_id: clusterIds[0] ?? "",
          cluster_ids: clusterIds,
          certifications: form.certifications,
          photo: photoUrl,
          branch_id: form.branch_id || null,
          operator_type: form.operator_type,
          vehicle_plate: form.vehicle_id ? (vehicles.find(v => v.id === form.vehicle_id)?.plate ?? null) : null,
          article_standard_hour_id: form.article_standard_hour_id || null,
          article_app_hour_id: form.article_app_hour_id || null,
          article_urgency_hour_id: form.article_urgency_hour_id || null,
           cost_article_standard_hour_id: form.cost_article_standard_hour_id || null,
          cost_article_app_hour_id: form.cost_article_app_hour_id || null,
          cost_article_urgency_hour_id: form.cost_article_urgency_hour_id || null,
          cost_article_salida_id: form.cost_article_salida_id || null,
          cost_article_dia_guardia_id: form.cost_article_dia_guardia_id || null,
          cost_article_hora_guardia_id: form.cost_article_hora_guardia_id || null,
          article_salida_id: form.article_salida_id || null,
          article_dia_guardia_id: form.article_dia_guardia_id || null,
          article_hora_guardia_id: form.article_hora_guardia_id || null,
        })
        .eq("id", operator.id);

      if (error) throw error;

      // Update vehicle assignment
      // First, unassign any vehicle previously assigned to this operator
      if (assignedVehicle && assignedVehicle.id !== form.vehicle_id) {
        await supabase.from("vehicles").update({ operator_id: null }).eq("id", assignedVehicle.id);
      }
      // Then assign the new vehicle
      if (form.vehicle_id && form.vehicle_id !== assignedVehicle?.id) {
        // Unassign from previous operator if needed
        await supabase.from("vehicles").update({ operator_id: null }).eq("operator_id", operator.id);
        await supabase.from("vehicles").update({ operator_id: operator.id }).eq("id", form.vehicle_id);
      }
      // If cleared, unassign
      if (!form.vehicle_id && assignedVehicle) {
        await supabase.from("vehicles").update({ operator_id: null }).eq("id", assignedVehicle.id);
      }

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["operators"] }),
        qc.invalidateQueries({ queryKey: ["vehicles"] }),
      ]);
      toast.success("Operario actualizado");
      onSaved();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const currentPhoto = photoPreview ?? operator.photo;

  // Available vehicles: unassigned or currently assigned to this operator
  const availableVehicles = vehicles.filter(
    (v) => !v.operatorId || v.operatorId === operator.id
  );

  const getSalePrice = (article: any) => {
    if (article.hasKnownPvp && article.pvp !== null) return article.pvp;
    return article.costPrice * (1 + (article.margin ?? 0) / 100);
  };

  return (
    <div className="space-y-4">
      {/* ROW 1: Personal + Professional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── DATOS PERSONALES ── */}
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
              <Label className="text-xs">Calle</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Número</Label>
                <Input value={form.street_number} onChange={(e) => set("street_number", e.target.value)} className="h-8 text-sm" placeholder="Nº" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Piso</Label>
                <Input value={form.floor} onChange={(e) => set("floor", e.target.value)} className="h-8 text-sm" placeholder="1ºA" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Adicional</Label>
                <Input value={form.address_extra} onChange={(e) => set("address_extra", e.target.value)} className="h-8 text-sm" placeholder="Esc..." />
              </div>
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

        {/* ── DATOS PROFESIONALES ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Datos profesionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de operario</Label>
                <Select value={form.operator_type} onValueChange={(v) => set("operator_type", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plantilla">Plantilla</SelectItem>
                    <SelectItem value="Subcontratado">Subcontratado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.available}
                onCheckedChange={(v) => set("available", !!v)}
                id="available"
              />
              <Label htmlFor="available" className="text-xs cursor-pointer">Disponible para asignación</Label>
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

            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-xs">Color identificativo</Label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-border shrink-0" style={{ backgroundColor: `hsl(${form.color})` }} />
                  <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="210 80% 52%" className="h-8 text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Clústeres (separados por coma)</Label>
              <Input value={form.cluster_ids} onChange={(e) => set("cluster_ids", e.target.value)} placeholder="CLU-01, CLU-02" className="h-8 text-sm" />
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

      {/* ROW 2: Vehicle + Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── VEHÍCULO ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Car className="w-4 h-4" /> Vehículo asignado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Vehículo</Label>
              <Select value={form.vehicle_id || "none"} onValueChange={(v) => set("vehicle_id", v === "none" ? "" : v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sin vehículo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vehículo</SelectItem>
                  {availableVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate} — {v.brand} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.vehicle_id && (() => {
              const v = vehicles.find((vh) => vh.id === form.vehicle_id);
              if (!v) return null;
              return (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Matrícula</span>
                    <span className="font-medium">{v.plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">Marca / Modelo</span>
                    <span className="font-medium">{v.brand} {v.model}</span>
                  </div>
                  {v.fuelType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Combustible</span>
                      <span className="font-medium">{v.fuelType}</span>
                    </div>
                  )}
                  {v.mileage > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Kilometraje</span>
                      <span className="font-medium">{v.mileage.toLocaleString()} km</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* ── PRECIOS DE COSTE ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Precios de coste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              { key: "cost_article_standard_hour_id", label: "Hora estándar" },
              { key: "cost_article_app_hour_id", label: "Hora APP" },
              { key: "cost_article_urgency_hour_id", label: "Hora urgencia" },
            ] as const).map(({ key, label }) => {
              const selected = articlesData.find((a) => a.id === (form as any)[key]);
              return (
                <div key={key} className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{label}</Label>
                  <Select value={(form as any)[key] || "none"} onValueChange={(v) => set(key, v === "none" ? "" : v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {moArticles.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.title} — €{a.costPrice.toFixed(2)}/h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selected && (
                    <p className="text-[10px] text-muted-foreground">Coste: €{selected.costPrice.toFixed(2)}/h</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ── PRECIOS DE VENTA ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Precios de venta (PVP)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              { key: "article_standard_hour_id", label: "Hora estándar" },
              { key: "article_app_hour_id", label: "Hora APP" },
              { key: "article_urgency_hour_id", label: "Hora urgencia" },
            ] as const).map(({ key, label }) => {
              const selected = articlesData.find((a) => a.id === (form as any)[key]);
              const sp = selected ? getSalePrice(selected) : null;
              return (
                <div key={key} className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{label}</Label>
                  <Select value={(form as any)[key] || "none"} onValueChange={(v) => set(key, v === "none" ? "" : v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {moArticles.map((a) => {
                        const price = getSalePrice(a);
                        return (
                          <SelectItem key={a.id} value={a.id}>
                            {a.title} — €{price.toFixed(2)}/h
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selected && sp !== null && (
                    <p className="text-[10px] text-muted-foreground">PVP: €{sp.toFixed(2)}/h</p>
                  )}
      </div>

      {/* ROW 3: Urgency Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── PRECIOS URGENCIAS - COSTE ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Precios urgencias — Coste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              { key: "cost_article_salida_id", label: "Precio salida" },
              { key: "cost_article_dia_guardia_id", label: "Precio día guardia" },
              { key: "cost_article_hora_guardia_id", label: "Precio hora guardia" },
            ] as const).map(({ key, label }) => {
              const selected = articlesData.find((a) => a.id === (form as any)[key]);
              return (
                <div key={key} className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{label}</Label>
                  <Select value={(form as any)[key] || "none"} onValueChange={(v) => set(key, v === "none" ? "" : v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {moArticles.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.title} — €{a.costPrice.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selected && (
                    <p className="text-[10px] text-muted-foreground">Coste: €{selected.costPrice.toFixed(2)}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ── PRECIOS URGENCIAS - VENTA ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Precios urgencias — Venta (PVP)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              { key: "article_salida_id", label: "Precio salida" },
              { key: "article_dia_guardia_id", label: "Precio día guardia" },
              { key: "article_hora_guardia_id", label: "Precio hora guardia" },
            ] as const).map(({ key, label }) => {
              const selected = articlesData.find((a) => a.id === (form as any)[key]);
              const sp = selected ? getSalePrice(selected) : null;
              return (
                <div key={key} className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{label}</Label>
                  <Select value={(form as any)[key] || "none"} onValueChange={(v) => set(key, v === "none" ? "" : v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {moArticles.map((a) => {
                        const price = getSalePrice(a);
                        return (
                          <SelectItem key={a.id} value={a.id}>
                            {a.title} — €{price.toFixed(2)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selected && sp !== null && (
                    <p className="text-[10px] text-muted-foreground">PVP: €{sp.toFixed(2)}</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
              );
            })}
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
