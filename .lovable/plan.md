
# Rota padrao /admin -> Avaliacao Imobiliaria

## Mudanca

Alterar a rota index do `/admin` no `App.tsx` (linha 70) para renderizar `AvaliacaoImobiliaria` ao inves de `Dashboard`.

## Arquivo modificado

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Linha 70: trocar `<Route index element={<Dashboard />} />` por `<Route index element={<AvaliacaoImobiliaria />} />` |

Assim, ao acessar `/admin`, o usuario vera diretamente a pagina de Avaliacao Imobiliaria.
