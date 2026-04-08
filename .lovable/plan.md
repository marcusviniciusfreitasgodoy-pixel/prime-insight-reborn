

## Plan: Enhance Visual Dynamics with Hover Effects and Animations

### Overview
Add micro-interactions, hover highlights, and motion effects across the public landing page (AvaliacaoPublica) and its components to create a more engaging, premium experience.

### Changes

**1. `src/pages/AvaliacaoPublica.tsx` — Section cards and buttons**
- **Problem cards**: Add `hover:-translate-y-1 hover:shadow-xl` and staggered `animate-fade-in` with delays per card
- **Solution cards**: Add `hover:-translate-y-1 hover:shadow-xl hover:border-[#D4AF37]/40` with gold border glow on hover
- **Persona cards**: Add `hover:-translate-y-1 hover:shadow-xl` and icon scale on hover via `group` + `group-hover:scale-110`
- **Hero stats**: Add `hover:scale-105` transition to each stat block
- **CTA buttons**: Add `hover:scale-[1.02] active:scale-[0.98]` for press feedback
- **FAQ accordion items**: Add `hover:border-[#D4AF37]/20 hover:shadow-sm` transitions
- **Wrong price cards** (seller/buyer sections if rendered): Same lift + shadow pattern

**2. `src/components/leads/RealCaseComparison.tsx` — Comparison cards**
- Add `hover:-translate-y-2 hover:shadow-2xl` to each comparison card
- Godoy Prime card: Add subtle `animate-pulse` ring or a gentle glow animation
- Explanation cards at bottom: Add `hover:-translate-y-0.5 hover:shadow-md`

**3. `src/components/leads/QuickValuationForm.tsx` — Form step indicators**
- Add `hover:scale-105` to step circle icons
- Active step circle: Add a subtle pulsing ring animation (`ring-2 ring-[#D4AF37]/40 animate-pulse`)
- Input fields: Add `focus-within:scale-[1.01] focus-within:shadow-md` transition to field containers

**4. `tailwind.config.ts` — Add utility animations**
- Add `float` keyframe (gentle up-down float) for hero decorative elements
- Add `glow-pulse` keyframe for the Godoy Prime highlight card ring

### Technical Details
- All animations use CSS transforms and transitions (GPU-accelerated, no layout shifts)
- Staggered delays via `[animation-delay:Xms]` with existing `animate-fade-in`
- `group` / `group-hover` pattern for child element reactions
- Consistent `transition-all duration-300` across all interactive elements
- Respects existing premium minimalism: subtle lifts (1-2px), soft shadows, no bounce

