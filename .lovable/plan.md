## Objetivo

Atualizar a apresentação da página `/avaliacao-direta` adotando a direção "Premium clássico" aprovada — cabeçalho azul-marinho com logo dourado para contraste, hero com tipografia serifada (Playfair Display) e rodapé refinado em caps. Sem mudanças no conteúdo do wizard nem na lógica.

## Mudanças

**Arquivo único:** `src/pages/AvaliacaoDireta.tsx`

1. **Header navy sólido** (`bg-[#0C2340]`, sticky, shadow-lg):
   - Logo: SVG inline (diamante em camadas) na cor `#C9A84C` para garantir contraste sobre o navy
   - Texto da marca: "GODOY PRIME" em white, com "PRIME" em gold
   - Telefone à direita em branco com hover gold (mantém link WhatsApp)
   - Remove `import godoyLogo` (não usado mais)

2. **Hero**:
   - Headline em Playfair Display (já carregado no `index.html`), maior (até `text-5xl`)
   - "dados oficiais" em gold (mantém)
   - Subcopy em `text-slate-500`

3. **Wrapper**: muda para `flex flex-col` com fundo sólido `#F8F6F0` (sem gradient)

4. **Footer**: layout em caps tracking-widest, links com hover gold (mesmo conteúdo)

## Fora do escopo

- Estrutura do `ValuationWizard` permanece intacta (a estilização do card interno já se harmoniza com a nova moldura)
- Sem alterações em rotas, copy, lógica de leads, ou outros arquivos
