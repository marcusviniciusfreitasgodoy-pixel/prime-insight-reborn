/**
 * Configuração central de contato (telefone, WhatsApp, copy padrão).
 *
 * ➜ Para trocar o número de WhatsApp em TODO o site, edite SOMENTE este arquivo
 *   (e o espelho `supabase/functions/_shared/contact.ts` para os e-mails).
 * ➜ Para mudar a copy padrão de qualquer mensagem ou rótulo de CTA, edite
 *   `WHATSAPP_MESSAGES` ou `CTA_LABELS`.
 */

// === Identidade ===
export const BRAND = {
  name: "Godoy Prime",
  responsavel: "Marcus Godoy",
  email: "marcus@godoyprime.com.br",
  creci: "CRECI PJ 11841 RJ | CRECI PF 80199 RJ",
} as const;

// === Telefone / WhatsApp ===
// Mude SOMENTE aqui para trocar o número em todo o site.
export const PHONE = {
  // formato internacional sem símbolos (usado em wa.me)
  e164: "5521964075124",
  // formato exibido ao usuário
  display: "(21) 96407-5124",
  // schema E.164 internacional para meta tags / structured data
  intl: "+55-21-96407-5124",
  // link tel:
  tel: "tel:+5521964075124",
  // número alternativo usado em fluxos de feedback (notify-feedback)
  feedback: "5521999880101",
} as const;

// === Helpers ===
function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

/** Constrói uma URL wa.me com mensagem já encodada. */
export function whatsappUrl(message: string, phoneE164: string = PHONE.e164): string {
  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`;
}

// === Mensagens padrão de WhatsApp ===
// Funções que recebem variáveis e devolvem o texto completo.
export const WHATSAPP_MESSAGES = {
  /** Mensagem genérica do botão flutuante / footer. */
  generico: () => "Olá! Gostaria de mais informações sobre avaliação de imóveis.",

  /** Mensagem para botão "tenho dúvidas" da página pública. */
  duvidaAvaliacao: () => "Olá! Tenho dúvidas sobre a avaliação de imóveis.",

  /** CTA principal do Parecer (sem dados do lead). */
  parecerSimples: () =>
    "Olá! Quero solicitar o Parecer Técnico Godoy Prime para proteger meu patrimônio.",

  /** CTA do Parecer com nome do lead (card final navy). */
  parecerComNome: (nome: string) =>
    `Olá! Sou ${nome}. Quero falar sobre o Parecer Técnico Godoy Prime.`,

  /** CTA do Parecer com dados completos da avaliação. */
  parecerCompleto: (p: {
    nome: string;
    tipologia: string;
    area: number;
    bairro: string;
    estimativaMin: number;
    estimativaMax: number;
    telefone: string;
    email: string;
  }) =>
    `Olá! Sou ${p.nome}.\n\nQuero solicitar meu Parecer Técnico Godoy Prime para proteger meu patrimônio.\n\nImóvel analisado: ${p.tipologia} de ${p.area}m² em ${p.bairro}\nEstimativa Preliminar: ${formatBRL(p.estimativaMin)} a ${formatBRL(p.estimativaMax)}\n\nMeu WhatsApp: ${p.telefone}\nMeu email: ${p.email}`,

  /** Avaliação presencial (ThankYouStep). */
  agendarPresencial: () =>
    "Olá! Vim pela avaliação online e gostaria de agendar uma avaliação presencial gratuita.",

  /** Laudo completo direto via WhatsApp a partir do resultado preliminar (/avaliacao-direta). */
  laudoCompletoDireto: (p?: {
    bairro?: string;
    tipologia?: string;
    area?: number;
    estimativaMed?: number;
  }) => {
    const detalhes = [
      p?.tipologia && `${p.tipologia}`,
      p?.area && `${p.area}m²`,
      p?.bairro && `em ${p.bairro}`,
    ]
      .filter(Boolean)
      .join(" ");
    const linhaEst =
      p?.estimativaMed && p.estimativaMed > 0
        ? `\nEstimativa preliminar: ${formatBRL(p.estimativaMed)}`
        : "";
    return `Olá! Acabei de fazer a avaliação online${
      detalhes ? ` (${detalhes})` : ""
    }.${linhaEst}\n\nQuero receber o laudo completo do especialista por aqui.`;
  },
} as const;

// === Rótulos / copy dos CTAs ===
export const CTA_LABELS = {
  solicitarParecer: "Solicitar Parecer Técnico",
  solicitarParecerAgora: "Solicitar Parecer Técnico Agora",
  enviando: "Enviando...",
  falarWhatsapp: "Falar no WhatsApp",
  ligarComNumero: `Ligar: ${PHONE.display}`,
  whatsappFlutuanteAria: "Contato via WhatsApp",
} as const;