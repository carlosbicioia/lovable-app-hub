import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceTextarea as Textarea } from "@/components/ui/voice-textarea";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  serviceId: string;
}

export default function ServiceTimeline({ serviceId }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["service_timeline_events", serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_timeline_events" as any)
        .select("*")
        .eq("service_id", serviceId)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const handleAdd = async () => {
    if (!newDate || !newComment.trim()) return;
    setSaving(true);
    try {
      const dateStr = `${newDate}T${newTime || "00:00"}:00`;
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("service_timeline_events" as any)
        .insert({
          service_id: serviceId,
          event_date: dateStr,
          comment: newComment.trim(),
          author_email: user?.email ?? "Usuario",
          author_id: user?.id ?? null,
        } as any);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["service_timeline_events", serviceId] });
      setNewDate("");
      setNewTime("");
      setNewComment("");
      setShowForm(false);
      toast.success("Entrada añadida a la cronología");
    } catch {
      toast.error("Error al guardar la entrada");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" /> Cronología
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Añadir entrada
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Fecha</label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Hora</label>
                <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Comentario</label>
              <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Describe lo ocurrido..." className="text-sm min-h-[60px]" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAdd} disabled={!newDate || !newComment.trim() || saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Guardar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No hay entradas en la cronología</p>
        ) : (
          <div className="relative">
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {events.map((ev: any) => (
                <div key={ev.id} className="flex gap-3 relative">
                  <div className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ev.event_date), "dd MMM yyyy · HH:mm", { locale: es })}
                      {ev.author_email && <span className="ml-2 font-medium text-muted-foreground">— {ev.author_email}</span>}
                    </p>
                    <p className="text-sm text-card-foreground mt-0.5">{ev.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
