

## Diagnóstico: Formulário não responde a interação

### Problema identificado

Analisando o session replay e o código, identifiquei que o container do campo "Endereço" (logradouro) na linha 544 tem `className="space-y-2 relative"`. Os dropdowns de sugestões dentro dele usam `position: absolute; z-index: 50`. Mesmo quando os dropdowns não estão visíveis (condicionais em `showSuggestions`), o container `relative` pode estar criando um contexto de empilhamento que interfere com a interação dos campos abaixo.

Além disso, o `handleClickOutside` (mousedown listener no `document`) pode estar capturando cliques antes que os inputs recebam foco, e o `onBlur` com `setTimeout` no logradouro pode causar re-renders que "roubam" o foco.

### Correções propostas

**Arquivo: `src/components/leads/QuickValuationForm.tsx`**

1. **Mover o `relative` do container externo para dentro do container do input** — O `relative` na linha 544 deve ficar apenas no `<div>` que contém o input e os dropdowns (linha 549), não no container pai. Isso evita que os dropdowns absolutos criem uma área invisível sobre os campos abaixo.

2. **Remover o `handleClickOutside` com `document.addEventListener`** — O `onBlur` com delay de 200ms já faz o trabalho de fechar as sugestões. O event listener global no `document` pode interferir com cliques em outros inputs. Substituir por lógica puramente baseada em `onBlur`/`onFocus`.

3. **Adicionar `onFocus={() => setShowSuggestions(false)}` em TODOS os inputs do formulário** (não apenas no condomínio) — Como medida de segurança, garantir que qualquer input que receba foco feche o dropdown de sugestões.

### Detalhes técnicos

- Linha 544: Remover `relative` → `<div className="space-y-2">`
- Linhas 114-128: Remover o `useEffect` com `handleClickOutside`
- Linha 549: Manter o `relative` aqui (já existe) — os dropdowns ficam posicionados em relação a este div interno
- Adicionar `onFocus={() => setShowSuggestions(false)}` nos inputs: area, quartos, banheiros, suites, vagas, diferenciais, nome, email, telefone

Alteração em 1 arquivo, sem mudanças no banco de dados.

