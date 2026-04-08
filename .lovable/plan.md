

## Plan: Add "Proprietários" Card to "Para Quem É" Section

### What
Add a third persona card targeting property owners whose listing has been sitting unsold for 90+ days.

### Changes

**`src/pages/AvaliacaoPublica.tsx`**

1. Import `Home` icon from lucide-react (or use `Building` if already imported)
2. Add a third entry to the `PERSONAS` array:
   ```ts
   {
     icon: Home,
     title: "Proprietários",
     subtitle: "Seu imóvel está anunciado há mais de 90 dias?",
     description: "Se o seu imóvel não vende, o problema quase nunca é o imóvel — é o preço. Após 90 dias sem propostas concretas, o mercado já respondeu. Descubra o valor real de transação e reposicione seu anúncio com base em dados oficiais, não em achismos.",
     cta: "Reposicione seu imóvel e acelere a venda"
   }
   ```
3. Update the grid from `md:grid-cols-2` to `md:grid-cols-3` so 3 cards display side-by-side on desktop, and adjust `max-w-4xl` to `max-w-5xl` to accommodate the extra card.

