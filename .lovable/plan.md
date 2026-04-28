## Objetivo

Centralizar o telefone de WhatsApp e os textos padrão do Parecer/WhatsApp em UM único arquivo de configuração, para que qualquer alteração futura (número, mensagem padrão, copy do CTA, e-mail) seja feita em um só lugar — sem editar componentes ou edge functions individualmente.

## 1) Novo arquivo central — `src/config/contact.ts`

Fonte única da verdade para o front-end. Estrutura proposta:

```ts
// src/config/contact.ts

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
  // formato internacional sem símbolos (usado em wa.me e tel:)
  e164: "5521964075124",
  // formato exibido ao usuário
  display: "(21) 96407-5124",
  // link tel:
  tel: "tel:+5521964075124",
} as const;

// === Mensagens padrão de WhatsApp ===
// Funções que recebem variáveis e devolvem o texto completo.
// Permitem trocar a copy num só lugar.
export const WHATSAPP_MESSAGES = {
  generico: () =>
    "Olá! Gostaria de mais informações sobre avaliação de imóveis.",

  duvidaAvaliacao: () =>
    "Olá! Tenho dúvidas sobre a avaliação de imóveis.",

  // CTA principal do Parecer (sem dados do lead)
  parecerSimples: () =>
    "Olá! Quero solicitar o Parecer Técnico Godoy Prime para proteger meu patrimônio.",

  // CTA do Parecer com nome do lead (usado no card final navy)
  parecerComNome: (nome: string) =>
    `Olá! Sou ${nome}. Quero falar sobre o Parecer Técnico Godoy Prime.`,

  // CTA do Parecer com dados completos da avaliação (usado no handleRequestParecer)
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

  // Avaliação presencial (ThankYouStep)
  agendarPresencial: () =>
    "Olá! Vim pela avaliação online e gostaria de agendar uma avaliação presencial gratuita.",
} as const;

// === Helpers ===
function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(v);
}

// Constrói uma URL wa.me com mensagem já encodada
export function whatsappUrl(message: string): string {
  return `https://wa.me/${PHONE.e164}?text=${encodeURIComponent(message)}`;
}

// === Copy padrão dos CTAs ===
// Centraliza os rótulos dos botões de Parecer / WhatsApp
export const CTA_LABELS = {
  solicitarParecer: "Solicitar Parecer Técnico",
  solicitarParecerAgora: "Solicitar Parecer Técnico Agora",
  enviando: "Enviando...",
  falarWhatsapp: "Falar no WhatsApp",
  ligar: `Ligar: ${PHONE.display}`,
  whatsappFlutuante: "Contato via WhatsApp",
} as const;
```

## 2) Refatoração dos arquivos que hoje têm telefone/mensagem hardcoded

Substituir todos os literais `5521964075124`, `(21) 96407-5124`, `https://wa.me/...?text=...` e textos padrão pelos imports do novo módulo.

Arquivos a refatorar (todas as ocorrências serão trocadas):

- `src/components/Footer.tsx` — usa `whatsappNumber` local; passa a usar `PHONE` e `whatsappUrl(WHATSAPP_MESSAGES.generico())`.
- `src/components/leads/QuickValuationResult.tsx`
  - `handleRequestParecer`: troca o template literal por `WHATSAPP_MESSAGES.parecerCompleto({...})` + `whatsappUrl(...)`.
  - Bloco navy "última chamada": usa `WHATSAPP_MESSAGES.parecerComNome(data.leadName)`.
  - Botões "Ligar" e labels usam `PHONE.display` e `CTA_LABELS`.
- `src/components/leads/PeritEvaluationSection.tsx`
  - `handleCta` fallback: usa `WHATSAPP_MESSAGES.parecerSimples()` + `whatsappUrl()`.
- `src/components/leads/ThankYouStep.tsx` — usa `WHATSAPP_MESSAGES.agendarPresencial()`.
- `src/components/leads/PublicSofiaAssistant.tsx` — telefone exibido + link WhatsApp flutuante.
- `src/pages/AvaliacaoPublica.tsx` — botão de dúvidas, footer, WhatsApp flutuante, schema `telephone`.
- `src/pages/FAQ.tsx` — todos os links/exibições de telefone.

Total: 7 arquivos do front-end. Nenhuma mudança de comportamento — apenas leitura da config central.

## 3) Edge functions (e-mail / WhatsApp do servidor) — `supabase/functions/_shared/contact.ts`

Edge functions rodam em Deno e não compartilham `src/`. Crio um módulo espelho dedicado:

`supabase/functions/_shared/contact.ts` com as MESMAS constantes/funções (`PHONE`, `BRAND`, `WHATSAPP_MESSAGES`, `whatsappUrl`) usadas em:

- `supabase/functions/send-lead-notification/index.ts` — links `wa.me`, número Z-API destinatário broker (`"5521964075124"` em `phone:`), exibição `(21) 96407-5124`, tel:.
- `supabase/functions/send-followup-email/index.ts` — link do botão e exibição "Prefere ligar?".

> Manter `_shared/` como padrão Supabase para código compartilhado entre functions.
> Função `notify-feedback` usa um número diferente (`5521999880101`) — vou deixar como está e adicionar comentário, OU adicionar um segundo entry `PHONE.feedback` — pergunto na seção de decisões.

## 4) Como o usuário muda o número no futuro

Para trocar o telefone do WhatsApp em TODO o produto (site + e-mails + Z-API destino):

1. Editar `src/config/contact.ts` → campos `PHONE.e164`, `PHONE.display`, `PHONE.tel`.
2. Editar `supabase/functions/_shared/contact.ts` → mesmos campos.

Para mudar a copy padrão de qualquer mensagem de WhatsApp/Parecer:

1. Editar a função correspondente em `WHATSAPP_MESSAGES` (front e/ou shared).

Nenhum componente ou edge function precisa ser tocado.

## Detalhes técnicos

- Tipagem `as const` para autocomplete e segurança.
- `whatsappUrl()` faz `encodeURIComponent` internamente — elimina o risco de esquecer encode.
- Import único nos componentes: `import { PHONE, WHATSAPP_MESSAGES, whatsappUrl, CTA_LABELS } from "@/config/contact";`
- Não altera RLS, schema, secrets nem lógica de negócio.

## Decisão pendente (peço confirmação ao executar)

Sobre o número diferente em `notify-feedback` (`5521999880101`):
- (a) **Deixar isolado** dentro do próprio arquivo (com comentário) — mais simples.
- (b) **Adicionar `PHONE.feedback`** ao módulo central — mais consistente.

Vou seguir com **(b)** para manter tudo num só lugar, salvo objeção sua na hora de aplicar.

## Arquivos criados/alterados

**Criados:**
- `src/config/contact.ts`
- `supabase/functions/_shared/contact.ts`

**Refatorados (sem mudança de comportamento):**
- `src/components/Footer.tsx`
- `src/components/leads/QuickValuationResult.tsx`
- `src/components/leads/PeritEvaluationSection.tsx`
- `src/components/leads/ThankYouStep.tsx`
- `src/components/leads/PublicSofiaAssistant.tsx`
- `src/pages/AvaliacaoPublica.tsx`
- `src/pages/FAQ.tsx`
- `supabase/functions/send-lead-notification/index.ts`
- `supabase/functions/send-followup-email/index.ts`
- `supabase/functions/notify-feedback/index.ts` (se opção b)