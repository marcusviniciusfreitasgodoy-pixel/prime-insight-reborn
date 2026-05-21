/**
 * Wrapper do Meta Pixel.
 *
 * Política: o evento padrão "Lead" só pode ser disparado em conversões
 * qualificadas (submit completo de formulário). Cliques em CTA (WhatsApp,
 * Parecer, etc.) devem usar `trackCtaClick` (evento custom) para não inflar
 * a métrica de Lead no Gerenciador de Anúncios.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function safeFbq(...args: unknown[]) {
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq(...args);
    }
  } catch (err) {
    console.warn("[MetaPixel] fbq error:", err);
  }
}

/** Conversão qualificada — usar APENAS após insert bem-sucedido em `leads`. */
export function trackLead(params?: Record<string, unknown>) {
  safeFbq("track", "Lead", params ?? {});
}

/** Clique em CTA / intenção de contato — NÃO é Lead. */
export function trackCtaClick(
  name: "ClickWhatsApp" | "ClickParecer" | "ClickCalendly" | string,
  params?: Record<string, unknown>,
) {
  safeFbq("trackCustom", name, params ?? {});
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  safeFbq("trackCustom", name, params ?? {});
}

export {};