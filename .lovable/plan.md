

# Adicionar segundo Meta Pixel (ID 1664451094966530)

## O que será feito

Adicionar o novo pixel Meta ao lado do existente, para que ambos disparem eventos simultaneamente.

## Alterações

### 1. index.html — Adicionar segundo `fbq('init')` e noscript

- Dentro do script existente, adicionar `fbq('init', '1664451094966530');` logo abaixo do init atual
- Adicionar uma segunda tag `<noscript>` com o novo pixel ID no body

### 2. src/utils/metaPixel.ts — Atualizar comentário

- Atualizar o comentário no topo do arquivo para refletir que agora existem dois Pixel IDs: `926436730063639` e `1664451094966530`
- Nenhuma alteração de código é necessária — a biblioteca `fbq` dispara eventos automaticamente para todos os pixels inicializados com `fbq('init', ...)`

## Detalhes técnicos

O SDK do Meta Pixel suporta nativamente múltiplos pixels. Ao chamar `fbq('init', 'ID')` duas vezes com IDs diferentes, todos os eventos subsequentes (`fbq('track', ...)` e `fbq('trackCustom', ...)`) são enviados para ambos os pixels automaticamente. Não é necessário alterar nenhuma das funções de tracking existentes.

```text
index.html (head):
  fbq('init', '926436730063639');   // pixel existente
  fbq('init', '1664451094966530');  // novo pixel
  fbq('track', 'PageView');

index.html (body):
  <noscript> ... id=926436730063639 ... </noscript>   // existente
  <noscript> ... id=1664451094966530 ... </noscript>  // novo
```

## Impacto

- Zero impacto em funcionalidade existente
- Todos os eventos de conversão (leads, avaliações, WhatsApp, PDF) serão enviados para ambos os pixels
- Nenhuma alteração em componentes React
