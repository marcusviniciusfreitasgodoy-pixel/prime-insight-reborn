## Objetivo

Restaurar, na tela de estimativa preliminar (`StepResultCapture`), o formulário de captura (Nome + E-mail + Telefone) que dispara o laudo completo nos 3 canais: tela do computador, WhatsApp e e-mail. Manter o botão de conversa direta no WhatsApp como alternativa.

## Diagnóstico

O fluxo de disparo já existe e está intacto no `ValuationWizard.handleCaptureSubmit`:
- Salva o lead.
- Insere `valuations` (origem `public`).
- Invoca `send-lead-notification` (e-mail Resend + WhatsApp Z-API).
- Faz `setFinalData(...)` e `setStep("thanks")`, o que renderiza `QuickValuationResult` (laudo completo na tela).

O que quebrou foi apenas a UI: o `StepResultCapture` perdeu o formulário e os campos quando a opção Google foi removida. Hoje só mostra o botão de WhatsApp e não chama `onSubmit`, então o laudo nunca é gerado na tela nem enviado por e-mail / WhatsApp automático.

## Mudanças

### `src/components/leads/wizard/StepResultCapture.tsx`
Reinserir o formulário (sem nenhuma referência ao Google), seguindo padrão visual da marca:

1. Logo abaixo da estimativa preliminar, adicionar um bloco "Receba seu laudo completo agora":
   - Campo Nome (pré-preenchido se `prefilledName`).
   - Campo E-mail (`type=email`, pré-preenchido se `prefilledEmail`).
   - Campo Telefone (com máscara simples brasileira `(00) 00000-0000`).
   - Caixa de consentimento opcional para marketing (default desmarcado).
   - Botão primário "Receber laudo completo" em navy `#0C2340`, raio 2px, altura 48px, JetBrains Mono nos micro-rótulos, valores em mono.
2. Texto curto explicando o que o cliente recebe: "Você vai ver o laudo completo agora na tela, e a mesma análise chega no seu e-mail e WhatsApp."
3. Validação client-side: nome ≥ 2, e-mail válido, telefone com ≥ 10 dígitos. Botão fica disabled até validar. Estado `isSubmitting` (já vem por prop) desabilita botão e mostra spinner.
4. Submit chama `onSubmit({ email, nome, telefone, googleVerified: false })`. Não há mais qualquer fluxo Google.
5. Manter o bloco existente "Fale com o especialista pelo WhatsApp" como alternativa, abaixo do formulário, com um divisor `ou` discreto entre os dois.

### `ValuationWizard.tsx`
Sem alterações funcionais. Apenas verificar que os props passados continuam compatíveis:
- `googleVerified={false}` fixo.
- `prefilledEmail` / `prefilledName` continuam opcionais (usados quando lead retorna).
- Remover `onBeforeGoogleRedirect` da chamada (não é mais necessário).

Também remover a prop `onBeforeGoogleRedirect` da `interface Props` do `StepResultCapture` para limpar resíduo do Google. Manter `googleVerified` na assinatura do `onSubmit` (com valor fixo `false`) para não quebrar a tipagem de `handleCaptureSubmit`.

## Padrão visual (regras da marca já aprovadas)

- Sem cantos > 2px nos inputs, no botão e no card.
- Sem vermelho. Erros de validação em warm-gray escuro `#6B5B3E` com microcopy abaixo do campo.
- Gold (`#C9A84C`) apenas no microtítulo "Próximo passo". Botão principal em navy.
- Valores e máscaras em JetBrains Mono.
- Sem em-dash; usar vírgula.
- Sem sombras pesadas, apenas borda fina `#0C2340/15`.

## Fora do escopo

- Templates de e-mail e mensagem de WhatsApp (já existem e funcionam).
- Lógica de rate-limit e `LimitExceededScreen` (já existem).
- Página `/avaliacao-imobiliaria` (laudo profissional).
- Campo bairro inserido na conversa anterior (mantido).

## Resultado esperado

Após preencher nome + e-mail + telefone e clicar:
1. Tela avança para `QuickValuationResult` com o laudo completo.
2. E-mail chega via Resend.
3. WhatsApp chega via Z-API com o resumo do laudo.
4. Alternativa "Fale com o especialista pelo WhatsApp" continua disponível na mesma tela.
