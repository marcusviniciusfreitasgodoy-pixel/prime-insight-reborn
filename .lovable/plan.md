
## Objetivo

Criar uma rota dedicada `/avaliacao-direta` para enviar a leads já aquecidos (ex.: vindos de formulário Meta, indicações, WhatsApp). A página pula toda a parte de venda do site público e leva o lead direto ao formulário de avaliação, mantendo identidade visual e rastreamento.

## Como funciona hoje

- `/` e `/avaliacao` renderizam `AvaliacaoPublica.tsx` — página completa com hero, problemas, soluções, prova social, comparações, FAQ e o formulário no meio.
- O componente do formulário (`QuickValuationForm`) e do resultado (`QuickValuationResult`) já existem e são reutilizáveis.

## O que será criado

### 1. Nova página `src/pages/AvaliacaoDireta.tsx`
Layout enxuto, focado em conversão imediata:

- **Topo minimalista**: logo Godoy Prime + selo CRECI/NBR (1 linha de prova institucional)
- **Headline curta** (1 frase): "Avaliação gratuita do seu imóvel com dados oficiais de transações reais"
- **Subheadline** (1 linha): "Preencha em 2 minutos e receba sua estimativa na hora"
- **3 selos rápidos** em linha: dados ITBI oficiais, NBR 14653-2, CRECI ativo
- **Formulário `QuickValuationForm`** já em destaque (sem rolagem)
- **Após submit**: mesmo fluxo de `loading → QuickValuationResult` da página pública (reaproveita lógica de `AvaliacaoPublica`)
- **Rodapé minimalista**: contato (telefone/WhatsApp do `contact.ts`) + link política de privacidade

### 2. Registro da rota em `src/App.tsx`
Adicionar `<Route path="/avaliacao-direta" element={<AvaliacaoDireta />} />` na seção de rotas públicas (lazy load).

### 3. Rastreamento
- Marcar `origem` do lead como `avaliacao_direta` para você diferenciar no admin/Leads
- Manter integração com `useUTMTracking` (UTMs continuam funcionando: `?utm_source=meta_lead&utm_campaign=form_meta`)
- Disparar mesmos eventos do Meta Pixel já configurados

### 4. Memória do projeto
Salvar nova memória `mem://features/avaliacao-direta-route` documentando: propósito, quando usar, diferenças vs `/avaliacao`, e o link sugerido para WhatsApp.

## Fora do escopo

- Não alterar `/` nem `/avaliacao` — elas continuam idênticas para tráfego pago/SEO
- Não criar novo backend ou tabela — reaproveita `leads` com campo `origem`
- Não mexer em design system, cores, ou no `QuickValuationForm`

## Link final para uso

```
https://avaliacao.godoyprime.com.br/avaliacao-direta?utm_source=meta_lead&utm_medium=whatsapp&utm_campaign=form_meta
```

Pronto para colar no WhatsApp do lead que veio do formulário Meta.
