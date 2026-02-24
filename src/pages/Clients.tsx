import { mockClients } from "@/data/mockData";
import { Search, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const planColors: Record<string, string> = {
  Agua: "bg-info/15 text-info border-info/30",
  Luz: "bg-warning/15 text-warning border-warning/30",
  Clima: "bg-primary/15 text-primary border-primary/30",
  Ninguno: "bg-muted text-muted-foreground border-border",
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const filtered = mockClients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{mockClients.length} clientes registrados</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, ID o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">ID</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">DNI</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Nombre</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Dirección</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Ciudad</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Colaborador</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Plan</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Últ. Servicio</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.dni}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-card-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground max-w-[200px] truncate">{c.address}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.city}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.collaboratorName ?? <span className="italic">Directo</span>}</td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", planColors[c.planType])}>
                      {c.planType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {c.lastServiceDate ? new Date(c.lastServiceDate).toLocaleDateString("es-ES") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
