

## Diagnóstico: Spread Excessivo + Histórico Vazio

### 1. Análise de Outliers na Base ITBI

Dados da Barra da Tijuca (Residencial, desde 2024, ≥90% transferido):

```text
Estatística     | Valor/m²
----------------|----------
P10 (min usado) | R$ 7.283
P25             | R$ 8.161
Mediana (P50)   | R$ 9.348
P75             | R$ 10.622
P90 (max usado) | R$ 12.500
Máximo absoluto | R$ 50.769  ← outlier extremo (AVN Lucio Costa)
Total registros | 870
```

**Sim, há outliers**. O valor máximo absoluto (R$ 50.769/m²) é 5,4x a mediana. Porém, a view `itbi_stats_public` já usa P10/P90 para mitigar isso — o problema é que ela **não filtra por período recente** (usa dados desde 2020), misturando 5 anos de transações com padrões de preço diferentes.

**Spread atual**: P90/P10 = 1,72x → para um imóvel de 99m², isso gera:
- Mín: R$ 721k vs Máx: R$ 1.237k → diferença de **R$ 516k** (spread ~56%)

Quando a busca é feita **sem logradouro específico** (bairro todo), mistura ruas de R$ 6k/m² com ruas de R$ 17k/m² — gerando spread absurdo.

### 2. Causa-raiz do Spread Grande

A view `itbi_stats_public` **agrupa por logradouro**, mas o `QuickValuationForm` faz média ponderada de múltiplos logradouros quando a busca por `ilike` retorna vários resultados — ou do bairro inteiro quando não há logradouro. Isso mistura micromercados completamente diferentes dentro da Barra da Tijuca.

### 3. Histórico de Avaliações Vazio

**A avaliação pública NÃO grava na tabela `valuations`**. O fluxo público (`QuickValuationForm`) apenas:
1. Insere/atualiza um registro na tabela `leads`
2. Busca dados da view `itbi_stats_public`
3. Calcula estimativa no front-end
4. Mostra resultado — mas **nunca faz INSERT em `valuations`**

A tabela `valuations` só é alimentada pelo módulo profissional (`ValuationEngine.tsx`), que requer login de corretor/admin. Confirmei: `SELECT * FROM valuations` retorna 0 registros.

### Plano de Correções

**Arquivo 1: Migração SQL — Criar view otimizada**

Criar uma nova view `itbi_stats_recent` que:
- Filtra apenas transações dos últimos 18 meses (não 5 anos)
- Remove outliers usando filtro IQR (excluir valor_m2 < Q1-1.5*IQR ou > Q3+1.5*IQR) por logradouro
- Mantém P10/P90 mas sobre dados já limpos

**Arquivo 2: `src/components/leads/QuickValuationForm.tsx`**

- Quando há logradouro específico selecionado: usar apenas dados desse logradouro (sem média ponderada de múltiplos)
- Quando não há logradouro: usar estatísticas do bairro inteiro mas com spread mais apertado (P20/P80 em vez de P10/P90)
- Após calcular estimativa, **gravar resultado na tabela `valuations`** com `user_id = null` (avaliação pública) para alimentar o histórico

**Arquivo 3: Migração SQL — Permitir valuations públicas**

- Adicionar RLS policy para INSERT com `user_id IS NULL` (avaliações anônimas)
- Adicionar RLS policy para SELECT de avaliações públicas por admins
- Adicionar coluna `origin` (tipo `public` ou `professional`) para distinguir

**Arquivo 4: `src/pages/HistoricoAvaliacoes.tsx`**

- Ajustar query para incluir avaliações com `user_id IS NULL` quando admin
- Adicionar badge de origem ("Pública" vs "Profissional")

### Resumo de alterações

| Alteração | Impacto |
|-----------|---------|
| View com filtro IQR + período recente | Reduz spread de ~56% para ~25-30% |
| Gravar avaliações públicas em `valuations` | Popula o histórico |
| Coluna `origin` na tabela | Distingue avaliações públicas de profissionais |
| Lógica de logradouro único | Evita misturar micromercados |

4 alterações (2 migrações SQL + 2 arquivos TypeScript), sem quebrar funcionalidade existente.

