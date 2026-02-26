import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePurchaseOrders, useUpdatePurchaseOrderStatus, PurchaseOrderType, PurchaseOrderStatus } from "@/hooks/usePurchaseOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Loader2,
  ShoppingCart,
  Wrench,
  Package,
  Receipt,
  AlertTriangle,
  Truck,
  CreditCard,
  Pencil,
  CheckCircle2,
  Trash2,
} from "lucide-react";

const typeLabels: Record<PurchaseOrderType, string> = {
  Servicio: "Servicio",
  Fungible: "Fungible",
  Gasto_General: "Gasto general",
};

const typeIcons: Record<PurchaseOrderType, React.ReactNode> = {
  Servicio: <Wrench className="w-3.5 h-3.5" />,
  Fungible: <Package className="w-3.5 h-3.5" />,
  Gasto_General: <Receipt className="w-3.5 h-3.5" />,
};

const statusConfig: Record<PurchaseOrderStatus, { label: string; cls: string }> = {
  Borrador: { label: "Borrador", cls: "bg-muted text-muted-foreground" },
  Pendiente_Aprobación: { label: "Pte. Aprobación", cls: "bg-warning/15 text-warning border-warning/30" },
  Aprobada: { label: "Aprobada", cls: "bg-info/15 text-info border-info/30" },
  Recogida: { label: "Recogida", cls: "bg-primary/15 text-primary border-primary/30" },
  Conciliada: { label: "Conciliada", cls: "bg-success/15 text-success border-success/30" },
};

type TabFilter = "all" | PurchaseOrderType;

export default function Purchases() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = usePurchaseOrders();
  const { data: suppliers = [] } = useSuppliers();
  const updateStatus = useUpdatePurchaseOrderStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const uniqueSuppliers = useMemo(() => {
    const names = [...new Set(orders.map((o) => o.supplierName).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders;
    if (tab !== "all") list = list.filter((o) => o.type === tab);
    if (supplierFilter !== "all") list = list.filter((o) => o.supplierName === supplierFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.supplierName.toLowerCase().includes(q) ||
          (o.operatorName ?? "").toLowerCase().includes(q) ||
          (o.serviceId ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, tab, search, supplierFilter]);

  const counts = useMemo(() => ({
    all: orders.length,
    Servicio: orders.filter((o) => o.type === "Servicio").length,
    Fungible: orders.filter((o) => o.type === "Fungible").length,
    Gasto_General: orders.filter((o) => o.type === "Gasto_General").length,
  }), [orders]);

  const nextStatusMap: Partial<Record<PurchaseOrderStatus, PurchaseOrderStatus>> = {
    Borrador: "Pendiente_Aprobación",
    Pendiente_Aprobación: "Aprobada",
    Aprobada: "Recogida",
    Recogida: "Conciliada",
  };

  const handleValidate = (e: React.MouseEvent, id: string, currentStatus: PurchaseOrderStatus) => {
    e.stopPropagation();
    const next = nextStatusMap[currentStatus];
    if (!next) return;
    updateStatus.mutate({ id, status: next });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Delete lines first, then the order
    await supabase.from("purchase_order_lines").delete().eq("purchase_order_id", deleteTarget);
    const { error } = await supabase.from("purchase_orders").delete().eq("id", deleteTarget);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Orden eliminada" });
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
    }
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Compras</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {orders.length} órdenes de compra · Gestión de suministros y materiales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/compras/nueva?direct=true")}>
            <CreditCard className="w-4 h-4 mr-2" /> Compra directa
          </Button>
          <Button onClick={() => navigate("/compras/nueva")}>
            <Plus className="w-4 h-4 mr-2" /> Nueva OC
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)}>
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            Todas
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="Servicio" className="gap-1.5">
            <Wrench className="w-3.5 h-3.5" />
            Servicio
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{counts.Servicio}</Badge>
          </TabsTrigger>
          <TabsTrigger value="Fungible" className="gap-1.5">
            <Package className="w-3.5 h-3.5" />
            Fungible
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{counts.Fungible}</Badge>
          </TabsTrigger>
          <TabsTrigger value="Gasto_General" className="gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            Gasto general
            <Badge variant="secondary" className="text-[10px] h-5 ml-1">{counts.Gasto_General}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search + Supplier filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID, proveedor, operario..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-[220px]">
            <Truck className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Todos los proveedores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proveedores</SelectItem>
            {uniqueSuppliers.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">ID</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Servicio</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Proveedor</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Operario</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium">Fecha</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium">Coste</th>
                <th className="text-center px-5 py-3 text-muted-foreground font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    No hay órdenes de compra
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const sc = statusConfig[o.status];
                  const canValidate = !!nextStatusMap[o.status];
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/compras/${o.id}`)}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          {o.id}
                          {o.isEmergency && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          {typeIcons[o.type]}
                          {typeLabels[o.type]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs">{o.serviceId ?? "—"}</td>
                      <td className="px-5 py-3 font-medium text-card-foreground">{o.supplierName || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{o.operatorName ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", sc.cls)}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {format(new Date(o.createdAt), "dd MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-card-foreground">
                        €{o.totalCost.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Editar"
                            onClick={() => navigate(`/compras/${o.id}`)}
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          {canValidate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title={`Validar → ${statusConfig[nextStatusMap[o.status]!].label}`}
                              onClick={(e) => handleValidate(e, o.id, o.status)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Eliminar"
                            onClick={() => setDeleteTarget(o.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden {deleteTarget}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán la orden y todas sus líneas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
