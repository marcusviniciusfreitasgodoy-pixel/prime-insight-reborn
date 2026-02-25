

# Resetar Contadores de Avaliacao para Testes

## Situacao Atual
- 13 leads cadastrados no sistema
- 2 emails bloqueados (atingiram limite de 5): `marcus@godoyprime.com.br` e `marcusviniciusfreitasgodoy@gmail.com`
- Demais leads com 1 avaliacao cada

## Acao
Resetar o campo `evaluation_count` de todos os leads para `0`, permitindo que todos os emails voltem a realizar avaliacoes.

## Detalhes Tecnicos
- Executar `UPDATE leads SET evaluation_count = 0` em todos os registros
- Nenhuma alteracao de codigo ou schema necessaria
- Os dados dos leads (nome, email, telefone, etc.) serao preservados

