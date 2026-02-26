import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HOLDED_API = "https://api.holded.com/api/invoicing/v1";

interface ServicePayload {
  id: string;
  clientName: string;
  clientId: string;
  address?: string;
  budgetTotal: number | null;
  specialty: string;
  description?: string;
}

interface BudgetLine {
  concept: string;
  description?: string;
  units: number;
  costPrice: number;
  margin: number;
  taxRate: number;
}

interface BudgetPayload {
  id: string;
  serviceId: string;
  clientName: string;
  lines: BudgetLine[];
}

interface RequestBody {
  services: ServicePayload[];
  budgets: BudgetPayload[];
  type?: "invoice" | "proforma"; // default: invoice
  percentage?: number; // e.g. 50 for 50% proforma
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const HOLDED_API_KEY = Deno.env.get("HOLDED_API_KEY");
  if (!HOLDED_API_KEY) {
    return new Response(
      JSON.stringify({ error: "HOLDED_API_KEY no está configurada" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { services, budgets, type = "invoice", percentage } = (await req.json()) as RequestBody;
    const multiplier = percentage ? percentage / 100 : 1;

    if (!services || services.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se enviaron servicios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { serviceId: string; holdedInvoiceId?: string; error?: string }[] = [];

    for (const service of services) {
      try {
        // Find budget for this service
        const budget = budgets.find((b) => b.serviceId === service.id);

        // Build invoice items from budget lines or a single line from budgetTotal
        const items = budget?.lines?.length
          ? budget.lines.map((line) => {
              const salePrice = line.costPrice * (1 + line.margin / 100);
              return {
                name: line.concept,
                desc: line.description || "",
                units: line.units * multiplier,
                subtotal: salePrice * line.units * multiplier,
                tax: line.taxRate,
              };
            })
          : [
              {
                name: `Servicio ${service.id} – ${service.specialty}`,
                desc: service.description || "",
                units: 1,
                subtotal: (service.budgetTotal || 0) * multiplier,
                tax: 21,
              },
            ];

        const docType = type === "proforma" ? "proform" : "invoice";
        const docLabel = type === "proforma" 
          ? `Proforma ${percentage ? `${percentage}%` : ""} – Servicio ${service.id}`
          : `Servicio ${service.id}`;

        // Create invoice in Holded
        const invoiceRes = await fetch(`${HOLDED_API}/documents/${docType}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            key: HOLDED_API_KEY,
          },
          body: JSON.stringify({
            contactName: service.clientName,
            desc: docLabel,
            items,
            notes: `Exportado desde UrbanGO · Servicio: ${service.id}${type === "proforma" ? ` · Proforma ${percentage || 100}%` : ""}`,
          }),
        });

        const invoiceData = await invoiceRes.json();

        if (!invoiceRes.ok) {
          results.push({
            serviceId: service.id,
            error: `Holded API error [${invoiceRes.status}]: ${JSON.stringify(invoiceData)}`,
          });
          continue;
        }

        results.push({
          serviceId: service.id,
          holdedInvoiceId: invoiceData.id,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        results.push({ serviceId: service.id, error: msg });
      }
    }

    const hasErrors = results.some((r) => r.error);

    return new Response(
      JSON.stringify({
        success: !hasErrors,
        results,
        exported: results.filter((r) => !r.error).length,
        failed: results.filter((r) => r.error).length,
      }),
      {
        status: hasErrors ? 207 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Export to Holded failed:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
