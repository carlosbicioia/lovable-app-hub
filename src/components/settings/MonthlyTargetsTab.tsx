import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMonthlyTargets, useUpsertMonthlyTarget, type MonthlyTarget } from "@/hooks/useMonthlyTargets";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type MetricKey = "targetRevenue" | "targetServices" | "targetNps" | "targetMargin" | "targetMaxCosts" | "targetNewClients" | "targetAvgResponseHours" | "targetOperators" | "avgPricePerService";

interface MetricRow {
  key: MetricKey;
  label: string;
  group?: string;
  format: (v: number) => string;
  color: string;
  editable: boolean;
  step?: number;
  max?: number;
  computed?: (t: { targetRevenue: number; targetServices: number }) => number;
}

const metricRows: MetricRow[] = [
  { key: "targetRevenue", label: "Ventas objetivo", group: "Ingresos", format: v => `${v.toLocaleString()}€`, color: "hsl(var(--primary))", editable: true },
  { key: "targetMaxCosts", label: "Costes máximos", format: v => `${v.toLocaleString()}€`, color: "hsl(var(--destructive))", editable: false },
  { key: "targetMargin", label: "Margen objetivo", group: "Rendimiento", format: v => `${v}%`, color: "hsl(142 71% 45%)", editable: true, max: 100 },
  { key: "targetServices", label: "Nº servicios", format: v => String(v), color: "hsl(var(--primary))", editable: true, step: 1 },
  { key: "avgPricePerService", label: "Precio medio / servicio", format: v => v > 0 ? `${v.toLocaleString()}€` : "—", color: "hsl(200 80% 50%)", editable: false, computed: t => t.targetServices > 0 ? Math.round(t.targetRevenue / t.targetServices) : 0 },
  { key: "targetOperators", label: "Nº industriales", group: "Equipo", format: v => String(v), color: "hsl(25 95% 53%)", editable: true, step: 1 },
  { key: "targetNps", label: "NPS medio", format: v => v.toFixed(1), color: "hsl(45 93% 47%)", editable: true, step: 0.1, max: 10 },
  { key: "targetNewClients", label: "Nuevos clientes", group: "Clientes", format: v => String(v), color: "hsl(262 83% 58%)", editable: true, step: 1 },
  { key: "targetAvgResponseHours", label: "Tiempo respuesta", format: v => `${v}h`, color: "hsl(var(--muted-foreground))", editable: true, step: 0.5 },
];

function getYearMonths(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
}

const defaultTarget = (month: string): Omit<MonthlyTarget, "id"> & { id?: string } => ({
  month,
  targetRevenue: 0,
  targetServices: 0,
  targetNps: 8,
  targetMargin: 30,
  targetMaxCosts: 0,
  targetNewClients: 0,
  targetAvgResponseHours: 12,
  targetOperators: 0,
  notes: "",
});

