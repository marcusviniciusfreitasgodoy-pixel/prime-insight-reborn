

# Detalhe do Lead - Modal com todas as informacoes

## Objetivo

Ao clicar em um lead (na tabela desktop ou card mobile), abrir um Dialog/modal com todas as informacoes disponiveis do lead, incluindo campos opcionais preenchidos e dados da avaliacao.

## Problema Atual

- A interface `Lead` (linhas 43-59) mapeia apenas 13 dos 27 campos da tabela
- Nao existe acao de clique nos leads para ver detalhes
- Campos importantes estao ocultos: `objetivo`, `urgencia`, `diferenciais_imovel`, `endereco_imovel_analise`, `valor_pedido_vendedor`, `notas`, `preferencia_contato`, `parecer_solicitado`, etc.

## Solucao

### 1. Atualizar interface `Lead` (Leads.tsx, linhas 43-59)

Adicionar todos os campos faltantes da tabela:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `banheiros` | number | Qtd banheiros |
| `suites` | number | Qtd suites |
| `evaluation_count` | number | Avaliacoes realizadas |
| `objetivo` | string | Objetivo do lead |
| `urgencia` | string | Nivel de urgencia |
| `preferencia_contato` | string | Como prefere ser contatado |
| `aceita_marketing` | boolean | Aceita receber marketing |
| `diferenciais_imovel` | string | Diferenciais desejados |
| `endereco_imovel_analise` | string | Endereco do imovel analisado |
| `valor_pedido_vendedor` | number | Valor pedido pelo vendedor |
| `notas` | string | Notas internas |
| `followup_sent_at` | timestamp | Data do follow-up |
| `parecer_solicitado` | boolean | Se solicitou parecer |
| `parecer_solicitado_at` | timestamp | Data da solicitacao |
| `updated_at` | string | Ultima atualizacao |

### 2. Criar componente `LeadDetailDialog`

Novo componente em `src/components/leads/LeadDetailDialog.tsx` que exibe um Dialog com:

**Secao 1 - Contato**
- Nome, email (link mailto), telefone (link tel)
- Preferencia de contato, aceita marketing

**Secao 2 - Interesse e Imovel**
- Tipo de interesse (compra/venda), objetivo, urgencia
- Bairro, area, quartos, suites, banheiros, vagas
- Diferenciais do imovel (se preenchido)

**Secao 3 - Avaliacao**
- Endereco do imovel analisado
- Valor de interesse (estimativa gerada)
- Valor pedido pelo vendedor (se preenchido)
- Numero de avaliacoes realizadas

**Secao 4 - Status e Historico**
- Status convertido (com botao toggle)
- Data de criacao e ultima atualizacao
- Follow-up enviado (data)
- Parecer solicitado (data)
- Notas internas (campo editavel futuro, exibicao por agora)

Campos opcionais so aparecem se preenchidos - layout limpo e organizado.

### 3. Integrar clique na lista (Leads.tsx)

- Adicionar estado `selectedLead` para controlar qual lead esta selecionado
- Tornar as linhas da tabela desktop e cards mobile clicaveis (`cursor-pointer`, `onClick`)
- Renderizar `LeadDetailDialog` condicionalmente

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/leads/LeadDetailDialog.tsx` | Novo componente - modal de detalhes |
| `src/pages/Leads.tsx` | Atualizar interface Lead, adicionar estado e clique, renderizar dialog |

