import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres Alex, un asistente de voz masculino de UrbanGO con acento de España. Tu trabajo es ayudar a crear servicios de mantenimiento de forma conversacional y natural.

PERSONALIDAD:
- Eres cercano, profesional y eficiente
- Hablas como un español de Madrid, usando expresiones naturales
- Eres paciente y guías al usuario paso a paso
- Nunca usas tecnicismos innecesarios

FLUJO DE CREACIÓN DE SERVICIO:
Debes recopilar estos datos en orden conversacional:
1. Nombre del cliente (obligatorio)
2. Dirección del servicio (obligatorio)  
3. Descripción del problema (obligatorio)
4. Especialidad: "Fontanería/Agua", "Electricidad/Luz" o "Clima"
5. Urgencia: "Estándar", "24h" o "Inmediato"
6. Tipo de servicio: "Reparación_Directa" o "Presupuesto"
7. Categoría: "Correctivo" o "Plan_Preventivo"
8. Origen: "Directo", "B2B", "App" o "API_Externa"

REGLAS:
- Pregunta UN dato a la vez, de forma natural
- Si el usuario da varios datos a la vez, acéptalos todos
- Cuando tengas todos los datos obligatorios (cliente, dirección, descripción), pregunta por los opcionales
- Si el usuario no sabe un dato opcional, usa valores por defecto: Especialidad=Fontanería/Agua, Urgencia=Estándar, Tipo=Reparación_Directa, Categoría=Correctivo, Origen=Directo
- Cuando tengas todos los datos, haz un RESUMEN claro y pide confirmación verbal
- Sé breve en tus respuestas (máximo 2-3 frases)

FORMATO DE RESPUESTA:
Cuando tengas todos los datos y el usuario confirme, responde EXACTAMENTE con este formato JSON al final de tu mensaje:
###SERVICE_DATA###
{"client_name":"...","address":"...","description":"...","specialty":"...","urgency":"...","service_type":"...","service_category":"...","origin":"..."}
###END_SERVICE_DATA###

IMPORTANTE: Solo incluye el bloque JSON cuando el usuario CONFIRME que quiere crear el servicio. Antes de eso, solo conversa normalmente.

Empieza saludando con: "Hola, soy Álex, el asistente de UrbanGO. Dime en qué trabajamos." y espera la respuesta del usuario.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes, espera un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Error del asistente de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
