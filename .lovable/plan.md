# Plano: Hero enxuta + remoção do formulário inline

Escopo restrito: apenas a **hero** e a **remoção da seção de formulário** em `src/pages/AvaliacaoPublica.tsx`. Todas as demais seções (Problema, Solução, Personas, Pós-avaliação, FAQ, Footer, etc.) permanecem **intactas**.

## 1. Nova Hero (inspirada na calculadora do Quinto Andar)

Estilo premium clássico alinhado à marca (Navy `#0C2340` + Gold `#C9A84C`):

- Fundo navy com foto da Barra com overlay escuro (manter asset atual).
- **Headline:** "Saiba quanto vale seu imóvel com dados oficiais de transações reais" (com "dados oficiais" em gold).
- **Subcopy:** "Avaliação gratuita em 4 passos. Sem cadastro até ver o resultado."
- **Trust badge** acima do headline: "+80.000 transações oficiais analisadas".
- **Card central de entrada** (substitui o form longo) com:
  - 3 botões grandes de tipo de imóvel: **Apartamento / Casa / Cobertura** (com ícones Lucide).
  - Cada botão navega para `/avaliacao-direta?tipo=apartamento|casa|cobertura`.
  - Microcopy abaixo: "Resultado em menos de 2 minutos. 100% gratuito."
- **Stats compactos** (`HERO_STATS`) em linha logo abaixo do card.
- Botão "Consultar Valor" do header continua → `/avaliacao-direta`.

## 2. Remoção do formulário inline

Remover da página principal (aprox. linhas 347–374) e suas dependências locais não usadas em outras seções:

- Componentes: `QuickValuationForm`, `QuickValuationResult`, `LoadingScreen`.
- Estado: `step`, `valuationData`, `formRef`, `resultRef`.
- Handlers: `handleQuickValuationComplete`, `handleNewValuation`, `scrollToForm`.
- Imports não utilizados: `Search`, `BarChart`, `Sparkles`, `Calculator` (manter os usados em outras seções).
- Manter `weeklySlots` (usado em CTAs das outras seções).

## 3. CTAs do restante da página

Todos os botões que hoje chamam `scrollToForm()` passam a navegar para `/avaliacao-direta` (com `?persona=...` quando aplicável, apenas para analytics). **Nenhuma seção é editada além da troca do handler do botão.**

## 4. Pré-seleção no Wizard

`src/components/valuation/ValuationWizard.tsx`: ler `?tipo=...` na montagem e pré-selecionar o tipo no Step 1. `?persona=...` apenas dispara evento de analytics.

## Arquivos afetados

- `src/pages/AvaliacaoPublica.tsx` — hero reescrita, form removido, CTAs apontando para `/avaliacao-direta`.
- `src/components/valuation/ValuationWizard.tsx` — leitura de `?tipo` para pré-seleção.

## Detalhes técnicos

- Navegação via `useNavigate()` do react-router (já em uso no arquivo).
- Tokens semânticos do design system (`bg-primary`, `text-gold`, etc.) — sem cores hardcoded.
- Tracking Meta Pixel mantido: disparar `Lead` / evento custom no clique dos botões de tipo na hero.
- Sem alterações de schema, RLS ou edge functions.
