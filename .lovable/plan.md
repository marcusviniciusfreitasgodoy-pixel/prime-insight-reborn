

## Plano: Quebrar monotonia visual com fundos baseados nas cores da marca

### Problema
A página alterna apenas entre `bg-white` e `bg-gray-50`, criando uma experiência visual monótona. As cores da marca (navy `#0C2340` e dourado `#D4AF37`) são usadas apenas em textos e botões, não nos fundos das seções.

### Estrategia
Intercalar fundos com tons sutis das cores da marca, mantendo contraste de texto adequado. Padrão proposto:

```text
HERO          → já usa navy (ok)
PROBLEMA      → bg-gray-50 → bg-[#0C2340]/[0.03] (tom azulado sutil)
CASO REAL     → bg-white → bg-gradient-to-b from-white to-[#D4AF37]/[0.05]
SOLUÇÃO       → bg-white → bg-[#D4AF37]/[0.04] (tom dourado sutil)
PARA QUEM     → bg-gray-50 → bg-gradient-to-br from-[#0C2340]/[0.04] to-[#0C2340]/[0.02]
CTA           → já usa dourado (ok)
FORM          → bg-gray-50 → bg-gradient-to-b from-[#0C2340]/[0.03] to-white
FAQ           → bg-white → bg-[#F8F6F0] (off-white quente)
FOOTER        → já usa navy (ok)
```

### Arquivos editados

1. **`src/pages/AvaliacaoPublica.tsx`** — Atualizar classes de fundo das seções:
   - PROBLEMA (linha 327): `bg-gray-50` → `bg-[#0C2340]/[0.03]`
   - SOLUÇÃO (linha 353): `bg-white` → `bg-[#D4AF37]/[0.04]`
   - PARA QUEM (linha 379): `bg-gray-50` → `bg-gradient-to-br from-[#0C2340]/[0.04] to-[#0C2340]/[0.02]`
   - Cards da seção PARA QUEM (linha 387): `bg-white sm:bg-gray-50` → `bg-white/80`
   - FORM (linha 417): `bg-gray-50` → `bg-gradient-to-b from-[#0C2340]/[0.03] to-white`
   - Aviso dentro do form (linha 437): `bg-white` → `bg-white/90`
   - FAQ (linha 463): `bg-white` → `bg-[#F8F6F0]`
   - FAQ accordion items (linha 487): `bg-gray-50` → `bg-white`

2. **`src/components/leads/RealCaseComparison.tsx`** — Fundo da seção (linha 36): `bg-white` → `bg-gradient-to-b from-white to-[#D4AF37]/[0.05]`

### Resultado esperado
Cada seção terá uma identidade visual sutil e distinta, usando navy e dourado como base. Textos permanecem escuros (`text-[#0C2340]`) sobre fundos claros, garantindo contraste. A sensação de monotonia branca será eliminada.

