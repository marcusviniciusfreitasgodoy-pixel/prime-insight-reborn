

# Simplificar Menu Lateral - Apenas Ferramentas de Avaliacao

## Objetivo

Remover do menu lateral os itens que nao sao relacionados ao modulo de Avaliacao, mantendo apenas as funcionalidades relevantes.

## Itens a Remover

| Item | Motivo |
|------|--------|
| Dashboard | Nao relacionado a avaliacao |
| Microregioes | Nao relacionado a avaliacao |
| Pesquisas de Mercado | Nao relacionado a avaliacao |
| Documentacao | Nao relacionado a avaliacao |
| Base Conhecimento Sofia | Nao relacionado a avaliacao |

## Itens que Permanecem

**Ferramentas:**
- Avaliacao Imobiliaria
- Historico Avaliacoes
- Vistoria Digital

**Administracao (apenas admins):**
- Calibrador Avaliacao
- Leads
- Usuarios
- Feedbacks
- Analytics

## Arquivo Modificado

| Arquivo | Mudanca |
|---------|---------|
| `src/components/AppSidebar.tsx` | Remover 5 itens dos arrays `toolItems` e `adminItems` |

## Detalhe Tecnico

No `AppSidebar.tsx`, o array `toolItems` (linhas 16-23) sera reduzido de 7 para 3 itens, e o array `adminItems` (linhas 25-31) tera o item "Base Conhecimento Sofia" removido. As rotas continuam registradas no `App.tsx` para acesso direto via URL, apenas nao aparecem no menu.

