import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Eye, Lock } from "lucide-react";
import type { ServiceComment } from "@/types/urbango";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description: string;
  comments: ServiceComment[];
  variant: "internal" | "manager";
}

export default function ServiceComments({ title, description, comments, variant }: Props) {
  const Icon = variant === "internal" ? Lock : Eye;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" /> {title}
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-normal text-muted-foreground ml-auto">{description}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Sin comentarios.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
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
      </CardContent>
    </Card>
  );
}
