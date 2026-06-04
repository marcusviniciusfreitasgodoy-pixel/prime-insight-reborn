# Corrigir login com Google no wizard `/avaliacao-direta`

## Diagnóstico
Ao clicar em "Continuar com Google", a tela de consentimento abre e fecha sem completar a sessão; o wizard cai direto no formulário manual. Causas prováveis (em ordem):

1. **Preview vs Publicado** — o ambiente `id-preview--…lovable.app` usa credenciais OAuth de desenvolvimento do Lovable Cloud, diferentes do domínio publicado (`avaliacao.godoyprime.com.br`). É um comportamento conhecido e o teste real precisa ser feito no domínio publicado.
2. **`redirect_uri` com querystring** — usamos `${origin}/avaliacao-direta?from=google`. O broker OAuth pode rejeitar/normalizar URIs com query, fazendo o callback fechar sem setar sessão.
3. **Tratamento do retorno** — quando `result` volta sem `redirected:true` e sem `error`, o código atual assume "sucesso silencioso" e só exibe o formulário manual, sem mensagem clara para o usuário.

## Ajustes (somente front-end — sem mudar backend nem tabelas)

### 1. `src/components/leads/wizard/GoogleEmailCapture.tsx`
- Trocar `redirect_uri` para `window.location.origin` puro (sem `?from=google`).
- A flag `from=google` continua sendo controlada via `sessionStorage` (já feita por `onBeforeGoogleRedirect`) — o `ValuationWizard` já restaura o estado a partir do storage; vamos remover a dependência do query param.
- Logar `[OAUTH]` em cada ramo (`redirected`, `error`, `silent`) para diagnóstico.
- Se `result` voltar sem `redirected` e sem `error` (popup fechado), mostrar toast claro: *"Login com Google não foi concluído. Use seu e-mail abaixo."* em vez de assumir sucesso.

### 2. `src/components/leads/wizard/ValuationWizard.tsx`
- Detectar restauração via `sessionStorage` mesmo sem `?from=google` na URL: se houver sessão Supabase ativa **e** estado salvo em `STORAGE_KEY`, restaurar.
- Manter compatibilidade com o parâmetro `?from=google` para não quebrar fluxos antigos.

### 3. Teste
- Validar em **preview**: confirmar logs `[OAUTH]` mostrando exatamente em qual ramo o fluxo cai.
- Se mesmo após o ajuste o problema persistir só no preview, o caminho é validar no domínio publicado (`https://avaliacao.godoyprime.com.br/avaliacao-direta`) — onde o OAuth gerenciado usa credenciais de produção e costuma funcionar normalmente.

## O que NÃO vou mudar
- Credenciais OAuth, allowlist no Google Cloud Console ou configuração do Supabase Auth.
- Backend (`send-lead-notification`, Z-API, Resend) — já validados como OK.
- Layout dos cards ou copy da tela de resultado.

## Saída esperada
- Logs `[OAUTH]` claros no console para diagnosticar definitivamente.
- Feedback ao usuário quando o popup do Google fecha sem completar (em vez de pular silenciosamente para o formulário manual).
- Maior chance de o fluxo completar tanto em preview quanto em produção, ao remover a querystring do `redirect_uri`.
