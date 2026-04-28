## Objetivo

Adicionar CTAs em todos os cards de oferta da página de resposta da avaliação e inserir um novo bloco de fechamento (segundo CTA do Parecer) ao final da página.

## 1) CTA em cada card de oferta — `src/components/leads/PeritEvaluationSection.tsx`

Para que o componente possa disparar a mesma ação de "Solicitar Parecer" usada no `QuickValuationResult`, vou:

- Estender `PeritEvaluationSectionProps` com dois novos campos opcionais: `onRequestParecer?: () => void` e `isRequesting?: boolean`.
- Em `QuickValuationResult.tsx`, passar `onRequestParecer={handleRequestParecer}` e `isRequesting={isRequesting}` para `<PeritEvaluationSection />`.
- Definir um helper interno `handleCta()` que usa `onRequestParecer` quando disponível, com fallback para `wa.me/5521964075124` com mensagem pré-preenchida.

### Cards que receberão CTA

**a) Cards do Grid "Parecer Godoy Prime: Seu Escudo Técnico" (4 cards de entrega)**
- Adicionar um pequeno botão `link/ghost` em cada card: "Quero esta análise →" que dispara `handleCta()`.
- Estilo: texto pequeno (text-xs), cor `accent` (gold), alinhado à direita do bloco, com ícone `ArrowRight`. Para não poluir, será um link, não um botão sólido.

**b) Cards de Credibilidade Institucional (3 cards "Por Que Confiar")**
- Adicionar um único CTA centralizado **logo abaixo** do grid (não um por card, pois esses cards são de prova social, não de oferta) — botão outline gold "Solicitar Parecer com Marcus Godoy".

**c) Cards "Garantia Dupla" (2 cards verdes)**
- Adicionar um único CTA centralizado abaixo do grid: "Solicitar Parecer com Garantia Total" (botão verde para combinar com o tema da seção).

**d) Bloco "Investimento" (card gold/accent)**
- Adicionar dentro do card um botão primário "Quero proteger meu patrimônio agora" abaixo do bloco de ROI, disparando `handleCta()`.

**e) Bloco "Prime Buyer Experience" (card navy)**
- Já tem o botão "Conhecer Prime Buyer Experience". Adicionar um **segundo** botão acima dele em ouro sólido: "Começar pelo Parecer Técnico" — para quem não quer a representação completa mas quer iniciar a relação.

## 2) Novo bloco de fechamento — `src/components/leads/QuickValuationResult.tsx`

Adicionar um **segundo bloco de CTA** depois do card dourado existente (linhas ~499-544) e antes do rodapé discreto (~547).

### Estilo do novo bloco
- Background: navy (`#0C2340`) para contrastar com o gold do CTA anterior.
- Headline: "Última chamada: garanta seu Parecer Técnico antes de fechar negócio"
- Subheadline curta: "Mais de R$ 180-450 mil em economia média por imóvel analisado. Investimento a partir de R$ 4.900."
- Dois botões lado a lado:
  - Primário gold: "Solicitar Parecer Técnico Agora" → `handleRequestParecer`
  - Secundário outline branco: "Falar no WhatsApp" → abre `wa.me/5521964075124` com mensagem
- Trust signals em linha: "🛡️ Garantia 100% • ⚡ Resposta em 2h • 📋 Sem compromisso"
- Só renderizar quando `!parecerRequested`.

```text
┌─────────────────────────────────────────────┐
│ [Card dourado existente — Próximo Passo]    │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐ ← NOVO
│ NAVY BG                                     │
│ Última chamada: garanta seu Parecer ...     │
│ [Solicitar Parecer]  [WhatsApp]             │
│ 🛡️ Garantia • ⚡ 2h • 📋 Sem compromisso    │
└─────────────────────────────────────────────┘
  ← Voltar e fazer nova consulta (rodapé)
```

## Arquivos alterados

- `src/components/leads/PeritEvaluationSection.tsx` — props novas + CTAs em todos os cards de oferta
- `src/components/leads/QuickValuationResult.tsx` — passar handler para `PeritEvaluationSection` + novo bloco navy de fechamento

## Não muda

- Lógica de `handleRequestParecer` (já existente)
- Banco, RLS, edge functions
- FAQ e demais seções não relacionadas a oferta