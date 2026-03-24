"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import KpiCard from "@/components/shared/KpiCard";
import { exportCsv } from "@/lib/exportCsv";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";

const COLORS = ["hsl(211,86%,50%)", "hsl(152,60%,42%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)", "hsl(340,75%,55%)", "hsl(25,95%,53%)"];

export default function PurchasesReport() {
  const router = useRouter();
  const { data: invoices = [] } = usePurchaseInvoices();

  const stats = useMemo(() => {
    const total = invoices.length;
    const totalAmount = invoices.reduce((a, i) => a + i.total, 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;
    const totalTax = invoices.reduce((a, i) => a + i.taxAmount, 0);

    const statusMap: Record<string, number> = {};
    invoices.forEach((i) => { statusMap[i.status] = (statusMap[i.status] || 0) + 1; });
    const byStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    const supplierMap: Record<string, { count: number; total: number }> = {};
    invoices.forEach((i) => {
      if (!supplierMap[i.supplierName]) supplierMap[i.supplierName] = { count: 0, total: 0 };
      supplierMap[i.supplierName].count++;
      supplierMap[i.supplierName].total += i.total;
    });
    const topSuppliersByAmount = Object.entries(supplierMap).sort((a, b) => b[1].total - a[1].total).slice(0, 10).map(([name, v]) => ({ name, value: v.total }));
    const topSuppliersByCount = Object.entries(supplierMap).sort((a, b) => b[1].count - a[1].count).slice(0, 10).map(([name, v]) => ({ name, value: v.count }));

    const monthMap: Record<string, number> = {};
    invoices.forEach((i) => {
      const m = i.invoiceDate?.slice(0, 7) || i.createdAt?.slice(0, 7) || "Sin fecha";
      monthMap[m] = (monthMap[m] || 0) + i.total;
    });
    const monthly = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0])).map(([name, value]) => ({ name, value: Math.round(value) }));

    const pending = invoices.filter((i) => i.status === "Pendiente").reduce((a, i) => a + i.total, 0);
    const validated = invoices.filter((i) => i.status === "Validada").reduce((a, i) => a + i.total, 0);

    return { total, totalAmount, avgAmount, totalTax, byStatus, topSuppliersByAmount, topSuppliersByCount, monthly, pending, validated, supplierMap };
  }, [invoices]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/informes")}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Informe de compras</h1>
          <p className="text-sm text-muted-foreground">{stats.total} facturas de compra</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Facturas" value={stats.total} icon={ShoppingCart} variant="default" />
        <KpiCard title="Total" value={`${(stats.totalAmount / 1000).toFixed(1)}k €`} icon={ShoppingCart} variant="primary" />
        <KpiCard title="Media/fact." value={`${stats.avgAmount.toFixed(0)} €`} icon={ShoppingCart} variant="info" />
        <KpiCard title="Total IVA" value={`${(stats.totalTax / 1000).toFixed(1)}k €`} icon={ShoppingCart} variant="warning" />
        <KpiCard title="Pendiente" value={`${(stats.pending / 1000).toFixed(1)}k €`} icon={ShoppingCart} variant="warning" />
        <KpiCard title="Validadas" value={`${(stats.validated / 1000).toFixed(1)}k €`} icon={ShoppingCart} variant="success" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Evolución mensual de compras</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString("es-ES")} €`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="Gasto" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Por estado</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 proveedores por importe</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topSuppliersByAmount} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("es-ES")} €`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Importe" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 proveedores por nº facturas</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topSuppliersByCount} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} name="Facturas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Detalle de proveedores</CardTitle>
          <Button variant="outline" size="sm" onClick={() => {
            const rows = Object.entries(stats.supplierMap).sort((a, b) => b[1].total - a[1].total).map(([name, v]) => [name, String(v.count), v.total.toFixed(2), (v.total / v.count).toFixed(2)]);
            exportCsv("proveedores-compras.csv", ["Proveedor", "Nº Facturas", "Total", "Media"], rows);
          }}><Download className="w-4 h-4 mr-1.5" /> CSV</Button>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground">Proveedor</th>
              <th className="text-right py-2 px-3 font-medium text-muted-foreground">Facturas</th>
              <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total</th>
              <th className="text-right py-2 px-3 font-medium text-muted-foreground">Media</th>
            </tr></thead>
            <tbody>
              {Object.entries(stats.supplierMap).sort((a, b) => b[1].total - a[1].total).slice(0, 15).map(([name, v]) => (
                <tr key={name} className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">{name}</td>
                  <td className="py-2 px-3 text-right text-foreground">{v.count}</td>
                  <td className="py-2 px-3 text-right text-foreground">{v.total.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{(v.total / v.count).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
