import { supabase } from "@/integrations/supabase/client";

function getStoredUTM(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem("godoy_prime_utm_params");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function basePayload() {
  return {
    page: typeof window !== "undefined" ? window.location.pathname : "",
    url: typeof window !== "undefined" ? window.location.href : "",
    referrer: typeof document !== "undefined" ? document.referrer || "direct" : "",
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    utm: getStoredUTM(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Forwards a lead (form submission) to the external CRM webhook.
 * Fire-and-forget: never throws, errors only logged.
 */
export function sendLeadToCrm(source: string, lead: Record<string, unknown>) {
  try {
    supabase.functions
      .invoke("forward-lead-crm", {
        body: { event: "lead_form", source, lead, ...basePayload() },
      })
      .catch((err) => console.error("[CRM] lead forward failed:", err));
  } catch (err) {
    console.error("[CRM] lead forward error:", err);
  }
}

/**
 * Forwards a CTA click (e.g. WhatsApp button) to the external CRM webhook.
 * Fire-and-forget: never blocks UX.
 */
export function sendCtaClickToCrm(source: string, extra?: Record<string, unknown>) {
  try {
    supabase.functions
      .invoke("forward-lead-crm", {
        body: { event: "cta_click", source, extra: extra ?? {}, ...basePayload() },
      })
      .catch((err) => console.error("[CRM] cta forward failed:", err));
  } catch (err) {
    console.error("[CRM] cta forward error:", err);
  }
}