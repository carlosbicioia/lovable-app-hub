import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSuppliers } from "@/hooks/useSuppliers";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SupplierAutocomplete({ value, onChange, placeholder = "Buscar proveedor…", className }: Props) {
  const { data: suppliers = [] } = useSuppliers();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInputValue(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = inputValue.trim()
    ? suppliers.filter(s => s.active && s.name.toLowerCase().includes(inputValue.toLowerCase())).slice(0, 8)
    : suppliers.filter(s => s.active).slice(0, 8);

  const handleSelect = (name: string) => {
    setInputValue(name);
    onChange(name);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={inputValue}
        onChange={e => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s.id}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                s.name === value && "bg-accent/50 font-medium"
              )}
              onMouseDown={e => { e.preventDefault(); handleSelect(s.name); }}
            >
              <span className="text-card-foreground">{s.name}</span>
              {s.contactPerson && <span className="text-xs text-muted-foreground ml-2">· {s.contactPerson}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
