import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DATEAHOME_WEBHOOK_URL =
  Deno.env.get("DATEAHOME_WEBHOOK_URL") ||
  "https://api.dateahome.com/webhook/lead/b00e8651-dd31-41fc-a0f0-32a06044f3ee";

// Extracts DDD (2 digits) and the remaining phone number from a Brazilian phone string.
function splitPhone(raw: unknown): { ddd: string; phone: string } {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length >= 10) {
    return { ddd: digits.slice(0, 2), phone: digits.slice(2) };
  }
  return { ddd: "", phone: digits };
}

function buildLeadOrigin(body: Record<string, unknown>): string {
  const source = (body.source as string) || "Site Godoy Prime";
  const utm = (body.utm as Record<string, unknown>) || {};
  const utmSource = utm.utm_source ? ` · ${utm.utm_source}` : "";
  const utmCampaign = utm.utm_campaign ? ` / ${utm.utm_campaign}` : "";
  return `Godoy Prime - ${source}${utmSource}${utmCampaign}`;
}

function buildMessage(body: Record<string, unknown>): string {
  const lead = (body.lead as Record<string, unknown>) || {};
  const lines: string[] = [];
  if (lead.bairro) lines.push(`Bairro: ${lead.bairro}`);
  if (lead.logradouro) lines.push(`Logradouro: ${lead.logradouro}${lead.numero ? ", " + lead.numero : ""}`);
  if (lead.tipologia) lines.push(`Tipologia: ${lead.tipologia}`);
  if (lead.area_m2 || lead.area) lines.push(`Área: ${lead.area_m2 ?? lead.area} m²`);
  if (lead.quartos) lines.push(`Quartos: ${lead.quartos}`);
  if (lead.suites) lines.push(`Suítes: ${lead.suites}`);
  if (lead.vagas) lines.push(`Vagas: ${lead.vagas}`);
  if (lead.diferenciais) lines.push(`Diferenciais: ${lead.diferenciais}`);
  if (lead.estimativa_min && lead.estimativa_max) {
    const fmt = (v: unknown) =>
      typeof v === "number"
        ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
        : String(v);
    lines.push(
      `Estimativa: ${fmt(lead.estimativa_min)} – ${fmt(lead.estimativa_med)} – ${fmt(lead.estimativa_max)}`,
    );
  }
  if (body.event === "cta_click") {
    lines.unshift(`Clique em CTA: ${body.source ?? ""}`);
  }
  if (body.url) lines.push(`URL: ${body.url}`);
  return lines.join("\n") || "Lead capturado via site Godoy Prime";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("DATEAHOME_API_KEY");
  if (!apiKey) {
    console.error("[forward-lead-crm] DATEAHOME_API_KEY not configured");
    return new Response(
      JSON.stringify({ ok: false, error: "missing_api_key" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const lead = (body.lead as Record<string, unknown>) || {};
    const name = (lead.nome as string) || (lead.name as string) || "Lead sem nome";
    const email = (lead.email as string) || "";
    const { ddd, phone } = splitPhone(lead.telefone ?? lead.phone);

    const payload = {
      leadOrigin: buildLeadOrigin(body),
      name,
      email,
      ddd,
      phone,
      message: buildMessage(body),
    };

    const res = await fetch(DATEAHOME_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text().catch(() => "");
    console.log("[forward-lead-crm]", res.status, text.slice(0, 300));

    return new Response(
      JSON.stringify({ ok: res.ok, status: res.status, response: text.slice(0, 300) }),
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