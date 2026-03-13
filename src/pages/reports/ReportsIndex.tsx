import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench, HardHat, DollarSign, Users, ShoppingCart, FileText,
  Sparkles, Send, Loader2, Download, ArrowRight, Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const REPORT_SECTIONS = [
  {
    id: "servicios",
    label: "Servicios",
    description: "Distribución por estado, especialidad, urgencia, tiempos y tendencias",
    icon: Wrench,
    path: "/informes/servicios",
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/10 text-primary",
  },
  {
    id: "operarios",
    label: "Operarios",
    description: "Rendimiento, NPS, servicios completados, ingresos y ranking",
    icon: HardHat,
    path: "/informes/operarios",
    gradient: "from-success/20 to-success/5",
    iconBg: "bg-success/10 text-success",
  },
  {
    id: "financiero",
    label: "Financiero",
    description: "Presupuestos, facturación, costes, márgenes y evolución temporal",
    icon: DollarSign,
    path: "/informes/financiero",
    gradient: "from-warning/20 to-warning/5",
    iconBg: "bg-warning/10 text-warning",
    adminOnly: true,
  },
  {
    id: "clientes",
    label: "Clientes",
    description: "Cartera, origen, tipo de plan, distribución geográfica y recurrencia",
    icon: Users,
    path: "/informes/clientes",
    gradient: "from-info/20 to-info/5",
    iconBg: "bg-info/10 text-info",
  },
  {
    id: "compras",
    label: "Compras y proveedores",
    description: "Facturas, principales proveedores, estados de pago y tendencia",
    icon: ShoppingCart,
    path: "/informes/compras",
    gradient: "from-chart-5/20 to-chart-5/5",
    iconBg: "bg-destructive/10 text-destructive",
  },
  {
    id: "presupuestos",
    label: "Presupuestos",
    description: "Tasa de aprobación, distribución por estado y volumen económico",
    icon: FileText,
    path: "/informes/presupuestos",
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/10 text-primary",
  },
];

export default function ReportsIndex() {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const isAdminOrGestor = isAdmin || roles.includes("gestor");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReport, setAiReport] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    setAiReport("");
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt }),
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Error generando informe");
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", full = "";
      let done = false;
      while (!done) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buf += decoder.decode(chunk.value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const c = JSON.parse(json).choices?.[0]?.delta?.content;
            if (c) { full += c; setAiReport(full); }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e: any) {
      setAiReport(`❌ Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleExport = () => {
    if (!aiReport) return;
    const blob = new Blob([aiReport], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `informe-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Informes</h1>
        <p className="text-sm text-muted-foreground">Selecciona un informe detallado o genera uno personalizado con IA</p>
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_SECTIONS
          .filter((r) => !(r as any).adminOnly || isAdmin)
          .map((r) => (
          <Card
            key={r.id}
            className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30 overflow-hidden"
            onClick={() => navigate(r.path)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${r.iconBg} shrink-0`}>
                  <r.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{r.label}</h3>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Custom report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Informe personalizado con IA
          </CardTitle>
          <CardDescription>Describe qué informe necesitas y la IA lo generará con tus datos reales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ej: Analiza los servicios del último mes por zona y especialidad, incluyendo tiempos de respuesta..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={3}
            disabled={isGenerating}
          />
          <div className="flex gap-2">
            <Button onClick={() => { if (aiPrompt.trim()) generateReport(aiPrompt.trim()); }} disabled={isGenerating || !aiPrompt.trim()}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
              Generar informe
            </Button>
            {aiReport && !isGenerating && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1.5" /> Descargar .md
              </Button>
            )}
          </div>
          {aiReport && (
            <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-foreground">
                {aiReport}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
