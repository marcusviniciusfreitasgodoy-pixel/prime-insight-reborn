

## Diagnóstico: Campo de condomínio bloqueando outros campos

### Causa provável

No `QuickValuationForm.tsx`, o dropdown de sugestões do logradouro tem 3 estados visuais (loading, results, no-results). O div de "nenhum resultado encontrado" (linha 644) **não tem a ref `suggestionsRef` atribuída**, diferente dos outros dois estados. Isso pode causar:

1. O overlay "Nenhum resultado" fica posicionado `absolute z-50` sobre o campo de condomínio abaixo
2. Mesmo após o click-outside handler fechar as sugestões, pode haver timing issues onde o overlay persiste brevemente

### Correção

**Arquivo: `src/components/leads/QuickValuationForm.tsx`**

1. **Adicionar `ref={suggestionsRef}` ao div de "no results"** (linha 644) — garantir que o click-outside handler funcione corretamente para todos os estados do dropdown

2. **Fechar sugestões quando o campo de condomínio recebe foco** — adicionar `onFocus={() => setShowSuggestions(false)}` ao input do condomínio (linha 662) como medida de segurança

3. **Fechar sugestões ao clicar em qualquer outro campo** — simplificar: quando `logradouro` perde o foco (`onBlur`), fechar sugestões com um pequeno delay para permitir cliques nos itens da lista

### Detalhes técnicos

- Linha 644: adicionar `ref={suggestionsRef}` ao div `.absolute.z-50` do estado "no results"
- Linha 662: adicionar `onFocus={() => setShowSuggestions(false)}` ao Input de condomínio
- Opcionalmente, adicionar `onBlur` com delay de 200ms no input do logradouro para fechar sugestões

Alteração em 1 arquivo, sem mudanças no banco de dados.

