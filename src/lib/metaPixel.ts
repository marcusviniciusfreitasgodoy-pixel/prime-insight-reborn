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

const PIXEL_MAIN = "858164903276236";
const PIXEL_SECONDARY = "1306687940478470";

/** Conversão qualificada — usar APENAS após insert bem-sucedido em `leads`. */
export function trackLead(params?: Record<string, unknown>) {
  console.log("[Pixel] Lead disparado", params ?? {});
  // fbq('track') dispararia em TODOS os pixels inicializados (duplicaria o
  // Lead no pixel secundário). trackSingle entrega o evento uma única vez
  // por pixel: comportamento idêntico no pixel 858, espelhado no 130.
  safeFbq("trackSingle", PIXEL_MAIN, "Lead", params ?? {});
  safeFbq(
    "trackSingle",
    PIXEL_SECONDARY,
    "Lead",
    { ...(params ?? {}), content_name: "AvaliacaoConcluida" },
  );
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

/**
 * Funil R8 — eventos nomeados por passo CONCLUÍDO, disparados SOMENTE no
 * pixel secundário 1306687940478470 via trackSingleCustom:
 * Passo1_Objetivo, Passo2_Tipo, Passo3_Dados, Resultado_Visto.
 * O evento padrão "Lead" continua restrito ao envio efetivo do contato
 * (trackLead abaixo já entrega via trackSingle nos dois pixels).
 */
export type FunnelStepEvent =
  | "Passo1_Objetivo"
  | "Passo2_Tipo"
  | "Passo3_Dados"
  | "Resultado_Visto";

export function trackFunnelStep(
  name: FunnelStepEvent,
  params?: Record<string, unknown>,
) {
  safeFbq("trackSingleCustom", PIXEL_SECONDARY, name, params ?? {});
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