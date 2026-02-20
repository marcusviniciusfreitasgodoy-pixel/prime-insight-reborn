

# Menu Lateral Admin com Acesso a Todas as Funcionalidades

## Situacao Atual

O `App.tsx` registra apenas 3 rotas admin (leads, feedbacks, analytics). Existem 12+ paginas prontas (Dashboard, Microbairros, AvaliacaoImobiliaria, VistoriaDigital, etc.) que nao estao acessiveis. O componente `AppSidebar.tsx` ja existe mas nunca foi integrado — falta o `SidebarProvider` e um layout admin.

## Solucao

Criar um layout admin com sidebar lateral que envolve todas as rotas protegidas, e registrar todas as rotas faltantes.

### 1. Criar componente `AdminLayout`

Novo arquivo `src/components/AdminLayout.tsx` que:
- Envolve o conteudo com `SidebarProvider` e `BairroProvider`
- Renderiza o `AppSidebar` (menu lateral)
- Inclui um header compacto com `SidebarTrigger`, info do usuario e botao de logout
- Usa `Outlet` do react-router para renderizar as paginas filhas

### 2. Atualizar `AppSidebar.tsx`

- Adicionar itens faltantes: Admin Feedbacks, Admin Analytics
- Remover o `div className="hidden lg:block"` que esconde no desktop
- Separar visualmente itens base dos itens admin com labels de grupo distintos

### 3. Registrar todas as rotas no `App.tsx`

Adicionar lazy imports e rotas protegidas para:

| Rota | Pagina | Admin-only? |
|------|--------|-------------|
| `/admin` | Dashboard | Sim |
| `/admin/microbairros` | Microbairros | Sim |
| `/admin/avaliacao-imobiliaria` | AvaliacaoImobiliaria | Sim |
| `/admin/historico-avaliacoes` | HistoricoAvaliacoes | Sim |
| `/admin/vistoria-digital` | VistoriaDigital | Sim |
| `/admin/documentacao` | Documentacao | Sim |
| `/admin/base-conhecimento` | BaseConhecimento | Sim |
| `/admin/calibrador-avaliacao` | CalibradorAvaliacao | Sim |
| `/admin/leads` | Leads | Sim |
| `/admin/usuarios` | Usuarios | Sim |
| `/admin/feedbacks` | AdminFeedbacks | Sim |
| `/admin/analytics` | AdminAnalytics | Sim |

Todas as rotas admin ficam sob o prefixo `/admin` com o `AdminLayout` como elemento pai, usando rotas aninhadas do react-router.

### 4. Atualizar URLs no `AppSidebar.tsx`

Atualizar os `url` dos itens para usar o prefixo `/admin`.

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/AdminLayout.tsx` | Novo - layout com sidebar + header + Outlet |
| `src/components/AppSidebar.tsx` | Atualizar URLs, adicionar itens faltantes, remover hidden |
| `src/App.tsx` | Registrar todas as rotas admin aninhadas sob AdminLayout |

### Comportamento esperado

- Ao fazer login como admin e navegar para `/admin`, o usuario ve o Dashboard com sidebar lateral
- A sidebar mostra todos os modulos disponiveis, separados em "Ferramentas" e "Administracao"
- Clicar em qualquer item navega para a pagina correspondente sem recarregar
- A sidebar pode ser colapsada para mostrar apenas icones
- Em mobile, a sidebar fica oculta e acessivel via botao hamburger
