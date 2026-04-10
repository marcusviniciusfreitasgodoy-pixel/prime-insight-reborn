

## Plano: Integrar Z-API para envio automático de mensagens WhatsApp

### Credenciais recebidas
- Instance ID: `3F172E6464E6822C9BFA9E648AE68DF9`
- Token: `2489C64D3BF41EBEA82BBA81`

Serão armazenadas como secrets seguras no backend (`ZAPI_INSTANCE_ID` e `ZAPI_TOKEN`).

### Mudanças

**1. Armazenar secrets**
- Adicionar `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN` como secrets do projeto

**2. Criar Edge Function `send-whatsapp-zapi`**
- Arquivo: `supabase/functions/send-whatsapp-zapi/index.ts`
- Endpoint genérico que recebe: telefone, mensagem
- Chama `https://api.z-api.io/instances/{ID}/token/{TOKEN}/send-text`
- Validação com Zod, CORS, tratamento de erros
- Log de envio no console

**3. Criar tabela `whatsapp_messages_log`**
- Migration SQL com colunas: `id`, `phone`, `message_type`, `status`, `response_data`, `created_at`
- RLS: apenas service_role pode inserir (via edge function)

**4. Integrar no fluxo existente `send-lead-notification`**
- Após enviar email para a agência e para o cliente, chamar a Z-API para enviar mensagem WhatsApp
- **Novo lead**: mensagem de boas-vindas ao cliente + alerta ao corretor (21) 99968-0553
- **Parecer solicitado**: confirmação ao cliente + alerta prioritário ao corretor
- Mensagens formatadas com dados do imóvel e estimativa

**5. Configurar `supabase/config.toml`**
- Adicionar `[functions.send-whatsapp-zapi]` com `verify_jwt = false`

### Mensagens automáticas previstas

| Evento | Destinatário | Mensagem |
|--------|-------------|----------|
| Novo lead | Cliente | Boas-vindas + confirmação de que a avaliação foi recebida |
| Novo lead | Corretor | Alerta de novo lead com dados resumidos |
| Parecer solicitado | Cliente | Confirmação + prazo de retorno |
| Parecer solicitado | Corretor | Alerta prioritário para contato imediato |

### Arquivos criados/modificados
- `supabase/functions/send-whatsapp-zapi/index.ts` (novo)
- `supabase/functions/send-lead-notification/index.ts` (adicionar chamada Z-API)
- `supabase/config.toml` (adicionar config da nova function)
- Migration SQL para `whatsapp_messages_log`

