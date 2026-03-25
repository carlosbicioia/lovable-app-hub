import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useArticles } from "@/hooks/useArticles";
import type { Article } from "@/types/urbango";
import { cn } from "@/lib/utils";

interface ArticleAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (article: Article) => void;
  placeholder?: string;
  className?: string;
}

export default function ArticleAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Código o nombre...",
  className,
}: ArticleAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data: articles = [] } = useArticles();

  const filtered = query.length >= 1
    ? articles.filter(
        (a) =>
          a.id.toLowerCase().includes(query.toLowerCase()) ||
          a.title.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => { if (value) { setQuery(value); setOpen(true); } }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-52 overflow-auto">
          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors flex items-center justify-between gap-2 text-sm"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(a);
                setOpen(false);
              }}
            >
              <div className="min-w-0">
                <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                <span className="ml-2 text-foreground">{a.title}</span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                €{a.costPrice.toFixed(2)}/{a.unit}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
