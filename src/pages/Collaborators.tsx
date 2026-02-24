import { mockCollaborators } from "@/data/mockData";
import { Search, Plus, Filter, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  Administrador: "bg-info/15 text-info border-info/30",
  Corredor: "bg-primary/15 text-primary border-primary/30",
  Gestoría: "bg-success/15 text-success border-success/30",
  Otros: "bg-muted text-muted-foreground border-border",
};

export default function Collaborators() {
  const [search, setSearch] = useState("");
  const filtered = mockCollaborators.filter(
    (c) => c.companyName.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Colaboradores</h1>
          <p className="text-muted-foreground text-sm mt-1">{mockCollaborators.length} colaboradores B2B</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Colaborador
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar empresa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-card-foreground">{c.companyName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{c.contactPerson} · {c.email}</p>
              </div>
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", categoryColors[c.category])}>
                {c.category}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-lg font-display font-bold text-card-foreground">{c.activeServices}</p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-display font-bold text-card-foreground">{c.totalClients}</p>
                <p className="text-xs text-muted-foreground">Clientes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="text-lg font-display font-bold text-card-foreground">{c.npsMean}</span>
                </div>
                <p className="text-xs text-muted-foreground">NPS</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
