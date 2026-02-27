import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  // ── Auth: verify caller is admin ──
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("No autorizado", 401);
  }

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user: caller }, error: userErr } = await anonClient.auth.getUser();
  if (userErr || !caller) {
    return errorResponse("Token inválido", 401);
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: roleCheck } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleCheck) {
    return errorResponse("Solo los administradores pueden gestionar usuarios", 403);
  }

  // ── Parse body ──
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("JSON inválido", 400);
  }

  const action = body.action as string;
  const targetUserId = body.user_id as string;

  if (!targetUserId || typeof targetUserId !== "string") {
    return errorResponse("user_id requerido", 400);
  }

  // Prevent self-modification
  if (targetUserId === caller.id) {
    return errorResponse("No puedes modificar tu propio usuario", 400);
  }

  switch (action) {
    case "ban": {
      const { error } = await serviceClient.auth.admin.updateUserById(targetUserId, {
        ban_duration: "876000h",
      });
      if (error) return errorResponse(error.message, 422);
      const { data: profile } = await serviceClient.from("profiles").select("email").eq("id", targetUserId).maybeSingle();
      if (profile?.email) {
        await serviceClient.from("app_users").update({ active: false }).eq("email", profile.email);
      }
      return jsonResponse({ message: "Usuario desactivado" });
    }

    case "unban": {
      const { error } = await serviceClient.auth.admin.updateUserById(targetUserId, {
        ban_duration: "none",
      });
      if (error) return errorResponse(error.message, 422);
      const { data: profile2 } = await serviceClient.from("profiles").select("email").eq("id", targetUserId).maybeSingle();
      if (profile2?.email) {
        await serviceClient.from("app_users").update({ active: true }).eq("email", profile2.email);
      }
      return jsonResponse({ message: "Usuario reactivado" });
    }

    case "reset_password": {
      // Get user email
      const { data: profile3 } = await serviceClient.from("profiles").select("email").eq("id", targetUserId).maybeSingle();
      if (!profile3?.email) return errorResponse("No se encontró el email del usuario", 404);

      // Generate a new random password
      const newPassword = body.new_password as string | undefined;
      if (!newPassword || newPassword.length < 8) {
        return errorResponse("Se requiere una contraseña de al menos 8 caracteres", 400);
      }

      const { error } = await serviceClient.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      });
      if (error) return errorResponse(error.message, 422);

      return jsonResponse({ message: `Contraseña actualizada. Comunica la nueva contraseña al usuario: ${profile3.email}` });
    }

    case "delete": {
      const { error } = await serviceClient.auth.admin.deleteUser(targetUserId);
      if (error) return errorResponse(error.message, 422);
      await serviceClient.from("app_users").delete().eq("email",
        (await serviceClient.from("profiles").select("email").eq("id", targetUserId).maybeSingle())?.data?.email ?? ""
      );
      return jsonResponse({ message: "Usuario eliminado permanentemente" });
    }

    default:
      return errorResponse("Acción inválida. Opciones: ban, unban, reset_password, delete", 400);
  }
});
