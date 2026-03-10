import { useState, useCallback } from "react";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Wrench,
  DollarSign,
  FileText,
  HardHat,
  ShoppingCart,
  Sparkles,
  Send,
  Loader2,
  Download,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServices } from "@/hooks/useServices";
import { useOperators } from "@/hooks/useOperators";
import { useClients } from "@/hooks/useClients";
import { useBudgets } from "@/hooks/useBudgets";
import { usePurchaseInvoices } from "@/hooks/usePurchaseInvoices";
import { cn } from "@/lib/utils";
import { exportCsv } from "@/lib/exportCsv";
import KpiCard from "@/components/shared/KpiCard";

// ── Predefined report prompts ──
const REPORT_TEMPLATES = [
  {
    id: "services-summary",
    label: "Resumen de servicios",
    icon: Wrench,
    prompt: "Genera un informe resumen completo de los servicios: distribución por estado, especialidad, urgencia, tiempos medios, y tendencias.",
    color: "primary" as const,
  },
  {
    id: "operator-performance",
    label: "Rendimiento de operarios",
    icon: HardHat,
    prompt: "Analiza el rendimiento de cada operario: servicios completados, ingresos generados, NPS medio, servicios activos y ranking.",
    color: "success" as const,
  },
  {
    id: "financial",
    label: "Informe financiero",
    icon: DollarSign,
    prompt: "Genera un informe financiero con: presupuestos por estado, facturación total, costes de compras, margen estimado y evolución temporal.",
    color: "warning" as const,
  },
  {
    id: "clients",
    label: "Análisis de clientes",
    icon: Users,
    prompt: "Analiza la cartera de clientes: distribución por origen, tipo, plan, zona geográfica, clientes recurrentes vs nuevos.",
    color: "info" as const,
  },
  {
    id: "purchases",
    label: "Compras y proveedores",
    icon: ShoppingCart,
    prompt: "Genera un informe de compras: volumen de facturas, principales proveedores, estados de pago y tendencia de gastos.",
    color: "default" as const,
  },
  {
    id: "budgets",
    label: "Estado de presupuestos",
    icon: FileText,
    prompt: "Analiza los presupuestos: tasa de aprobación, distribución por estado, tiempos medios de conversión y volumen económico.",
    color: "primary" as const,
  },
];

