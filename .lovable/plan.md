

## Plano: Quebrar monotonia visual da landing page (mobile-first)

### Diagnóstico

A página tem 9 seções entre o Hero e o Footer. Destas, **7 usam fundos quase idênticos** (branco/bege com opacidade 3-5%) e cards brancos. No mobile, onde o usuário vê uma seção de cada vez, isso cria uma parede monótona de cards brancos sem respiro visual.

### Estratégia: Intercalar fundos escuros + elementos visuais decorativos

Nenhuma funcionalidade ou texto será alterado. Apenas styling e elementos decorativos.

### Mudanças propostas

**1. Seção "Para Quem" — converter para fundo Navy escuro**
- Background: `bg-[#0C2340]` com texto branco
- Cards: `bg-white/10 border-white/20` com texto `text-white`
- Isso quebra a sequência de seções claras no meio da página

**2. Seção "O Que Acontece Após" — converter para fundo Navy escuro**  
- Mesma abordagem: fundo escuro, cards semi-transparentes
- Cria um ritmo claro-escuro-claro-escuro descendo a página

**3. Adicionar divisores decorativos entre seções**
- Substituir as linhas douradas (`w-12 h-px`) por SVG wave/curve sutil entre pelo menos 2-3 transições de seção
- Isso elimina a sensação de "blocos empilhados"

**4. Adicionar ícones/ilustrações decorativas de fundo**
- Nas seções Problem e Solution: adicionar elementos SVG decorativos (círculos, linhas geométricas) com opacidade baixa no canto, similar ao blur do hero
- Adiciona camada visual sem imagens reais

**5. Cards com borda lateral colorida (accent strip)**
- Nos cards de Problem: borda esquerda vermelha/destructive (`border-l-4 border-destructive`)
- Nos cards de Solution: borda esquerda dourada (`border-l-4 border-[#D4AF37]`)
- Diferencia visualmente os grupos de cards

**6. Seção FAQ — fundo com padrão sutil**
- Adicionar um background pattern CSS sutil (dots ou grid) para diferenciar do restante

### Ritmo visual resultante (mobile scroll)

```text
HERO          ████████  (escuro + imagem)
PROBLEM       ░░░░░░░░  (claro + cards com borda vermelha)
REAL CASE     ░░░░░░░░  (claro + cards com destaque gold)
SOLUTION      ░░░░░░░░  (claro + cards com borda dourada + decoração)
PARA QUEM     ████████  (ESCURO — quebra visual)
O QUE ACONTECE████████  (ESCURO — serviços premium)
CTA           ▓▓▓▓▓▓▓▓  (dourado)
FORM          ░░░░░░░░  (claro)
FAQ           ░░▒░░▒░░  (bege com pattern)
FOOTER        ████████  (escuro)
```

### Arquivos modificados
- `src/pages/AvaliacaoPublica.tsx` — backgrounds das seções, decorações SVG, wave dividers
- `src/components/leads/RealCaseComparison.tsx` — possível ajuste de fundo se necessário
- `src/index.css` — pattern CSS para FAQ (se usado)

