# Limpar Gestão de Leads — excluir leads de teste

## Diagnóstico
Tabela `leads` contém 8 registros, todos identificáveis como testes:

| email | nome | origem | created_at |
|---|---|---|---|
| marcusviniciusfreitasgodoy@gmail.com | Marcus | avaliacao_direta | 03/06 |
| maikon.d.cavalheiro3@gmail.com | MAIKON DOUGLAS CAVALHEIRO | avaliacao_publica | 22/05 |
| maikondouglascavalheiro3@gmail.com | Maikon Douglas Cavalheiro | avaliacao_publica | 22/05 |
| maikondouglascavalheiro2@gmail.com | Maikon Douglas Cavalheiro | avaliacao_publica | 22/05 |
| marcus@godoyprime.com.br | Marcus Godoy Teste | avaliacao_publica | 22/05 |
| maikondouglascavalheiro1@gmail.com | Maikon Douglas Cavalheiro | avaliacao_publica | 22/05 |
| maikon.d.cavalheiro@gmail.com | MAIKON DOUGLAS CAVALHEIRO | avaliacao_publica | 21/05 |
| maikondouglascavalheiro@gmail.com | Maikon Douglas Cavalheiro | avaliacao_publica | 21/05 |

## Ação
Executar via tool `supabase--insert` (que aceita DELETE):

```sql
DELETE FROM public.leads;
```

Como **todos** os registros são de teste, é mais simples e seguro truncar via DELETE sem WHERE do que listar IDs.

## O que NÃO vou mudar
- Estrutura da tabela, RLS, políticas — apenas dados.
- Tabelas relacionadas (`valuations`, `whatsapp_messages_log`, `analytics_events`) — só excluo se você pedir.

## Confirmação
Se quiser preservar algum lead específico, me avise antes de executar.
