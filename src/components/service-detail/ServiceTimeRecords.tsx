import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2, Loader2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ServiceTimeRecordsProps {
  serviceId: string;
  readOnly?: boolean;
}

// Convert decimal hours to HH:MM string
function hoursToHHMM(h: number): string {
  const totalMinutes = Math.round(h * 60);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Calculate billable hours from start/end time
// Rule: minimum 1 hour, then 30-min increments from 2nd hour onward
function calculateBillableHours(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return null;
  let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMinutes <= 0) return null;
  // Minimum 1 hour
  if (diffMinutes <= 60) return 1;
  // After first hour, round up to nearest 30 min
  const extraMinutes = diffMinutes - 60;
  const extraBlocks = Math.ceil(extraMinutes / 30);
  return 1 + extraBlocks * 0.5;
}

export default function ServiceTimeRecords({ serviceId, readOnly }: ServiceTimeRecordsProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [operatorId, setOperatorId] = useState("");
  const [recordDate, setRecordDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOperatorId, setEditOperatorId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Fetch time records for this service
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["service_time_records", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_records" as any)
        .select("*")
        .eq("service_id", serviceId)
        .order("record_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Fetch operators assigned to this service
  const { data: serviceOperators = [] } = useQuery({
    queryKey: ["service_operators_for_hours", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_operators")
        .select("operator_id, operator_name")
        .eq("service_id", serviceId);
      if (error) throw error;
      return data ?? [];
    },
  });

  // All operators as fallback
  const { data: allOperators = [] } = useQuery({
    queryKey: ["all_operators_for_hours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operators")
        .select("id, name")
        .eq("status", "Activo")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const operatorOptions = serviceOperators.length > 0
    ? serviceOperators.map((o) => ({ id: o.operator_id, name: o.operator_name }))
    : allOperators.map((o) => ({ id: o.id, name: o.name }));

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["service_time_records", serviceId] });
    queryClient.invalidateQueries({ queryKey: ["service_total_hours", serviceId] });
  };

  const calculatedHours = calculateBillableHours(startTime, endTime);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!calculatedHours || calculatedHours <= 0) throw new Error("Hora de inicio/fin inválidas");
      const { error } = await supabase.from("time_records" as any).insert({
        operator_id: operatorId,
        service_id: serviceId,
        record_date: recordDate,
        hours: calculatedHours,
        start_time: startTime,
        end_time: endTime,
        location: location || "",
        notes: notes || null,
        source: "backoffice",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("Registro de horas añadido");
      setShowForm(false);
      setOperatorId("");
      setStartTime("09:00");
      setEndTime("10:00");
      setLocation("");
      setNotes("");
    },
    onError: (err: any) => toast.error(err.message || "Error al registrar horas"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("time_records" as any).update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("Registro actualizado");
      setEditingId(null);
    },
    onError: (err: any) => toast.error(err.message || "Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_records" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("Registro eliminado");
    },
    onError: (err: any) => toast.error(err.message || "Error al eliminar"),
  });

  const totalHours = records.reduce((sum: number, r: any) => sum + Number(r.hours), 0);

  const getOperatorName = (opId: string) => {
    const fromService = serviceOperators.find((o) => o.operator_id === opId);
    if (fromService) return fromService.operator_name;
    const fromAll = allOperators.find((o) => o.id === opId);
    return fromAll?.name || opId;
  };

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setEditOperatorId(r.operator_id);
    setEditDate(r.record_date);
    setEditStartTime(r.start_time || "");
    setEditEndTime(r.end_time || "");
    setEditLocation(r.location || "");
    setEditNotes(r.notes || "");
  };

  const editCalculatedHours = calculateBillableHours(editStartTime, editEndTime);

  const saveEdit = () => {
    if (!editCalculatedHours || editCalculatedHours <= 0) {
      toast.error("Hora de inicio/fin inválidas");
      return;
    }
    updateMutation.mutate({
      id: editingId!,
      data: {
        operator_id: editOperatorId,
        record_date: editDate,
        hours: editCalculatedHours,
        start_time: editStartTime,
        end_time: editEndTime,
        location: editLocation,
        notes: editNotes || null,
      } as any,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" /> Registro de horas
            {records.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                {hoursToHHMM(totalHours)}
              </span>
            )}
          </CardTitle>
          {!readOnly && !showForm && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="w-3 h-3 mr-1" /> Registrar horas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form */}
        {showForm && (
          <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Operario</Label>
                <Select value={operatorId} onValueChange={setOperatorId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorOptions.map((op) => (
                      <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fecha</Label>
                <Input type="date" className="h-9 text-sm" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hora inicio</Label>
                <Input type="time" className="h-9 text-sm" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hora fin</Label>
                <Input type="time" className="h-9 text-sm" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Horas facturables</Label>
                <div className="h-9 flex items-center text-sm font-semibold font-mono px-3 bg-muted rounded-md">
                  {calculatedHours ? hoursToHHMM(calculatedHours) : "—"}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ubicación</Label>
                <Input className="h-9 text-sm" placeholder="Ej: Taller, domicilio..." value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notas (opcional)</Label>
              <Input className="h-9 text-sm" placeholder="Detalles del trabajo realizado..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={!operatorId || !calculatedHours || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay horas registradas para este servicio
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Fecha</TableHead>
                <TableHead className="text-xs">Operario</TableHead>
                <TableHead className="text-xs">Inicio</TableHead>
                <TableHead className="text-xs">Fin</TableHead>
                <TableHead className="text-xs text-right">Horas</TableHead>
                <TableHead className="text-xs">Ubicación</TableHead>
                <TableHead className="text-xs">Notas</TableHead>
                {!readOnly && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                editingId === r.id ? (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Input type="date" className="h-7 text-xs w-32" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Select value={editOperatorId} onValueChange={setEditOperatorId}>
                        <SelectTrigger className="h-7 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorOptions.map((op) => (
                            <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input className="h-7 text-xs w-16 text-right" value={editHours} onChange={(e) => setEditHours(e.target.value)} placeholder="HH:MM" />
                    </TableCell>
                    <TableCell>
                      <Input className="h-7 text-xs w-28" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-7 text-xs w-36" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="w-6 h-6 text-primary" onClick={saveEdit} disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground" onClick={() => setEditingId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">
                      {format(new Date(r.record_date), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{getOperatorName(r.operator_id)}</TableCell>
                    <TableCell className="text-xs text-right font-semibold font-mono">{hoursToHHMM(Number(r.hours))}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.location || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.notes || "—"}</TableCell>
                    {!readOnly && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-muted-foreground hover:text-primary"
                            onClick={() => startEdit(r)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteMutation.mutate(r.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              ))}
              {/* Total row */}
              <TableRow className="bg-muted/30">
                <TableCell className="text-xs font-semibold">Total</TableCell>
                <TableCell />
                <TableCell className="text-xs text-right font-bold font-mono">{hoursToHHMM(totalHours)}</TableCell>
                <TableCell />
                <TableCell />
                {!readOnly && <TableCell />}
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
