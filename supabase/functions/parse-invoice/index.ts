import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { pdfBase64, mimeType } = await req.json();
    if (!pdfBase64) throw new Error("No PDF data provided");

    const systemPrompt = `Eres un experto en lectura de facturas de proveedores españoles. Analiza la imagen de la factura y extrae todos los datos estructurados. 
Responde SOLO usando la función extract_invoice_data.
Si no puedes leer algún campo, déjalo vacío o null. Los importes deben ser numéricos sin símbolo de moneda.
La fecha debe estar en formato YYYY-MM-DD.
El tax_rate es el porcentaje de IVA (ej: 21 para 21%).`;

    const userContent = [
      {
        type: "text" as const,
        text: "Extrae todos los datos de esta factura de proveedor.",
      },
      {
        type: "image_url" as const,
        image_url: {
          url: `data:${mimeType || "application/pdf"};base64,${pdfBase64}`,
        },
      },
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_invoice_data",
                description:
                  "Extract structured data from a supplier invoice PDF.",
                parameters: {
                  type: "object",
                  properties: {
                    invoice_number: {
                      type: "string",
                      description: "Número de factura",
                    },
                    invoice_date: {
                      type: "string",
                      description: "Fecha de la factura en formato YYYY-MM-DD",
                    },
                    due_date: {
                      type: "string",
                      description:
                        "Fecha de vencimiento en formato YYYY-MM-DD, null si no aparece",
                    },
                    supplier_name: {
                      type: "string",
                      description: "Nombre o razón social del proveedor",
                    },
                    supplier_tax_id: {
                      type: "string",
                      description: "CIF/NIF del proveedor",
                    },
                    subtotal: {
                      type: "number",
                      description: "Base imponible total",
                    },
                    tax_rate: {
                      type: "number",
                      description: "Porcentaje de IVA principal (ej: 21)",
                    },
                    tax_amount: {
                      type: "number",
                      description: "Importe total del IVA",
                    },
                    total: {
                      type: "number",
                      description: "Importe total de la factura con IVA",
                    },
                    lines: {
                      type: "array",
                      description: "Líneas de detalle de la factura",
                      items: {
                        type: "object",
                        properties: {
                          description: {
                            type: "string",
                            description: "Descripción del concepto/artículo",
                          },
                          units: { type: "number", description: "Cantidad" },
                          unit_price: {
                            type: "number",
                            description: "Precio unitario sin IVA",
                          },
                          tax_rate: {
                            type: "number",
                            description: "Porcentaje de IVA de esta línea",
                          },
                          total: {
                            type: "number",
                            description:
                              "Total de la línea (units * unit_price)",
                          },
                        },
                        required: ["description", "units", "unit_price", "total"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: [
                    "invoice_number",
                    "supplier_name",
                    "subtotal",
                    "tax_rate",
                    "tax_amount",
                    "total",
                    "lines",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_invoice_data" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de peticiones excedido, inténtalo de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados. Añade créditos en la configuración del workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Error del servicio de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "No se pudieron extraer datos de la factura" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-invoice error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