export default function Reports() {
  const { services } = useServices();
  const { operators } = useOperators();
  const { clients } = useClients();
  const { budgets } = useBudgets();
  const { invoices } = usePurchaseInvoices();

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReport, setAiReport] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // ── KPI calculations ──
  const activeServices = services.filter((s) => !["Finalizado", "Liquidado"].includes(s.status)).length;
  const completedServices = services.filter((s) => ["Finalizado", "Liquidado"].includes(s.status)).length;
  const avgNps = services.filter((s) => s.nps != null).length > 0
    ? (services.filter((s) => s.nps != null).reduce((sum, s) => sum + (s.nps || 0), 0) / services.filter((s) => s.nps != null).length).toFixed(1)
    : "—";
  const totalRevenue = budgets
    .filter((b) => ["Aprobado", "Finalizado", "Pte_Facturación"].includes(b.status))
    .reduce((sum, b) => {
      const svc = services.find((s) => s.id === b.serviceId);
      return sum + (svc?.budgetTotal || 0);
    }, 0);
  const totalPurchases = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const activeOperators = operators.filter((o) => o.status === "Activo").length;

  // ── AI generation (streaming) ──
  const generateReport = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setAiReport("");
    setActiveTab("ai-result");

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`;
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Error generando informe");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              setAiReport(fullText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setAiReport(`❌ Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleSendCustomPrompt = () => {
    if (!aiPrompt.trim()) return;
    generateReport(aiPrompt.trim());
  };

  const handleExportReport = () => {
    if (!aiReport) return;
    const blob = new Blob([aiReport], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Status distribution for quick table ──
  const statusCounts: Record<string, number> = {};
  services.forEach((s) => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Informes</h1>
          <p className="text-sm text-muted-foreground">Análisis de datos e informes generados por IA</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Servicios activos" value={activeServices} icon={Wrench} variant="primary" />
        <KpiCard title="Completados" value={completedServices} icon={ClipboardList} variant="success" />
        <KpiCard title="NPS medio" value={avgNps} icon={TrendingUp} variant="info" />
        <KpiCard title="Facturación" value={`${(totalRevenue / 1000).toFixed(1)}k €`} icon={DollarSign} variant="warning" />
        <KpiCard title="Compras" value={`${(totalPurchases / 1000).toFixed(1)}k €`} icon={ShoppingCart} variant="default" />
        <KpiCard title="Operarios activos" value={activeOperators} icon={HardHat} variant="success" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart3 className="w-4 h-4 mr-1.5" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="ai-generate">
            <Sparkles className="w-4 h-4 mr-1.5" />
            Generar con IA
          </TabsTrigger>
          <TabsTrigger value="ai-result" disabled={!aiReport}>
            <FileText className="w-4 h-4 mr-1.5" />
            Informe IA
          </TabsTrigger>
        </TabsList>

        {/* ── Dashboard Tab ── */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Services by status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Servicios por estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Object.entries(statusCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <div key={status} className="flex flex-col items-center p-3 rounded-lg bg-muted/50 border border-border">
                      <span className="text-2xl font-bold text-foreground">{count}</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">{status.replace(/_/g, " ")}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Operator ranking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ranking de operarios</CardTitle>
              <CardDescription>Por servicios completados e ingresos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Operario</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Completados</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Activos</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ingresos</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">NPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operators
                      .filter((o) => o.status === "Activo")
                      .sort((a, b) => b.completedServices - a.completedServices)
                      .slice(0, 10)
                      .map((op) => (
                        <tr key={op.id} className="border-b border-border/50">
                          <td className="py-2 px-3 font-medium text-foreground">{op.name}</td>
                          <td className="py-2 px-3 text-right text-foreground">{op.completedServices}</td>
                          <td className="py-2 px-3 text-right text-foreground">{op.activeServices}</td>
                          <td className="py-2 px-3 text-right text-foreground">{op.totalRevenue.toLocaleString("es-ES", { minimumFractionDigits: 0 })} €</td>
                          <td className="py-2 px-3 text-right text-foreground">{op.npsMean > 0 ? op.npsMean.toFixed(1) : "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  const headers = ["Operario", "Completados", "Activos", "Ingresos", "NPS"];
                  const rows = operators
                    .filter((o) => o.status === "Activo")
                    .sort((a, b) => b.completedServices - a.completedServices)
                    .map((op) => [op.name, String(op.completedServices), String(op.activeServices), String(op.totalRevenue), String(op.npsMean)]);
                  exportCsv("ranking-operarios.csv", headers, rows);
                }}
              >
                <Download className="w-4 h-4 mr-1.5" /> Exportar CSV
              </Button>
            </CardContent>
          </Card>

          {/* Budget status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presupuestos por estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(() => {
                  const budgetStatusCounts: Record<string, number> = {};
                  budgets.forEach((b) => { budgetStatusCounts[b.status] = (budgetStatusCounts[b.status] || 0) + 1; });
                  return Object.entries(budgetStatusCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <div key={status} className="flex flex-col items-center p-3 rounded-lg bg-muted/50 border border-border">
                        <span className="text-2xl font-bold text-foreground">{count}</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">{status.replace(/_/g, " ")}</span>
                      </div>
                    ));
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI Generate Tab ── */}
        <TabsContent value="ai-generate" className="space-y-6">
          {/* Templates */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Informes predefinidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {REPORT_TEMPLATES.map((tpl) => (
                <Card
                  key={tpl.id}
                  className={cn(
                    "cursor-pointer hover:border-primary/40 transition-all hover:shadow-md",
                    isGenerating && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => generateReport(tpl.prompt)}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <tpl.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{tpl.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tpl.prompt}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Informe personalizado
              </CardTitle>
              <CardDescription>Describe qué informe necesitas y la IA lo generará con tus datos reales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Ej: Analiza los servicios del último mes por zona y especialidad, incluyendo tiempos de respuesta..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                disabled={isGenerating}
              />
              <Button onClick={handleSendCustomPrompt} disabled={isGenerating || !aiPrompt.trim()}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
                Generar informe
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI Result Tab ── */}
        <TabsContent value="ai-result">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Informe generado
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </CardTitle>
              {aiReport && !isGenerating && (
                <Button variant="outline" size="sm" onClick={handleExportReport}>
                  <Download className="w-4 h-4 mr-1.5" /> Descargar .md
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {aiReport ? (
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-foreground">
                  {aiReport}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Selecciona un informe predefinido o genera uno personalizado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
