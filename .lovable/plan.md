
# Corrigir Bug: QuickValuationForm consulta tabela admin-only

## Problema

O formulario publico de avaliacao (`QuickValuationForm.tsx`, linhas 269-286) consulta diretamente a tabela `itbi_transactions`, que tem RLS restrito a admins. Usuarios anonimos recebem array vazio e veem "Dados Insuficientes".

## Solucao

Substituir a query a `itbi_transactions` por uma query a `itbi_stats_public`, que e uma view publica com dados agregados por logradouro/bairro/uso.

### Dados disponíveis na view `itbi_stats_public`

| Coluna | Descricao |
|--------|-----------|
| `preco_min_m2` | Percentil 10 do valor/m2 |
| `preco_medio_m2` | Media do valor/m2 |
| `preco_max_m2` | Percentil 90 do valor/m2 |
| `total_transacoes` | Numero de transacoes |
| `logradouro` | Nome da rua |
| `bairro` | Bairro |
| `uso` | Residencial/Comercial |

### Mudanca no codigo (linhas 269-313)

**Antes:** Query a `itbi_transactions` buscando registros individuais e calculando percentis no frontend.

**Depois:** Query a `itbi_stats_public` buscando dados ja agregados:

```typescript
let query = supabase
  .from("itbi_stats_public")
  .select("preco_min_m2, preco_medio_m2, preco_max_m2, total_transacoes")
  .eq("bairro", bairro)
  .eq("uso", "Residencial");

if (logradouro.trim()) {
  query = query.ilike("logradouro", `%${logradouro.trim()}%`);
}

const { data, error: dbError } = await query;

// Agregar resultados (pode retornar multiplos logradouros)
if (data && data.length > 0) {
  const totalTransacoes = data.reduce((sum, d) => sum + (d.total_transacoes || 0), 0);
  const weightedMin = // media ponderada dos min_m2
  const weightedMed = // media ponderada dos med_m2
  const weightedMax = // media ponderada dos max_m2

  itbiData = { min_m2, med_m2, max_m2, transaction_count: totalTransacoes };
  estimativa = { min: min_m2 * area, med: med_m2 * area, max: max_m2 * area };
}
```

O filtro de `tipologia` nao se aplica pois a view nao tem essa coluna (agrupa por `uso` apenas). Isso e aceitavel para uma avaliacao rapida publica.

### Arquivo modificado

- `src/components/leads/QuickValuationForm.tsx` - linhas 269-313
