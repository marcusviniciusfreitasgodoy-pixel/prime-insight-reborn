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
  console.log("[Pixel] Lead disparado", params ?? {});
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

/** Wizard de avaliação direta — exibição de cada passo (drop-off). */
export function trackWizardStep(step: 1 | 2 | 3 | 4) {
  safeFbq("trackCustom", `WizardStep${step}`, { step });
}

/** Wizard — estimativa renderizada após loader. */
export function trackWizardEstimateShown(value: number) {
  safeFbq("trackCustom", "WizardEstimateShown", { value, currency: "BRL" });
}

/** Wizard — captura de lead concluída (Google ou manual). */
export function trackWizardLeadCaptured(value: number, method: "google" | "manual") {
  safeFbq("trackCustom", "WizardLeadCaptured", { value, currency: "BRL", method });
}

export {};