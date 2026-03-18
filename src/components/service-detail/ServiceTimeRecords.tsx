import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ServiceTimeRecordsProps {
  serviceId: string;
  readOnly?: boolean;
}

interface TimeRecordRow {
  id: string;
  operator_id: string;
  operator_name: string;
  record_date: string;
  hours: number;
  location: string;
  notes: string | null;
  source: string;
  created_at: string;
}

export default function ServiceTimeRecords({ serviceId, readOnly }: ServiceTimeRecordsProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [operatorId, setOperatorId] = useState("");
  const [recordDate, setRecordDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hours, setHours] = useState("1");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("time_records" as any).insert({
        operator_id: operatorId,
        service_id: serviceId,
        record_date: recordDate,
        hours: parseFloat(hours),
        location: location || "",
        notes: notes || null,
        source: "backoffice",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_time_records", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["service_total_hours", serviceId] });
      toast.success("Registro de horas añadido");
      setShowForm(false);
      setOperatorId("");
      setHours("1");
      setLocation("");
      setNotes("");
    },
    onError: (err: any) => toast.error(err.message || "Error al registrar horas"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_records" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_time_records", serviceId] });
      queryClient.invalidateQueries({ queryKey: ["service_total_hours", serviceId] });
      toast.success("Registro eliminado");
    },
    onError: (err: any) => toast.error(err.message || "Error al eliminar"),
  });

  const totalHours = records.reduce((sum: number, r: any) => sum + Number(r.hours), 0);

  // Map operator_id to name
  const getOperatorName = (opId: string) => {
    const fromService = serviceOperators.find((o) => o.operator_id === opId);
    if (fromService) return fromService.operator_name;
    const fromAll = allOperators.find((o) => o.id === opId);
    return fromAll?.name || opId;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" /> Registro de horas
            {records.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                {totalHours.toFixed(1)}h
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
                <Label className="text-xs">Horas</Label>
                <Input type="number" step="0.5" min="0.5" className="h-9 text-sm" value={hours} onChange={(e) => setHours(e.target.value)} />
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
                disabled={!operatorId || !hours || createMutation.isPending}
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
                <TableHead className="text-xs text-right">Horas</TableHead>
                <TableHead className="text-xs">Ubicación</TableHead>
                <TableHead className="text-xs">Notas</TableHead>
                {!readOnly && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">
                    {format(new Date(r.record_date), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell className="text-xs font-medium">{getOperatorName(r.operator_id)}</TableCell>
                  <TableCell className="text-xs text-right font-semibold">{Number(r.hours).toFixed(1)}h</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.location || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.notes || "—"}</TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(r.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {/* Total row */}
              <TableRow className="bg-muted/30">
                <TableCell className="text-xs font-semibold">Total</TableCell>
                <TableCell />
                <TableCell className="text-xs text-right font-bold">{totalHours.toFixed(1)}h</TableCell>
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
