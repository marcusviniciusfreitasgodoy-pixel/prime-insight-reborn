import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_WEBHOOK_URL =
  "https://crm-b2b-interface-clone-9bbb1.shrd00.internal.goskip.dev/backend/v1/webhook-external";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const webhookUrl = Deno.env.get("CRM_WEBHOOK_URL") || DEFAULT_WEBHOOK_URL;

    const payload = {
      ...body,
      forwarded_at: new Date().toISOString(),
      origin_app: "godoy-prime-avaliacao",
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(Deno.env.get("CRM_WEBHOOK_API_KEY")
          ? { "X-API-Key": Deno.env.get("CRM_WEBHOOK_API_KEY")! }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text().catch(() => "");
    console.log("[forward-lead-crm]", res.status, text.slice(0, 200));

    return new Response(
      JSON.stringify({ ok: res.ok, status: res.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[forward-lead-crm] error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});