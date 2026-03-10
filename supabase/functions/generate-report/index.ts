import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch relevant data for context
    const [servicesRes, budgetsRes, operatorsRes, clientsRes, purchaseInvoicesRes] = await Promise.all([
      supabase.from("services").select("id, status, specialty, urgency, origin, operator_name, collaborator_name, cluster_id, created_at, scheduled_at, budget_total, nps, real_hours").order("created_at", { ascending: false }).limit(500),
      supabase.from("budgets").select("id, status, service_name, client_name, created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("operators").select("id, name, specialty, completed_services, active_services, total_revenue, nps_mean, status").limit(100),
      supabase.from("clients").select("id, name, last_name, company_name, origin, plan_type, cluster_id, created_at").limit(500),
      supabase.from("purchase_invoices").select("id, invoice_number, supplier_name, total, status, invoice_date").order("created_at", { ascending: false }).limit(200),
    ]);

    const dataContext = JSON.stringify({
      services_count: servicesRes.data?.length || 0,
      services_sample: servicesRes.data?.slice(0, 100),
      budgets_count: budgetsRes.data?.length || 0,
      budgets_sample: budgetsRes.data?.slice(0, 50),
      operators: operatorsRes.data,
      clients_count: clientsRes.data?.length || 0,
      clients_sample: clientsRes.data?.slice(0, 50),
      purchase_invoices_count: purchaseInvoicesRes.data?.length || 0,
      purchase_invoices_sample: purchaseInvoicesRes.data?.slice(0, 50),
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Eres un analista de datos experto para una empresa de gestión de servicios técnicos (fontanería, electricidad, climatización, etc.). 
Genera informes detallados y profesionales en español basados en los datos proporcionados.
Usa formato Markdown con tablas, listas y secciones claras.
Incluye métricas clave, tendencias, recomendaciones y conclusiones accionables.
Si los datos son insuficientes para algún análisis, indícalo claramente.
No inventes datos que no estén en el contexto proporcionado.`,
          },
          {
            role: "user",
            content: `Datos disponibles:\n${dataContext}\n\nSolicitud del usuario: ${prompt}`,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Inténtalo de nuevo en unos minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Añade fondos a tu workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
