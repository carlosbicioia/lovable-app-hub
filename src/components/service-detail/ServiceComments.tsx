import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Eye, Lock, Send } from "lucide-react";
import type { ServiceComment } from "@/types/urbango";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  title: string;
  description: string;
  comments: ServiceComment[];
  variant: "internal" | "manager";
  onAddComment?: (text: string) => void;
}

export default function ServiceComments({ title, description, comments, variant, onAddComment }: Props) {
  const Icon = variant === "internal" ? Lock : Eye;
  const [newText, setNewText] = useState("");
  const [localComments, setLocalComments] = useState<ServiceComment[]>(comments);

  const handleSubmit = () => {
    if (!newText.trim()) return;
    const comment: ServiceComment = {
      id: `c-${Date.now()}`,
      text: newText.trim(),
      author: "Tú",
      createdAt: new Date().toISOString(),
    };
    setLocalComments((prev) => [...prev, comment]);
    onAddComment?.(newText.trim());
    setNewText("");
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
        {localComments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Sin comentarios.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {localComments.map((c) => (
              <div key={c.id} className={cn(
                "p-3 rounded-lg border text-sm",
                variant === "internal"
                  ? "border-warning/20 bg-warning/5"
                  : "border-info/20 bg-info/5"
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-card-foreground">{c.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(c.createdAt), "dd MMM yyyy · HH:mm", { locale: es })}
                  </span>
                </div>
                <p className="text-card-foreground">{c.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add comment */}
        <div className="flex gap-2">
          <Textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={variant === "internal" ? "Añadir comentario interno..." : "Añadir comentario para el colaborador..."}
            rows={2}
            className="resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!newText.trim()}
            className="shrink-0 self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