export default function MonthlyTargetsTab() {
  const { data: targets = [], isLoading } = useMonthlyTargets();
  const upsert = useUpsertMonthlyTarget();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const months = useMemo(() => getYearMonths(year), [year]);
  const currentMonth = format(new Date(), "yyyy-MM");

  const [editingCell, setEditingCell] = useState<{ month: string; key: MetricKey } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Map month -> target data (or defaults)
  const targetMap = useMemo(() => {
    const map: Record<string, MonthlyTarget | (Omit<MonthlyTarget, "id"> & { id?: string })> = {};
    for (const m of months) {
      const existing = targets.find(t => t.month === m);
      map[m] = existing || defaultTarget(m);
    }
    return map;
  }, [targets, months]);

  const formatMonthShort = (m: string) => {
    try {
      const d = parse(m, "yyyy-MM", new Date());
      return format(d, "MMM", { locale: es });
    } catch {
      return m;
    }
  };

  const chartData = useMemo(
    () =>
      months.map(m => {
        const t = targetMap[m];
        return {
          name: formatMonthShort(m),
          ventas: t.targetRevenue,
          costes: t.targetMaxCosts,
        };
      }),
    [months, targetMap]
  );

  const hasAnyData = useMemo(() => months.some(m => targetMap[m].targetRevenue > 0), [months, targetMap]);

  const startEdit = (month: string, key: MetricKey) => {
    const t = targetMap[month];
    setEditingCell({ month, key });
    setEditValue(String(t[key]));
  };

  const saveEdit = () => {
    if (!editingCell) return;
    const t = targetMap[editingCell.month];
    const numVal = Number(editValue);
    const updated = { ...t, [editingCell.key]: numVal };

    // Recalc costs when revenue or margin change
    if (editingCell.key === "targetRevenue" || editingCell.key === "targetMargin") {
      const rev = editingCell.key === "targetRevenue" ? numVal : updated.targetRevenue;
      const mar = editingCell.key === "targetMargin" ? numVal : updated.targetMargin;
      updated.targetMaxCosts = mar > 0 ? Math.round(rev * (1 - mar / 100)) : updated.targetMaxCosts;
    }

    upsert.mutate(
      {
        ...(updated.id ? { id: updated.id } : {}),
        month: editingCell.month,
        targetRevenue: updated.targetRevenue,
        targetServices: updated.targetServices,
        targetNps: updated.targetNps,
        targetMargin: updated.targetMargin,
        targetMaxCosts: updated.targetMaxCosts,
        targetNewClients: updated.targetNewClients,
        targetAvgResponseHours: updated.targetAvgResponseHours,
        targetOperators: updated.targetOperators,
        notes: updated.notes || "",
      } as any,
      { onSuccess: () => setEditingCell(null) }
    );
  };

  const cancelEdit = () => setEditingCell(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Objetivos Mensuales
            </CardTitle>
            <CardDescription>Haz clic en cualquier celda para editarla · Los costes se calculan automáticamente</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>←</Button>
            <span className="text-sm font-semibold w-14 text-center">{year}</span>
            <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>→</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Chart */}
        {hasAnyData && (
          <div className="px-6 pb-4">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => `${v.toLocaleString()}€`}
                />
                <Line type="monotone" dataKey="ventas" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Ventas" />
                <Line type="monotone" dataKey="costes" stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} name="Costes máx." />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pivot table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[170px] sticky left-0 bg-card z-10">Indicador</TableHead>
                {months.map(m => {
                  const isCurrent = m === currentMonth;
                  return (
                    <TableHead
                      key={m}
                      className={cn(
                        "text-center min-w-[90px] capitalize relative px-2",
                        isCurrent && "bg-primary/5"
                      )}
                    >
                      <span className="text-xs">{formatMonthShort(m)}</span>
                      {isCurrent && (
                        <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary rounded-full" />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricRows.map((row) => (
                <>
                  {row.group && (
                    <TableRow key={`group-${row.group}`} className="bg-muted/30 hover:bg-muted/30">
                      <TableCell
                        colSpan={13}
                        className="sticky left-0 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                          {row.group}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow key={row.key}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium text-xs py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: row.color }} />
                        {row.label}
                      </div>
                    </TableCell>
                    {months.map(m => {
                      const t = targetMap[m];
                      const val = row.computed ? row.computed(t) : (t[row.key as keyof typeof t] as number);
                      const isEditing = editingCell?.month === m && editingCell.key === row.key;
                      const isCurrent = m === currentMonth;
                      const isEmpty = val === 0 && !("id" in t && t.id);

                      if (isEditing) {
                        return (
                          <TableCell key={m} className={cn("p-0.5 text-center", isCurrent && "bg-primary/5")}>
                            <Input
                              autoFocus
                              type="number"
                              className="h-7 text-center text-xs w-full min-w-[70px]"
                              value={editValue}
                              min={0}
                              max={row.max}
                              step={row.step || 1}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") saveEdit();
                                if (e.key === "Escape") cancelEdit();
                              }}
                              onBlur={saveEdit}
                            />
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell
                          key={m}
                          className={cn(
                            "text-center tabular-nums text-xs py-2 px-1",
                            isCurrent && "bg-primary/5 font-semibold",
                            row.editable && "cursor-pointer hover:bg-muted/50 transition-colors",
                            !row.editable && "text-muted-foreground",
                            isEmpty && !row.editable && "text-muted-foreground/50"
                          )}
                          onClick={() => row.editable && startEdit(m, row.key)}
                        >
                          {isEmpty && !("id" in t && t.id) ? "-" : row.format(val)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
