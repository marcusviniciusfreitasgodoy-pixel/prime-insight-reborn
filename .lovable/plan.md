

# Corrigir Spread Excessivo: Usar Percentis P10/P90

## Problema Raiz
A view `itbi_stats_public` usa `MIN()` e `MAX()` absolutos, incluindo outliers extremos que distorcem os valores apresentados ao usuario. Na AVN Lucio Costa, o MAX absoluto (R$ 50.769/m2) e 4x maior que a mediana.

## Solucao
Alterar a view `itbi_stats_public` para usar **percentis P10 e P90** ao inves de MIN/MAX absolutos, eliminando automaticamente os outliers.

## Mudancas

### 1. Migracaoo de banco de dados
Recriar a view `itbi_stats_public` substituindo:
- `MIN(valor_m2)` por `PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY valor_m2)` (P10)
- `MAX(valor_m2)` por `PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY valor_m2)` (P90)

Manter os nomes das colunas (`preco_min_m2`, `preco_max_m2`) para nao quebrar o frontend.

### 2. Nenhuma alteracao de codigo frontend
Como os nomes das colunas nao mudam, o componente `QuickValuationForm.tsx` continua funcionando sem alteracoes.

## Resultado Esperado (AVN Lucio Costa, 100m2)

| Cenario | Antes | Depois |
|---------|-------|--------|
| Minimo | R$ 490 mil | R$ 836 mil |
| Provavel | R$ 1,3 mi | R$ 1,28 mi |
| Maximo | R$ 5,1 mi | R$ 1,52 mi |
| Spread | ~354% | ~53% |

## Detalhes Tecnicos

A view sera recriada com `CREATE OR REPLACE VIEW` usando a mesma estrutura, apenas trocando as funcoes de agregacao para MIN e MAX. Sera necessario verificar a definicao atual da view antes de aplica-la para garantir que todos os filtros e agrupamentos existentes sejam preservados.
