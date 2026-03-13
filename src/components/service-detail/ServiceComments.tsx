import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  title: string;
  description: string;
  comments?: any[];
  variant: "internal" | "manager";
  initialText?: string;
  onTextChange?: (text: string) => void;
  onAddComment?: (text: string) => void;
  readOnly?: boolean;
}

export default function ServiceComments({ title, description, variant, initialText = "", onTextChange, readOnly }: Props) {
  const Icon = variant === "internal" ? Lock : Eye;
  const [text, setText] = useState(initialText);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const latestTextRef = useRef(text);
  const onTextChangeRef = useRef(onTextChange);
  onTextChangeRef.current = onTextChange;

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleChange = (value: string) => {
    setText(value);
    latestTextRef.current = value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = undefined;
      onTextChangeRef.current?.(value);
    }, 800);
  };

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        onTextChangeRef.current?.(latestTextRef.current);
      }
    };
  }, []);

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
        <Textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={variant === "internal" ? "Añadir comentario interno..." : "Información para compartir con el colaborador..."}
          rows={3}
          disabled={readOnly}
          className={cn(
            "resize-none text-sm",
            variant === "internal" ? "border-warning/20 focus-visible:ring-warning/30" : "border-info/20 focus-visible:ring-info/30",
            readOnly && "opacity-60 cursor-not-allowed"
          )}
        />
      </CardContent>
    </Card>
  );
}
