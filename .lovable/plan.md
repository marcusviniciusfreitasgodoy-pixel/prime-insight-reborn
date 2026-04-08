

## Plano: Mover seção "Sua opinião é importante" para antes da FAQ

### O que será feito
Mover o card de convite para pesquisa de feedback (linhas 390-406 de `QuickValuationResult.tsx`) para logo antes da seção FAQ (linha 422), ficando após o card de `ComparisonTable` e antes do "FAQ Parecer".

### Arquivo modificado
- **`src/components/leads/QuickValuationResult.tsx`** — Recortar o bloco do "Feedback invite" (linhas 390-406) da posição atual e colá-lo entre o `ComparisonTable` (linha 420) e o `FAQ Parecer` (linha 422).

### Ordem final das seções
1. Disclaimer (Importante)
2. Perit evaluation section
3. Comparison table
4. **FAQ Parecer** ← sobe
5. **Parecer CTA** ← sobe
6. **Feedback invite ("Sua opinião é importante")** ← desce para cá
7. Botão "Voltar e fazer nova consulta"

