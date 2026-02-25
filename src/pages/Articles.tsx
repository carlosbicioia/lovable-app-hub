import { useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { articlesData, getArticleSalePrice as getSalePrice, getArticleMargin as getMargin } from "@/data/articlesData";
import type { Article, ArticleCategory, Specialty } from "@/types/urbango";
const initialArticles: Article[] = articlesData;

const categoryLabels: Record<ArticleCategory, string> = { Material: "Material", Mano_de_Obra: "Mano de obra" };
const units = ["ud", "m", "m²", "h", "kg"];

const emptyArticle: Omit<Article, "id"> = {
  title: "", description: "", category: "Material", specialty: "Fontanería/Agua",
  costPrice: 0, hasKnownPvp: false, pvp: null, unit: "ud",
};

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState<Omit<Article, "id">>(emptyArticle);

  const filtered = articles.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || a.category === filterCategory;
    const matchSpec = filterSpecialty === "all" || a.specialty === filterSpecialty;
    return matchSearch && matchCat && matchSpec;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyArticle);
    setDialogOpen(true);
  };

  const openEdit = (a: Article) => {
    setEditing(a);
    setForm({ title: a.title, description: a.description, category: a.category, specialty: a.specialty, costPrice: a.costPrice, hasKnownPvp: a.hasKnownPvp, pvp: a.pvp, unit: a.unit });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" });
      return;
    }
    if (editing) {
      setArticles((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...form } : a));
      toast({ title: "Artículo actualizado" });
    } else {
      const newId = `ART-${String(articles.length + 1).padStart(3, "0")}`;
      setArticles((prev) => [...prev, { id: newId, ...form }]);
      toast({ title: "Artículo creado" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Artículo eliminado" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Artículos</h1>
          <p className="text-muted-foreground text-sm mt-1">{articles.length} artículos en el maestro</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Artículo
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por título o descripción..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Material">Material</SelectItem>
            <SelectItem value="Mano_de_Obra">Mano de obra</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Especialidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Fontanería/Agua">Fontanería/Agua</SelectItem>
            <SelectItem value="Electricidad/Luz">Electricidad/Luz</SelectItem>
            <SelectItem value="Clima">Clima</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">ID</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Título</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Categoría</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Especialidad</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Ud.</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Coste</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">PVP</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Margen</th>
                <th className="text-center px-5 py-3 text-muted-foreground font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const sale = getSalePrice(a);
                const margin = getMargin(a);
                return (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{a.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-card-foreground">{a.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[300px]">{a.description}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                        a.category === "Mano_de_Obra" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"
                      )}>
                        {categoryLabels[a.category]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{a.specialty}</td>
                    <td className="px-5 py-3 text-muted-foreground">{a.unit}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{a.costPrice.toFixed(2)} €</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">
                      {sale.toFixed(2)} €
                      {!a.hasKnownPvp && <span className="ml-1 text-[10px] text-muted-foreground">(+30%)</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn(
                        "text-xs font-medium",
                        margin >= 30 ? "text-success" : margin >= 15 ? "text-warning" : "text-destructive"
                      )}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">
                    No se encontraron artículos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nombre del artículo" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción detallada..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ArticleCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Material">Material</SelectItem>
                    <SelectItem value="Mano_de_Obra">Mano de obra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Especialidad</Label>
                <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v as Specialty })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fontanería/Agua">Fontanería/Agua</SelectItem>
                    <SelectItem value="Electricidad/Luz">Electricidad/Luz</SelectItem>
                    <SelectItem value="Clima">Clima</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Precio de coste (€)</Label>
                <Input type="number" min={0} step={0.01} value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>PVP Venta (€)</Label>
                <Input
                  type="number" min={0} step={0.01}
                  value={form.hasKnownPvp && form.pvp !== null ? form.pvp : (form.costPrice * 1.30).toFixed(2)}
                  onChange={(e) => setForm({ ...form, pvp: parseFloat(e.target.value) || 0 })}
                  disabled={!form.hasKnownPvp}
                  className={cn(!form.hasKnownPvp && "bg-muted")}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch checked={form.hasKnownPvp} onCheckedChange={(v) => setForm({ ...form, hasKnownPvp: v, pvp: v ? form.costPrice * 1.30 : null })} />
              <Label className="text-sm font-normal">PVP conocido del proveedor</Label>
              {!form.hasKnownPvp && (
                <span className="text-xs text-muted-foreground ml-auto">Se aplica +30% sobre coste</span>
              )}
            </div>

            {/* Preview */}
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Coste:</span>
                <span className="text-card-foreground">{form.costPrice.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">PVP:</span>
                <span className="font-medium text-card-foreground">{getSalePrice(form).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margen:</span>
                <span className={cn("font-medium", getMargin(form) >= 30 ? "text-success" : "text-warning")}>
                  {getMargin(form).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" /> {editing ? "Guardar cambios" : "Crear artículo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
