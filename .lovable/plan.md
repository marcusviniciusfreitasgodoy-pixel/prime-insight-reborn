

## Plano: Alterar limite de simulações gratuitas de 5 para 2

### Alterações

**`src/components/leads/QuickValuationForm.tsx`** (linha 52)
- Alterar `MAX_FREE_EVALUATIONS = 5` para `MAX_FREE_EVALUATIONS = 2`

**`src/hooks/useLeadsMetrics.ts`** (linha 4)
- Alterar `MAX_FREE_EVALUATIONS = 5` para `MAX_FREE_EVALUATIONS = 2`

Duas alterações simples, sem mudanças no banco de dados.

