/**
 * Configuração central de contato para Edge Functions.
 *
 * ➜ ESTE ARQUIVO ESPELHA `src/config/contact.ts` (front-end).
 *   Sempre que mudar o telefone ou copy de WhatsApp, atualize OS DOIS arquivos.
 *   (Edge functions rodam em Deno e não compartilham `src/`.)
 */

export const BRAND = {
  name: "Godoy Prime",
  responsavel: "Marcus Godoy",
  email: "marcus@godoyprime.com.br",
  creci: "CRECI PJ 11841 RJ | CRECI PF 80199 RJ",
} as const;

export const PHONE = {
  e164: "5521964075124",
  display: "(21) 96407-5124",
  intl: "+55-21-96407-5124",
  tel: "tel:+5521964075124",
  feedback: "5521999880101",
} as const;

export function whatsappUrl(message: string, phoneE164: string = PHONE.e164): string {
  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_MESSAGES = {
  /** Lead acabou de receber a avaliação preliminar (e-mail send-lead-notification). */
  parecerLeadNotification: (nome: string) =>
    `Olá! Sou ${nome}. Acabei de receber minha avaliação preliminar e quero solicitar o Parecer Técnico Completo Godoy Prime.`,

  /** Botão do follow-up email com nome + bairro opcional. */
  parecerFollowup: (nome: string, bairro?: string | null) =>
    `Olá! Sou ${nome}. Fiz uma avaliação preliminar${bairro ? ` no bairro ${bairro}` : ""} e quero solicitar o Parecer Técnico Completo Godoy Prime.`,

  /** Mensagem de feedback (notify-feedback) — usa PHONE.feedback. */
  feedbackConsultoria: (nome: string) =>
    `Olá! Sou ${nome} e completei a pesquisa de validação. Gostaria de agendar minha consultoria gratuita.`,
} as const;