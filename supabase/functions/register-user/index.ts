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

  const callerId = caller.id;

  // Check admin role using service role client
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: roleCheck } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleCheck) {
    return errorResponse("Solo los administradores pueden registrar usuarios", 403);
  }

  // ── Parse & validate input ──
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse("JSON inválido", 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = typeof body.role === "string" ? body.role : "operario";
  const collaboratorId = typeof body.collaborator_id === "string" ? body.collaborator_id : null;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 255) {
    return errorResponse("Email inválido", 400);
  }

  // Validate name
  if (!fullName || fullName.length < 2 || fullName.length > 100) {
    return errorResponse("Nombre debe tener entre 2 y 100 caracteres", 400);
  }

  // Validate password
  if (password.length < 8 || password.length > 72) {
    return errorResponse("La contraseña debe tener entre 8 y 72 caracteres", 400);
  }
  if (!/[A-Z]/.test(password)) {
    return errorResponse("La contraseña debe contener al menos una mayúscula", 400);
  }
  if (!/[0-9]/.test(password)) {
    return errorResponse("La contraseña debe contener al menos un número", 400);
  }

  // Validate role
  const validRoles = ["admin", "gestor", "operario", "colaborador", "lectura"];
  if (!validRoles.includes(role)) {
    return errorResponse(`Rol inválido. Opciones: ${validRoles.join(", ")}`, 400);
  }

  // ── Create user with service role ──
  const { data: newUser, error: createErr } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr) {
    const msg = createErr.message.includes("already been registered")
      ? "Este email ya está registrado"
      : createErr.message;
    return errorResponse(msg, 422);
  }

  // ── Assign role ──
  const roleInsert: Record<string, unknown> = {
    user_id: newUser.user.id,
    role,
  };
  if (role === "colaborador" && collaboratorId) {
    roleInsert.collaborator_id = collaboratorId;
  }
  const { error: roleErr } = await serviceClient.from("user_roles").insert(roleInsert);

  if (roleErr) {
    console.error("Role assignment error:", roleErr);
    // User was created but role failed — still report success with warning
    return new Response(
      JSON.stringify({
        user: { id: newUser.user.id, email: newUser.user.email },
        warning: "Usuario creado pero no se pudo asignar el rol. Asígnalo manualmente.",
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Also create app_users entry ──
  await serviceClient.from("app_users").insert({
    name: fullName,
    email,
    role,
    active: true,
  });

  return new Response(
    JSON.stringify({
      user: { id: newUser.user.id, email: newUser.user.email },
      role,
      message: "Usuario registrado correctamente",
    }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
