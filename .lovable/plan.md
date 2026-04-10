

## Plano: Corrigir envio WhatsApp na send-lead-notification

### Problema
A função `send-lead-notification` chama a Z-API diretamente mas não envia o header `Client-Token`, resultando no erro "your client-token is not configured".

### Correção

**Arquivo: `supabase/functions/send-lead-notification/index.ts`**

1. Após ler `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN` (linha ~491), ler também `ZAPI_CLIENT_TOKEN`
2. Criar objeto de headers com `Client-Token` incluído
3. Usar esses headers nas duas chamadas fetch (cliente na linha 525 e corretor na linha 539)

Antes:
```typescript
headers: { "Content-Type": "application/json" },
```

Depois:
```typescript
const zapiHeaders: Record<string, string> = { "Content-Type": "application/json" };
const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
if (clientToken) zapiHeaders["Client-Token"] = clientToken;

// ... nas chamadas fetch:
headers: zapiHeaders,
```

4. Re-deploy da edge function
5. Testar enviando as 3 mensagens novamente

### Arquivos modificados
- `supabase/functions/send-lead-notification/index.ts`

