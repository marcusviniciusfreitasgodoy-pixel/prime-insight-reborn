## Problema

O CTA "Solicitar Parecer Técnico" enviado ao cliente (e-mail de follow-up + mensagem de WhatsApp Z-API) está apontando para a landing page (`https://prime-insight-reborn.lovable.app`) em vez de abrir o WhatsApp da Godoy Prime já com a mensagem pronta solicitando o Parecer Técnico.

O e-mail principal de notificação (`send-lead-notification`) já está correto — usa `wa.me/5521964075124` com mensagem pré-preenchida. Mas dois outros pontos ainda redirecionam para a landing page.

## Pontos a corrigir

### 1. `supabase/functions/send-followup-email/index.ts` (linha 116)
CTA principal do e-mail de follow-up (enviado dias após a avaliação):
- **Antes:** `<a href="https://prime-insight-reborn.lovable.app">📊 Solicitar Parecer Técnico Grátis</a>`
- **Depois:** Link `https://wa.me/5521964075124?text=...` com mensagem pré-preenchida personalizada com o nome do lead e o bairro de interesse, ex.:

  > "Olá! Sou {nome}. Fiz uma avaliação preliminar{ no bairro X} e quero solicitar o Parecer Técnico Completo Godoy Prime."

- Manter o mesmo estilo visual do botão (gradiente navy), apenas trocando o `href`.
- Remover (ou simplificar) o segundo botão verde "WhatsApp (21) 96407-5124" para não duplicar — manter apenas como link de texto secundário "Prefere ligar? (21) 96407-5124", já que o CTA principal agora também é WhatsApp.

### 2. `supabase/functions/send-lead-notification/index.ts` (linha 543)
Mensagem de WhatsApp inicial enviada via Z-API ao cliente:
- **Antes:** `📋 Quer solicitar um *Parecer Técnico Completo*? Acesse: https://prime-insight-reborn.lovable.app`
- **Depois:** Substituir por uma chamada para responder ali mesmo no WhatsApp (afinal a mensagem JÁ está no WhatsApp do cliente — não faz sentido mandar um link `wa.me` para o mesmo número):

  > "📋 Quer solicitar um *Parecer Técnico Completo*? Basta responder esta mensagem com *PARECER* que um especialista entra em contato."

  Isso é mais natural do que mandar um `wa.me` no próprio WhatsApp.

## Após as alterações

- Redeploy automático das duas edge functions: `send-followup-email` e `send-lead-notification`.
- Sem mudanças em banco, RLS ou frontend.

## Resultado esperado

- Cliente que recebe o e-mail de follow-up clica no botão e o WhatsApp abre direto na conversa com a Godoy Prime, com mensagem pronta solicitando o Parecer.
- Cliente que recebe o WhatsApp inicial é instruído a responder na própria conversa, encurtando o funil.