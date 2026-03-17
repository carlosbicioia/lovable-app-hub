import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SLACK_API_KEY = Deno.env.get("SLACK_API_KEY");
    if (!SLACK_API_KEY) throw new Error("SLACK_API_KEY is not configured");

    const { channel, text, event_key, username, icon_emoji } = await req.json();

    if (!channel || !text) {
      return new Response(
        JSON.stringify({ error: "channel and text are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If event_key is provided, check if slack is enabled for this event
    if (event_key) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: setting } = await supabase
        .from("notification_settings")
        .select("slack_enabled")
        .eq("event_key", event_key)
        .single();

      if (!setting?.slack_enabled) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "Slack disabled for this event" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Resolve channel name to ID if needed
    let channelId = channel;
    if (!channel.startsWith("C") && !channel.startsWith("D") && !channel.startsWith("G")) {
      const cleanName = channel.replace(/^#/, "");
      const listRes = await fetch(`${GATEWAY_URL}/conversations.list?types=public_channel&limit=200`, {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": SLACK_API_KEY,
        },
      });
      const listData = await listRes.json();
      const found = (listData.channels || []).find((c: any) => c.name === cleanName);
      if (!found) throw new Error(`Channel "${cleanName}" not found in Slack workspace`);
      channelId = found.id;
    }

    // Join the channel first (idempotent)
    await fetch(`${GATEWAY_URL}/conversations.join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": SLACK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: channelId }),
    });

    const response = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": SLACK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: channelId,
        text,
        username: username || "UrbanGo",
        icon_emoji: icon_emoji || ":wrench:",
      }),
    });

    const data = await response.json();
    console.log("Slack API response:", JSON.stringify(data));
    
    if (!response.ok || data.ok === false) {
      throw new Error(`Slack API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(
      JSON.stringify({ success: true, ts: data.ts, channel: data.channel }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending Slack notification:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
