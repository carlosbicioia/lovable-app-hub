import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceTextarea as Textarea } from "@/components/ui/voice-textarea";
import type { Service, TimelineEvent } from "@/types/urbango";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  service: Service;
}

export default function ServiceTimeline({ service }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>(service.timelineEvents ?? []);
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newComment, setNewComment] = useState("");

  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAdd = () => {
    if (!newDate || !newComment.trim()) return;
    const dateStr = `${newDate}T${newTime || "00:00"}:00`;
    const newEvent: TimelineEvent = {
      id: `TE-NEW-${Date.now()}`,
      date: dateStr,
      comment: newComment.trim(),
      author: "Usuario",
    };
    setEvents((prev) => [...prev, newEvent]);
    setNewDate("");
    setNewTime("");
    setNewComment("");
    setShowForm(false);
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
              <Button size="sm" onClick={handleAdd} disabled={!newDate || !newComment.trim()}>Guardar</Button>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {sorted.map((ev) => (
              <div key={ev.id} className="flex gap-3 relative">
                <div className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center shrink-0 z-10">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(ev.date), "dd MMM yyyy · HH:mm", { locale: es })}
                    {ev.author && <span className="ml-2 font-medium text-muted-foreground">— {ev.author}</span>}
                  </p>
                  <p className="text-sm text-card-foreground mt-0.5">{ev.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
