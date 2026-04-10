

## Plano: Atualizar número de contato de (21) 99968-0553 para (21) 96407-5124

Substituir todas as ocorrências do número antigo pelo correto em 2 arquivos.

### Arquivos e alterações

**1. `supabase/functions/send-lead-notification/index.ts`** (4 ocorrências)
- Linha ~185: `wa.me/5521999680553` → `wa.me/5521964075124`
- Linha ~229: `tel:+5521999680553` e texto `(21) 99968-0553` → `tel:+5521964075124` e `(21) 96407-5124`
- Linha ~540: telefone do corretor WhatsApp `"5521999680553"` → `"5521964075124"`
- Linha ~556: log do corretor `"5521999680553"` → `"5521964075124"`

**2. `supabase/functions/send-followup-email/index.ts`** (1 ocorrência)
- Linha ~123: `wa.me/5521999680553` e texto `(21) 99968-0553` → `wa.me/5521964075124` e `(21) 96407-5124`

**3. Re-deploy** das duas edge functions após as alterações.

