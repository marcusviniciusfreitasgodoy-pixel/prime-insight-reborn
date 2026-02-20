

# Fluxo Customizado de Reset de Senha via Resend

## Problemas Identificados

1. **Rota `/reset-password` nao existe no App.tsx** - A pagina `ResetPassword.tsx` existe mas nunca foi registrada como rota. Qualquer acesso a `/reset-password` redireciona para `/` pelo catch-all (linha 69).
2. **Email de recuperacao usa servico padrao** - Baixa confiabilidade e limite de ~4 emails/hora.

## Solucao

### 1. Criar Edge Function `send-password-reset`

Nova edge function que:
- Recebe o email do usuario
- Usa Supabase Admin API (`supabase.auth.admin.generateLink`) para gerar um link de recuperacao
- Envia o email via Resend com template HTML profissional Godoy Prime
- Nao requer autenticacao (endpoint publico, pois o usuario esqueceu a senha)

```text
Fluxo:
Usuario -> Auth.tsx (esqueceu senha) -> Edge Function -> Resend -> Email com link
Link clicado -> /reset-password -> ResetPassword.tsx -> updateUser()
```

### 2. Adicionar rota `/reset-password` no App.tsx

Registrar a pagina `ResetPassword.tsx` como rota publica antes do catch-all.

### 3. Atualizar Auth.tsx

Substituir `supabase.auth.resetPasswordForEmail()` por chamada a edge function `send-password-reset`.

### 4. Configurar `verify_jwt = false` no config.toml

A funcao precisa ser acessivel sem autenticacao.

## Detalhes Tecnicos

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/send-password-reset/index.ts` | Nova edge function |
| `supabase/config.toml` | Adicionar `verify_jwt = false` para nova funcao |
| `src/App.tsx` | Adicionar rota `/reset-password` |
| `src/pages/Auth.tsx` | Usar edge function ao inves do metodo nativo |

### Edge Function - Logica principal

```typescript
// Gerar link de recuperacao via Admin API
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const { data, error } = await supabaseAdmin.auth.admin.generateLink({
  type: 'recovery',
  email: email,
  options: { redirectTo: `${origin}/reset-password` }
});

// Enviar via Resend com template Godoy Prime
const resend = new Resend(RESEND_API_KEY);
await resend.emails.send({
  from: "Godoy Prime Realty <marcus@godoyprime.com.br>",
  to: [email],
  subject: "Redefinir sua senha - Godoy Prime",
  html: templateHtml // Template profissional com link
});
```

### Seguranca

- Rate limiting basico: aceita apenas POST
- Nao revela se o email existe ou nao (sempre retorna sucesso)
- Link de recuperacao tem expiracao padrao do Supabase
- Sanitizacao HTML do email do usuario no template

