# Plano: Corrigir envio de WhatsApp (Z-API)

## Problema confirmado nos logs
A função `send-lead-notification` está retornando:
```
Client-Token Fd2d9a2263d6f4461ae75a57ea4c5fd05S not allowed
```
O e-mail (Resend) está funcionando normalmente. Apenas o WhatsApp falha porque o **Client-Token da Z-API está inválido/expirado**.

## Ação

1. Abrir formulário seguro para você colar o novo `ZAPI_CLIENT_TOKEN` (Account Security Token, encontrado no painel Z-API em **Conta → Segurança da Conta → Account Security Token**).
2. Após salvar, fazer um novo teste preenchendo o formulário em `/avaliacao-direta`.
3. Verificar nos logs da função `send-lead-notification` se o envio WhatsApp retornou sucesso (sem o erro "Client-Token not allowed").

## Observação
- Não vou alterar `ZAPI_TOKEN` nem `ZAPI_INSTANCE_ID` — só o `ZAPI_CLIENT_TOKEN`.
- Se após a troca ainda falhar, o próximo passo é validar se a instância está conectada ao WhatsApp (QR Code ativo) no painel Z-API.
