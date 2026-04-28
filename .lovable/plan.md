# Remover a seção "Dúvidas Comuns" do FAQ

A página `/avaliacao` exibe um FAQ com 4 categorias. A seção **"Dúvidas Comuns"** (categoria `objecoes`) contém exatamente as 4 perguntas citadas:

- "É só uma estimativa, não é o valor exato, certo?"
- "Por que preciso informar meus dados de contato?"
- "E se eu não concordar com o valor apresentado?"
- "Vocês vão ficar me ligando depois?"

## Mudanças

**Arquivo:** `src/pages/AvaliacaoPublica.tsx`

1. Remover as **4 entradas com `category: "objecoes"`** do array `FAQ_DATA` (linhas 102–105).
2. Remover a entrada `{ key: "objecoes", label: "Dúvidas Comuns", ... }` do array de categorias renderizadas (linha 588).

Resultado: o FAQ continua exibindo as 3 categorias restantes (Como Usar, Confiança e Segurança, Benefícios). Nenhuma outra seção da página é afetada.

## Limpeza opcional

Se os ícones `AlertCircle`, `ThumbsUp`, `MessageCircle` não forem usados em nenhum outro ponto do arquivo após a remoção, removo também os imports não utilizados para manter o código limpo.
