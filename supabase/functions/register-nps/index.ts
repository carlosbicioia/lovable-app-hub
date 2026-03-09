import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const body = await req.json();
    const { service_id, nps, signed_by, signature_base64 } = body;

    // Validate inputs
    if (!service_id || typeof service_id !== "string") {
      return new Response(JSON.stringify({ error: "service_id es obligatorio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (nps == null || typeof nps !== "number" || nps < 0 || nps > 10) {
      return new Response(JSON.stringify({ error: "nps debe ser un número entre 0 y 10" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!signed_by || typeof signed_by !== "string" || signed_by.trim().length === 0) {
      return new Response(JSON.stringify({ error: "signed_by es obligatorio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for DB operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch current service
    const { data: service, error: svcErr } = await adminClient
      .from("services")
      .select("id, operator_id, collaborator_id, status")
      .eq("id", service_id)
      .single();

    if (svcErr || !service) {
      return new Response(JSON.stringify({ error: "Servicio no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload signature if provided
    let signatureUrl: string | null = null;
    if (signature_base64 && typeof signature_base64 === "string") {
      const binaryStr = atob(signature_base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const filePath = `signatures/${service_id}_${Date.now()}.png`;
      const { error: uploadErr } = await adminClient.storage
        .from("service-media")
        .upload(filePath, bytes, { contentType: "image/png", upsert: true });

      if (!uploadErr) {
        const { data: urlData } = adminClient.storage
          .from("service-media")
          .getPublicUrl(filePath);
        signatureUrl = urlData.publicUrl;
      }
    }

    // Update service
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      nps,
      signed_by: signed_by.trim(),
      signed_at: now,
    };
    if (signatureUrl) updatePayload.signature_url = signatureUrl;

    const { error: updateErr } = await adminClient
      .from("services")
      .update(updatePayload)
      .eq("id", service_id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: "Error actualizando servicio", details: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Recalculate operator nps_mean
    if (service.operator_id) {
      const { data: opServices } = await adminClient
        .from("services")
        .select("nps")
        .eq("operator_id", service.operator_id)
        .not("nps", "is", null);

      if (opServices && opServices.length > 0) {
        const mean = opServices.reduce((sum, s) => sum + (s.nps ?? 0), 0) / opServices.length;
        await adminClient
          .from("operators")
          .update({ nps_mean: Math.round(mean * 100) / 100 })
          .eq("id", service.operator_id);
      }
    }

    // Recalculate collaborator nps_mean
    if (service.collaborator_id) {
      const { data: collabServices } = await adminClient
        .from("services")
        .select("nps")
        .eq("collaborator_id", service.collaborator_id)
        .not("nps", "is", null);

      if (collabServices && collabServices.length > 0) {
        const mean = collabServices.reduce((sum, s) => sum + (s.nps ?? 0), 0) / collabServices.length;
        await adminClient
          .from("collaborators")
          .update({ nps_mean: Math.round(mean * 100) / 100 })
          .eq("id", service.collaborator_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        service_id,
        nps,
        signed_by: signed_by.trim(),
        signature_url: signatureUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Error interno", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
