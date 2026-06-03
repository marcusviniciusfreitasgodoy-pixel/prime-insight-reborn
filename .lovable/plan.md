
# Wizard de Avaliação Progressiva — `/avaliacao-direta`

Substituir o `QuickValuationForm` monolítico em `/avaliacao-direta` por um wizard de 4 passos com loader contextual e captura progressiva via Google OAuth. Mantém `/avaliacao` intocada para A/B.

## Fluxo

```text
[1 Endereço] → [2 Imóvel] → [3 Detalhes] → [Loader 1.5s] → [4 Resultado + Captura] → QuickValuationResult
```

### Passo 1 — Endereço
- Tipologia (Apartamento / Casa / Cobertura) em botões grandes touch
- Rua/Logradouro com autocomplete via `useStreetSuggestions` (BARRA DA TIJUCA fixo)
- Número (opcional) aparece após escolher a rua
- CTA "Continuar"

### Passo 2 — Imóvel
- Área em m² (input numérico)
- Quartos (NumberStepper ±)
- CTA "Continuar"

### Passo 3 — Detalhes
- Banheiros, Suítes, Vagas, Andar — NumberStepper ±
- Toggles (Switch): Vista Mar, Reformado, Varanda Gourmet
- CTA "Ver minha avaliação"

### Loader contextual (1.5s)
Mensagens em sequência com fade:
1. "Analisando transações recentes na Barra…"
2. "Comparando com imóveis similares…"
3. "Calculando faixa de mercado…"

Durante o loader: chama `get_itbi_stats_filtered` (mesmo RPC do form original), calcula `min/med/max = R$/m² × área`.

### Passo 4 — Resultado + Captura
- **Faixa min / med / max** em destaque + R$/m² + nº de transações
- Mini-barra visual dos 3 valores (reuso do estilo de `QuickValuationResult`)
- **Nota de autoridade:** *"Esta é uma estimativa algorítmica baseada em ITBI. Para imóveis exclusivos, a variação pode chegar a 15%. Deseja uma validação manual do nosso especialista?"*
- **Captura progressiva (lead ainda não salvo):**

```text
┌──────────────────────────────────────────┐
│  [G] Continuar com Google                 │ ← preenche e-mail + nome
├──────────────────────────────────────────┤
│        ou usar outro e-mail               │
│  [ seu@email.com           ]              │
└──────────────────────────────────────────┘
        ↓
   [ WhatsApp (obrigatório)  ]
        ↓ (se Google não trouxe nome)
   [ Nome                    ]
        ↓
   [ Quero o laudo completo do especialista ]  ← CTA primário
```

Submissão → grava em `leads` com `origem = "avaliacao_direta"` (sufixo `_google` quando Google) → renderiza `QuickValuationResult` (componente existente, reuso integral).

## Motor de avaliação — REUSO TOTAL

Sem mudar nada na lógica de cálculo. O wizard só reembala a UX e chama:
- `supabase.rpc("get_itbi_stats_filtered", { p_bairro, p_logradouro, p_uso: "Residencial" })`
- `min/med/max × area_m2` (mesmo cálculo do `QuickValuationForm`)
- Mesma persistência em `valuations` (origin = "public") + `leads` + `send-lead-notification` + `sendLeadToCrm`
- Limite de 2 avaliações por e-mail (`check_lead_exists` + `MAX_FREE_EVALUATIONS`) → reaproveita `LimitExceededScreen`
- Tela final: `QuickValuationResult` (sem alterações)

## Google OAuth — apenas captura

- `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/avaliacao-direta?from=google" })`
- Pacote `@lovable.dev/cloud-auth-js` já instalado (via `configure_social_auth`)
- Antes do redirect: `sessionStorage.setItem("wizard_state", JSON.stringify(formData + estimativa))`
- Ao voltar: lê sessionStorage, restaura wizard no Passo 4, lê `supabase.auth.getSession()` → `user.email` + `user_metadata.full_name`, pré-preenche
- **Não cria perfil próprio do app**, apenas usa os dados verificados
- Fallback transparente: se popup fechar, erro, ou usuário escolher "outro e-mail" → input manual

## Tracking (Meta Pixel) — adicionar em `src/lib/metaPixel.ts`

| Helper | Quando |
|---|---|
| `trackWizardStep(n)` | Cada vez que um passo é exibido (1/2/3/4) |
| `trackWizardEstimateShown(value)` | Loader termina, estimativa renderiza |
| `trackWizardLeadCaptured(value, method)` | Submit do form de captura (Google ou manual) |
| `trackLead` (existente) | Mantido — só dispara em primeiro cadastro elegível |

Permite ver drop-off por passo (inexistente hoje).

## Arquivos

**Novos** (`src/components/leads/wizard/`):
- `ValuationWizard.tsx` — orquestrador, state machine, sessionStorage, OAuth handler, chamada de RPC, submit de lead
- `StepAddress.tsx`
- `StepProperty.tsx`
- `StepDetails.tsx`
- `StepResultCapture.tsx`
- `AnalyzingLoader.tsx` — 1,5s, 3 mensagens em fade
- `NumberStepper.tsx` — botão ± touch ≥ 44×44px
- `GoogleEmailCapture.tsx` — bloco Google + fallback manual + WhatsApp + nome condicional

**Editados:**
- `src/pages/AvaliacaoDireta.tsx` — troca bloco do formulário por `<ValuationWizard origem="avaliacao_direta" />` e mantém Result em Suspense
- `src/lib/metaPixel.ts` — 3 helpers novos (sem mexer no `trackLead`)

**Não tocar:** `QuickValuationForm.tsx`, `QuickValuationResult.tsx`, `AvaliacaoPublica.tsx` (`/avaliacao`), `LeadCaptureForm.tsx`.

## State machine

```text
type WizardStep = "address" | "property" | "details" | "analyzing" | "result"

formData = { logradouro, numero, tipologia, area, quartos,
             banheiros, suites, vagas, andar,
             vistaMar, reformado, varandaGourmet }

estimativa = { itbiData, estimativa: {min,med,max} } | null

capture = { email, nome, telefone, googleVerified }
```

Transições: `next()`, `back()`, `runAnalysis()` (carrega ITBI + transita para `result`), `submitCapture()`.

## Visual / Design system

- Mobile-first, card centralizado `max-w-2xl`
- Progress bar topo (25/50/75/100%) com fill `#C9A84C`
- Cores via classes existentes (`#0C2340` navy / `#C9A84C` gold) — mesmas do form atual
- Spacing máximo 60px entre seções
- Transição entre passos: fade + slide horizontal 250ms
- Toque ≥ 44×44px em todos os steppers e toggles
- Botão "Voltar" discreto (texto + ícone) em todos exceto Passo 1

## Persistência

- `sessionStorage["wizard_state"]` = estado completo para sobreviver ao redirect do Google
- Limpa após submissão bem-sucedida do lead

## Fora de escopo

- Migrar `/avaliacao` para o wizard (após validar conversão aqui)
- Criar conta de usuário própria do app via Google
- Mudanças no schema do banco
- Mudanças no motor de cálculo de valor

## Memória

Atualizar `mem://features/avaliacao-direta-route` para refletir: wizard de 4 passos + loader contextual + Google OAuth de captura + tracking de drop-off + motor ITBI inalterado.
