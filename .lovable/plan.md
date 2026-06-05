## Objetivo

Permitir que o usuário avalie imóveis em qualquer bairro do Rio de Janeiro, removendo a trava atual em "BARRA DA TIJUCA" no fluxo `/avaliacao-publica` e `/avaliacao-direta`.

## O que está travado hoje

1. `src/components/leads/wizard/ValuationWizard.tsx` define `const BAIRRO = "BARRA DA TIJUCA"` e passa esse valor fixo para todas as etapas e para a gravação do lead.
2. `src/components/leads/wizard/StepAddress.tsx` não tem campo de bairro, o label do input diz "Rua / Avenida (Barra da Tijuca)" e chama `useStreetSuggestions(logradouro, "BARRA DA TIJUCA")`.
3. `src/hooks/useStreetSuggestions.ts` aceita bairro como parâmetro mas usa `BARRA DA TIJUCA` como default.

Resultado: digitar "Atlântica" (Copacabana) ou "Delfim Moreira" (Leblon) retorna sempre "Nenhum resultado", como visto na sessão.

## Mudanças

### 1. `StepAddress.tsx` — adicionar campo de bairro
- Inserir um novo campo "Bairro" antes do campo de rua, com autocomplete simples (input livre + sugestões via uma nova RPC ou lista estática dos bairros do Rio).
- Atualizar o label do campo de rua para "Rua / Avenida" (sem "Barra da Tijuca").
- Passar o bairro digitado para `useStreetSuggestions(logradouro, bairro)`.
- Validar: avançar só com bairro preenchido (≥3 chars) e rua preenchida.
- Quando a busca de rua não retornar nada na base ITBI, o fallback já existente para a API da Prefeitura do Rio (`search-logradouros-prefeitura`) cobre os demais bairros automaticamente.

### 2. `ValuationWizard.tsx` — bairro dinâmico
- Remover a constante `BAIRRO = "BARRA DA TIJUCA"`.
- Adicionar `bairro: string` ao `FormData` (default vazio).
- Passar `form.bairro` para `StepAddress` e para a função `runEstimate` (que chama `get_itbi_stats_filtered`) e para o registro do lead (`bairro_interesse`).

### 3. Aviso de cobertura de dados
- Abaixo do seletor de bairro, mostrar uma nota discreta em warm-gray quando o bairro não for da Zona Oeste cobre forte (Barra, Recreio, Jacarepaguá, Joá, Itanhangá, Camorim): "Estimativa indicativa: nossa base é mais densa na Zona Oeste do Rio. Para outros bairros, recomendamos um Parecer Técnico."
- Estilo segue o padrão da marca (Lato, sem vermelho, raio 2px, sem ícone de alerta colorido).

### 4. Não alterar
- Backend RPC `get_itbi_stats_filtered` já aceita qualquer bairro, não precisa migração.
- Página `/avaliacao-imobiliaria` (laudo profissional) permanece com Barra como default, fora do escopo.
- Mapa, dashboards admin e histórico continuam focados em Barra (são módulos internos).

## Detalhes técnicos

- Lista de bairros do Rio: criar um array estático em `src/utils/bairrosRio.ts` (~165 bairros oficiais) usado para autocomplete do campo bairro. Alternativa: chamar a Prefeitura via edge function existente; mantém-se simples com lista estática.
- Validação no submit: normalizar `bairro` para uppercase trim antes de salvar (igual ao formato `itbi_transactions.bairro`).
- Persistência localStorage `wizard_state_v1` ganha o campo `bairro` (compatível com estados antigos: default vazio).

## Fora do escopo

- Reescrever copy institucional ("foco Barra da Tijuca").
- Ampliar base ITBI para outros bairros.
- Mudanças visuais além da inserção do novo campo.
