"use client";

import { useState, useMemo, useCallback } from "react";
import { format, startOfWeek, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Droplets, Plus, PlayCircle, AlertTriangle, Globe, Building2, MapPin, ChevronDown, X } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import type { Specialty, ServiceStatus, ServiceOrigin, UrgencyLevel } from "@/types/urbango";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOperators } from "@/hooks/useOperators";
import { useServices } from "@/hooks/useServices";
import { useCollaborators } from "@/hooks/useCollaborators";
import { useBranches } from "@/hooks/useBranches";
import { type ViewMode, specialtyIcon, specialtyColor, setOperatorsCache } from "@/components/calendar/calendarUtils";
import DayView from "@/components/calendar/DayView";
import WeekView from "@/components/calendar/WeekView";
import MonthView from "@/components/calendar/MonthView";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("week");
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ServiceStatus | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<ServiceOrigin | null>(null);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const { services, refetch } = useServices();
  const { data: allOps = [] } = useOperators();
  const { collaborators } = useCollaborators();
  const { data: branches = [] } = useBranches();
  setOperatorsCache(allOps);
  const { toast } = useToast();
  const router = useRouter();

  const hasAnyFilter = !!(selectedOperatorId || selectedSpecialty || selectedStatus || selectedUrgency || selectedOrigin || selectedCollaboratorId || selectedBranchId);
  const clearAllFilters = () => { setSelectedOperatorId(null); setSelectedSpecialty(null); setSelectedStatus(null); setSelectedUrgency(null); setSelectedOrigin(null); setSelectedCollaboratorId(null); setSelectedBranchId(null); };
  const activeFilterCount = [selectedOperatorId, selectedSpecialty, selectedStatus, selectedUrgency, selectedOrigin, selectedCollaboratorId, selectedBranchId].filter(Boolean).length;

  const filteredServices = useMemo(() => {
    if (!hasAnyFilter) return undefined;
    return services.filter((s) => {
      if (selectedOperatorId && !s.operators.some((o) => o.id === selectedOperatorId) && s.operatorId !== selectedOperatorId) return false;
      if (selectedSpecialty && s.specialty !== selectedSpecialty) return false;
      if (selectedStatus && s.status !== selectedStatus) return false;
      if (selectedUrgency && s.urgency !== selectedUrgency) return false;
      if (selectedOrigin && s.origin !== selectedOrigin) return false;
      if (selectedCollaboratorId && s.collaboratorId !== selectedCollaboratorId) return false;
      if (selectedBranchId && s.branchId !== selectedBranchId) return false;
      return true;
    });
  }, [services, selectedOperatorId, selectedSpecialty, selectedStatus, selectedUrgency, selectedOrigin, selectedCollaboratorId, selectedBranchId, hasAnyFilter]);

  const [createDialog, setCreateDialog] = useState<{ open: boolean; day: Date; startHour: number; endHour: number }>({ open: false, day: new Date(), startHour: 9, endHour: 10 });
  const handleHourRangeSelect = useCallback((day: Date, startHour: number, endHour: number) => { setCreateDialog({ open: true, day, startHour, endHour }); }, []);
  const handleConfirmCreate = () => {
    const { day, startHour, endHour } = createDialog;
    setCreateDialog((prev) => ({ ...prev, open: false }));
    router.push(`/servicios/nuevo?date=${format(day, "yyyy-MM-dd")}&startTime=${String(startHour).padStart(2, "0")}:00&endTime=${String(endHour).padStart(2, "0")}:00`);
  };

  const handleDropService = useCallback(async (serviceId: string, targetDate: Date) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service || !service.scheduledAt) return;
    const oldStart = new Date(service.scheduledAt);
    const dayDelta = differenceInCalendarDays(targetDate, new Date(oldStart.getFullYear(), oldStart.getMonth(), oldStart.getDate()));
    if (dayDelta === 0) return;
    const newStart = addDays(oldStart, dayDelta);
    const updates: Record<string, string> = { scheduled_at: newStart.toISOString() };
    if (service.scheduledEndAt) updates.scheduled_end_at = addDays(new Date(service.scheduledEndAt), dayDelta).toISOString();
    const { error } = await supabase.from("services").update(updates).eq("id", serviceId);
    if (error) { toast({ title: "Error al mover servicio", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Servicio reagendado", description: `${serviceId} movido al ${format(targetDate, "d MMM yyyy", { locale: es })}` }); refetch(); }
  }, [services, refetch, toast]);

  const navigate = (dir: -1 | 1) => {
    if (view === "day") setCurrentDate((d) => (dir === 1 ? addDays(d, 1) : subDays(d, 1)));
    if (view === "week") setCurrentDate((d) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
    if (view === "month") setCurrentDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
  };

  const title = useMemo(() => {
    if (view === "day") return format(currentDate, "EEEE d 'de' MMMM yyyy", { locale: es });
    if (view === "week") { const ws = startOfWeek(currentDate, { locale: es, weekStartsOn: 1 }); return `${format(ws, "d MMM", { locale: es })} – ${format(addDays(ws, 6), "d MMM yyyy", { locale: es })}`; }
    return format(currentDate, "MMMM yyyy", { locale: es });
  }, [currentDate, view]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Calendario</h1>
          <p className="text-sm text-muted-foreground">Disponibilidad de operarios y servicios agendados · Arrastra para reagendar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <span className="text-sm font-semibold text-foreground capitalize min-w-[200px] text-center">{title}</span>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ViewMode)} className="border border-border rounded-lg">
            <ToggleGroupItem value="day" className="text-xs px-3 h-8">Día</ToggleGroupItem>
            <ToggleGroupItem value="week" className="text-xs px-3 h-8">Semana</ToggleGroupItem>
            <ToggleGroupItem value="month" className="text-xs px-3 h-8">Mes</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 mt-3">
        <Select value={selectedOperatorId ?? "__all__"} onValueChange={(v) => setSelectedOperatorId(v === "__all__" ? null : v)}>
          <SelectTrigger className={cn("w-[170px] h-8 text-xs", selectedOperatorId && "border-primary text-primary")}><User className="w-3.5 h-3.5 mr-1 shrink-0" /><SelectValue>{selectedOperatorId ? allOps.find(o => o.id === selectedOperatorId)?.name : <span className="text-muted-foreground">Operario</span>}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="__all__">Operario: Todos</SelectItem>{allOps.map((op) => <SelectItem key={op.id} value={op.id}><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: `hsl(${op.color})` }} />{op.name}</span></SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedSpecialty ?? "__all__"} onValueChange={(v) => setSelectedSpecialty(v === "__all__" ? null : v as Specialty)}>
          <SelectTrigger className={cn("w-[170px] h-8 text-xs", selectedSpecialty && "border-primary text-primary")}><Droplets className="w-3.5 h-3.5 mr-1 shrink-0" /><SelectValue>{selectedSpecialty ? selectedSpecialty.replace("/", " / ") : <span className="text-muted-foreground">Especialidad</span>}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="__all__">Especialidad: Todas</SelectItem><SelectItem value="Fontanería/Agua"><span className="flex items-center gap-1.5">{specialtyIcon["Fontanería/Agua"]} Fontanería</span></SelectItem><SelectItem value="Electricidad/Luz"><span className="flex items-center gap-1.5">{specialtyIcon["Electricidad/Luz"]} Electricidad</span></SelectItem><SelectItem value="Clima"><span className="flex items-center gap-1.5">{specialtyIcon["Clima"]} Clima</span></SelectItem><SelectItem value="Carpintería_Metálica"><span className="flex items-center gap-1.5">{specialtyIcon["Carpintería_Metálica"]} Carpintería Met.</span></SelectItem></SelectContent>
        </Select>
        <Select value={selectedStatus ?? "__all__"} onValueChange={(v) => setSelectedStatus(v === "__all__" ? null : v as ServiceStatus)}>
          <SelectTrigger className={cn("w-[170px] h-8 text-xs", selectedStatus && "border-primary text-primary")}><PlayCircle className="w-3.5 h-3.5 mr-1 shrink-0" /><SelectValue>{selectedStatus ? selectedStatus.replace(/_/g, " ") : <span className="text-muted-foreground">Estado</span>}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="__all__">Estado: Todos</SelectItem><SelectItem value="Pendiente_Contacto">Pendiente contacto</SelectItem><SelectItem value="Pte_Asignacion">Pte. Asignación</SelectItem><SelectItem value="Asignado">Asignado</SelectItem><SelectItem value="Agendado">Agendado</SelectItem><SelectItem value="En_Curso">En curso</SelectItem><SelectItem value="Finalizado">Finalizado</SelectItem><SelectItem value="Liquidado">Liquidado</SelectItem></SelectContent>
        </Select>
        <Select value={selectedUrgency ?? "__all__"} onValueChange={(v) => setSelectedUrgency(v === "__all__" ? null : v as UrgencyLevel)}>
          <SelectTrigger className={cn("w-[150px] h-8 text-xs", selectedUrgency && "border-primary text-primary")}><AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" /><SelectValue>{selectedUrgency ?? <span className="text-muted-foreground">Urgencia</span>}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="__all__">Urgencia: Todas</SelectItem><SelectItem value="Estándar">Estándar</SelectItem><SelectItem value="24h">24h</SelectItem><SelectItem value="Inmediato">Inmediato</SelectItem></SelectContent>
        </Select>
        <Select value={selectedOrigin ?? "__all__"} onValueChange={(v) => setSelectedOrigin(v === "__all__" ? null : v as ServiceOrigin)}>
          <SelectTrigger className={cn("w-[150px] h-8 text-xs", selectedOrigin && "border-primary text-primary")}><Globe className="w-3.5 h-3.5 mr-1 shrink-0" /><SelectValue>{selectedOrigin ? selectedOrigin.replace(/_/g, " ") : <span className="text-muted-foreground">Origen</span>}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="__all__">Origen: Todos</SelectItem><SelectItem value="App">App</SelectItem><SelectItem value="B2B">B2B</SelectItem><SelectItem value="Directo">Directo</SelectItem><SelectItem value="API_Externa">API Externa</SelectItem></SelectContent>
        </Select>
        <Select value={selectedCollaboratorId ?? "__all__"} onValueChange={(v) => setSelectedCollaboratorId(v === "__all__" ? null : v)}>
          <SelectTrigger className={cn("w-[180px] h-8 text-xs", selectedCollaboratorId && "border-primary text-primary")}><Building2 className="w-3.5 h-3.5 mr-1 shrink-0" /><SelectValue>{selectedCollaboratorId ? collaborators.find(c => c.id === selectedCollaboratorId)?.companyName : <span className="text-muted-foreground">Colaborador</span>}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="__all__">Colaborador: Todos</SelectItem>{collaborators.map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedBranchId ?? "__all__"} onValueChange={(v) => setSelectedBranchId(v === "__all__" ? null : v)}>
          <SelectTrigger className={cn("w-[150px] h-8 text-xs", selectedBranchId && "border-primary text-primary")}><MapPin className="w-3.5 h-3.5 mr-1 shrink-0" /><SelectValue>{selectedBranchId ? branches.find(b => b.id === selectedBranchId)?.name : <span className="text-muted-foreground">Sede</span>}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="__all__">Sede: Todas</SelectItem>{branches.filter(b => b.active).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
        </Select>
        {hasAnyFilter && <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-destructive hover:text-destructive" onClick={clearAllFilters}><X className="w-3.5 h-3.5" />Limpiar ({activeFilterCount})</Button>}
        <div className="flex-1" />
        {view !== "week" && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs"><CalendarIcon className="w-3.5 h-3.5" />Leyenda<ChevronDown className="w-3 h-3 transition-transform [[data-state=open]>&]:rotate-180" /></Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute z-50 mt-1 right-0 w-72 rounded-lg border border-border bg-popover p-3 shadow-lg">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Operarios</p>
              <div className="space-y-1.5">
                {allOps.map((op) => <div key={op.id} className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(${op.color})` }} /><span className="text-xs text-foreground">{op.name}</span></div>)}
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-muted" /><span className="text-xs text-muted-foreground">Sin asignar</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Especialidades</p>
                {(Object.entries(specialtyColor) as [Specialty, string][]).map(([key]) => <div key={key} className="flex items-center gap-2">{specialtyIcon[key]}<span className="text-xs text-muted-foreground">{key}</span></div>)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {view === "week" && (
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 mt-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">Operarios:</span>
          {allOps.map((op) => (
            <button key={op.id} onClick={() => setSelectedOperatorId(selectedOperatorId === op.id ? null : op.id)}
              className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors", selectedOperatorId === op.id ? "ring-2 ring-primary/40 shadow-sm" : "hover:ring-1 hover:ring-ring")}
              style={{ backgroundColor: `hsl(${op.color} / 0.12)`, color: `hsl(${op.color})`, borderColor: `hsl(${op.color} / 0.3)` }}
            >
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: `hsl(${op.color})` }} />
              {op.name.split(" ")[0]}
              <span className={cn("text-[10px] px-1 py-0 rounded-full border", specialtyColor[op.specialty as Specialty])}>{specialtyIcon[op.specialty as Specialty]}</span>
            </button>
          ))}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted/50 text-muted-foreground border-border">
            <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" />Sin asignar
          </span>
        </div>
      )}

      <Card className="mt-3 flex-1 min-h-0">
        <CardContent className="p-3 h-full overflow-auto">
          {view === "day" && <DayView date={currentDate} onDropService={handleDropService} onHourRangeSelect={handleHourRangeSelect} filteredServices={filteredServices} selectedOperatorId={selectedOperatorId} />}
          {view === "week" && <WeekView date={currentDate} onDropService={handleDropService} onHourRangeSelect={handleHourRangeSelect} filteredServices={filteredServices} />}
          {view === "month" && <MonthView date={currentDate} onDropService={handleDropService} filteredServices={filteredServices} />}
        </CardContent>
      </Card>

      <AlertDialog open={createDialog.open} onOpenChange={(open) => setCreateDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-primary" />Crear nuevo servicio</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Deseas crear un nuevo servicio para el <span className="font-semibold text-foreground">{format(createDialog.day, "EEEE d 'de' MMMM", { locale: es })}</span> de <span className="font-semibold text-foreground">{String(createDialog.startHour).padStart(2, "0")}:00</span> a <span className="font-semibold text-foreground">{String(createDialog.endHour).padStart(2, "0")}:00</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreate}>Crear servicio</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
