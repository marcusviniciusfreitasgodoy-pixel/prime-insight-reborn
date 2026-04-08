

## Plano: Refinamento Visual Premium — Tipografia, Espaçamento e Elegância

### Diretrizes aplicadas
- **Menos elementos, mais impacto** — remover badges/pills decorativos desnecessários, simplificar cards
- **Tipografia manda** — Playfair Display para titulos, Inter para corpo
- **Muito espaço vazio** — aumentar paddings verticais, margins entre seções
- **Animação suave** — manter apenas fade-in e transições sutis, remover bounce
- **Botões elegantes** — refinar com tracking largo, peso leve, sem sombras pesadas

---

### 1. Fontes (2 arquivos)

**`index.html`** — Trocar Google Fonts de Montserrat para Playfair Display + Inter:
```
Playfair+Display:wght@400;600;700  (títulos)
Inter:wght@400;500;600             (corpo)
```

**`tailwind.config.ts`** — Atualizar fontFamily:
```
sans: ['Inter', 'sans-serif']
serif: ['Playfair Display', 'serif']
```

---

### 2. Tipografia na página (`src/pages/AvaliacaoPublica.tsx`)

Aplicar `font-serif` em todos os `<h2>`, `<h3>` e títulos de seção. O corpo permanece sans (Inter via herança).

Titulos especificos:
- Hero h2: adicionar `font-serif`
- Cada section h3 ("Por Que Você Está...", "A Solução...", etc.): adicionar `font-serif`
- FAQ h3, Footer h4: `font-serif`

---

### 3. Espaçamento — luxo = respiro

Aumentar padding vertical das seções:
- `py-12 sm:py-16 md:py-20` → `py-16 sm:py-24 md:py-32` (PROBLEM, SOLUTION, PARA QUEM)
- `py-12 sm:py-16 md:py-20` → `py-16 sm:py-24 md:py-28` (CTA)
- `py-16 md:py-20` → `py-20 sm:py-28 md:py-36` (FORM, FAQ)
- `mb-8 sm:mb-12` nos headers de seção → `mb-12 sm:mb-16`
- Gap entre cards: `gap-4 sm:gap-6` → `gap-6 sm:gap-8`

---

### 4. Redução de elementos visuais

Remover os **badges/pills** de categoria ("O PROBLEMA", "A SOLUÇÃO", "PARA QUEM É", "AVALIAÇÃO PRELIMINAR", "PERGUNTAS FREQUENTES") — substituir por uma **linha fina dourada** acima do título (`<div className="w-12 h-px bg-[#D4AF37] mx-auto mb-4" />`). Menos ruído, mais elegância.

Remover o **ChevronDown animado** com bounce no hero (linha 320-322). Animação chamativa.

---

### 5. Botões refinados

Substituir estilo de botões CTA por versão mais elegante:
- Remover `shadow-xl hover:shadow-2xl hover:scale-105`
- Usar: `tracking-wide uppercase text-xs font-semibold py-4 px-10 transition-colors duration-300`
- Manter cores da marca, mas com hover mais sutil (`hover:bg-[#c9a432]` sem scale)

Botão hero:
```
bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] tracking-widest uppercase text-xs font-semibold px-10 py-4 rounded-sm transition-colors duration-300
```

Botão outline (WhatsApp no FAQ):
```
border-[#0C2340]/20 tracking-wide uppercase text-xs font-semibold transition-colors duration-300
```

---

### 6. Cards mais limpos

Cards das seções PROBLEM, SOLUTION, PERSONAS — simplificar:
- Remover `hover:shadow-lg`, `hover:border-[#D4AF37]/30`
- Usar apenas `border border-gray-100/60` com hover sutil: `hover:border-gray-200`
- Padding mais generoso: `p-6 sm:p-8`
- Remover ícone-em-caixa-colorida; usar ícone direto com `text-[#D4AF37]` ou `text-[#0C2340]`

---

### 7. Animações

- Manter `animate-fade-in` com delays no hero
- Remover `animate-bounce` do ChevronDown
- Remover `hover:scale-105` / `active:scale-95` de todos os botões
- WhatsApp flutuante: remover `hover:scale-105`, usar apenas `transition-colors`

---

### Arquivos editados

| Arquivo | Mudanças |
|---------|----------|
| `index.html` | Google Fonts → Playfair Display + Inter |
| `tailwind.config.ts` | fontFamily sans → Inter, adicionar serif → Playfair Display |
| `src/pages/AvaliacaoPublica.tsx` | Tipografia serif nos títulos, padding aumentado, badges → linhas, botões refinados, cards limpos, remover animações chamativas |
| `src/components/leads/RealCaseComparison.tsx` | Mesmos padrões: font-serif no título, padding aumentado, cards limpos |

### Resultado
Página com identidade visual de marca de luxo: tipografia serif elegante nos títulos, muito respiro entre seções, elementos mínimos mas impactantes, botões discretos e sofisticados, sem animações chamativas.

