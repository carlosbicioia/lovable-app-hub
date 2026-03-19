import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye, Lock, Save, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { VoiceTextarea as Textarea } from "@/components/ui/voice-textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface NotesHistoryEntry {
  id: string;
  content: string;
  user_email: string;
  created_at: string;
}

function useNotesHistory(serviceId: string, field: string) {
  return useQuery({
    queryKey: ["service_notes_history", serviceId, field],
    enabled: !!serviceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_notes_history" as any)
        .select("id, content, user_email, created_at")
        .eq("service_id", serviceId)
        .eq("field", field)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as any[]) as NotesHistoryEntry[];
    },
  });
}

interface Props {
  serviceId: string;
  title: string;
  description: string;
  comments?: any[];
  variant: "internal" | "manager";
  initialText?: string;
  onSave?: (text: string) => Promise<void> | void;
  readOnly?: boolean;
  field: "internal_notes" | "collaborator_notes";
}

export default function ServiceComments({ serviceId, title, description, variant, initialText = "", onSave, readOnly, field }: Props) {
  const Icon = variant === "internal" ? Lock : Eye;
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const queryClient = useQueryClient();
  const { data: history = [], isLoading: historyLoading } = useNotesHistory(serviceId, field);

  useEffect(() => {
    setText(initialText);
    setDirty(false);
  }, [initialText]);

  const handleChange = (value: string) => {
    setText(value);
    setDirty(value !== initialText);
  };

  const handleSave = useCallback(async () => {
    if (!dirty || saving || readOnly) return;
    setSaving(true);
    try {
      // Save the note
      await onSave?.(text);

      // Log to history
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("service_notes_history" as any).insert({
        service_id: serviceId,
        field,
        content: text,
        user_id: user?.id ?? null,
        user_email: user?.email ?? "Sistema",
      } as any);

      queryClient.invalidateQueries({ queryKey: ["service_notes_history", serviceId, field] });
      setDirty(false);
      toast.success("Nota guardada");
    } catch {
      toast.error("Error al guardar la nota");
    } finally {
      setSaving(false);
    }
  }, [dirty, saving, readOnly, text, onSave, serviceId, field, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" /> {title}
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-normal text-muted-foreground ml-auto">{description}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Textarea + Save */}
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={variant === "internal" ? "Añadir comentario interno..." : "Información para compartir con el colaborador..."}
            rows={3}
            disabled={readOnly}
            className={cn(
              "resize-none text-sm",
              variant === "internal" ? "border-warning/20 focus-visible:ring-warning/30" : "border-info/20 focus-visible:ring-info/30",
              readOnly && "opacity-60 cursor-not-allowed"
            )}
          />
          {!readOnly && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {dirty ? "Cambios sin guardar" : ""}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground hidden sm:inline">⌘+Enter para guardar</span>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!dirty || saving}
                  className="h-7 text-xs gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
              <Clock className="w-3 h-3" /> Historial de cambios
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((entry) => (
                <div key={entry.id} className="text-xs border-l-2 border-muted pl-3 py-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium text-foreground/80">{entry.user_email}</span>
                    <span>·</span>
                    <span>{format(new Date(entry.created_at), "dd MMM yyyy · HH:mm", { locale: es })}</span>
                  </div>
                  <p className="text-foreground/70 mt-0.5 whitespace-pre-wrap line-clamp-3">{entry.content || "(vacío)"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
