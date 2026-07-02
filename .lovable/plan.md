## Contexto

Os arquivos citados no prompt (`send-valuation-whatsapp/index.ts` e `_shared/email-templates.ts`) não existem no projeto. As duas mensagens ao lead são geradas dentro de **um único arquivo**: `supabase/functions/send-lead-notification/index.ts`. Vou editar apenas esse arquivo, tratando cada bloco como o "alvo" do prompt:

- **WhatsApp** = trecho `clientMsg` dentro da integração Z-API (linhas ~537-566).
- **E-mail** = função `sendClientConfirmationEmail()` (linhas ~69-301), no ramo `initial | returning`.

O ramo `complete` (cliente já pediu Parecer) e a mensagem ao corretor não são cobertos pelo prompt; mesmo assim vou fazer uma higienização mínima (remover "Laudo" e emojis) para não deixar inconsistência de marca, sem alterar estrutura/lógica.

Nenhuma assinatura de função, import, payload ou credencial muda. Nenhum outro arquivo é tocado.

## Alterações no WhatsApp (bloco `clientMsg` initial/returning)

Reconstruir a string usando exatamente o copy fornecido, mapeando:

- `{nome}` → `data.leadName`
- `{endereco}` → `data.enderecoImovelAnalise` (fallback ausente = linha suprimida)
- `{tipoImovel}` → `data.tipologia`
- `{area}` → `data.area`
- `{quartos}`, `{suites}`, `{banheiros}`, `{vagas}` → campos homônimos
- `{andar}` → não existe no payload atual; a linha só será renderizada se um campo `andar` estiver presente (fica preparado, condicional, nunca aparece hoje)
- `{estimativa.*}` → `data.estimativaMin/Med/Max` via `formatCurrency`
- `{precoM2.*}` → `data.itbiMinM2/MedM2/MaxM2` via `formatCurrency`
- `{transactionCount}` → `data.itbiTransactionCount`

Cada linha do bloco "Imovel analisado" será um `.filter(Boolean).join("\n")` sobre entradas condicionais (mesma técnica atual). Bloco "Estimativa Preliminar" e "R$/m2 na regiao" só aparecem se os trios de valores existirem.

Título e assinatura usam "—" (Godoy Prime Realty — Analise Preliminar / — CRECI-RJ 11841). Nenhum emoji. Sem travessão dentro de frases (as sentenças da ressalva e do CTA usam vírgula/ponto). Negrito com `*asterisco*` do WhatsApp nos títulos, em `PARECER` e em `Parecer Tecnico`.

## Alterações no e-mail (`sendClientConfirmationEmail`, ramo initial/returning)

Mantém 100% do layout HTML atual (containers, `<table>`, cores navy/gold, footer, envio via Resend). Só troca textos e remove símbolos:

1. `emailSubject`: `"Godoy Prime Realty — Analise Preliminar"` (sem emoji).
2. `headerTitle`: `"Analise Preliminar"`. `headerSubtitle`: `"Godoy Prime Realty"`.
3. Bloco `propertyInfo`:
   - Título muda para `"Imovel analisado"` (sem 📍).
   - Adicionar linhas condicionais para `enderecoImovelAnalise` (rótulo "Endereço") e um futuro `andar`, mantendo condicionalidade linha a linha em todos os campos existentes (endereço, tipo, área, quartos, suítes, banheiros, vagas, andar). O rótulo "Bairro" atual passa a ser fallback quando não há endereço, para não perder informação (opcional; se preferir estritamente o prompt, removo o bairro).
4. Bloco `estimativaSection`:
   - Eyebrow: `"Estimativa Preliminar"`.
   - Remover subtítulo "Baseado em transações ITBI da região" (contém termo proibido).
5. Adicionar novo bloco condicional `"R$/m2 na regiao"` renderizando `itbiMinM2 a itbiMaxM2 (mediana itbiMedM2)` + `Base: N transacoes reais e oficiais registradas`, usando o mesmo padrão de `<table>` cinza claro do `propertyInfo`.
6. Substituir `ruaCondominioWarning` por uma "Ressalva" textual sem cor de alerta e sem emoji, com o texto exato do prompt.
7. Substituir o box `"Quer uma Avaliação Mais Precisa?"` + `ctaSection` por um único parágrafo de CTA com o texto exato do prompt (menção à ABNT NBR 14.653 fica aqui, único ponto do e-mail com a norma). O botão gold do WhatsApp é removido nesse ramo, conforme instrução ("Responda este e-mail ou aguarde o contato de um especialista em ate 2h uteis").
8. Footer: manter, mas trocar assinatura para `"Godoy Prime Realty — CRECI-RJ 11841"` e remover a linha "Este conteúdo é informativo e não substitui um Parecer Técnico formal" (contém termo permitido, mas é redundante com o novo CTA; posso manter se preferir).
9. Remover todos os emojis restantes do ramo `initial/returning` (📊, 📍, ⚠️, ⚡, 📋).

## Higienização mínima do ramo `complete` e mensagem ao corretor

Fora do escopo estrito do prompt, mas para não deixar termos proibidos ainda visíveis a outros clientes/corretor:

- Trocar "Laudo Preliminar" → "Analise Preliminar" no `clientMsg` do ramo `complete` já existente.
- Remover a palavra "Laudo" onde aparecer em subjects/títulos e trocar por "Analise Preliminar" ou "Parecer Tecnico" conforme o caso.
- Remover emojis desses trechos.

Nenhuma variável, condicional ou fluxo muda. Se preferir NÃO tocar nesses trechos, retire este bloco do plano na aprovação.

## Critérios de aceite verificáveis

- `rg -n "laudo|ITBI|cheque|cartorio|📍|⚠️|⚡|📋|📊|🏠|🎯|✅|🚨|🆕|🔄|—" supabase/functions/send-lead-notification/index.ts` retorna somente as ocorrências permitidas de "—" (título e assinatura) e nada mais dos termos/emojis proibidos.
- Variáveis dinâmicas continuam interpoladas (grep confirma `data.leadName`, `data.enderecoImovelAnalise`, `data.tipologia`, `data.area`, `data.quartos`, `data.suites`, `data.banheiros`, `data.vagas`, `data.estimativaMin/Med/Max`, `data.itbiMinM2/MedM2/MaxM2`, `data.itbiTransactionCount`).
- Cada campo do bloco "Imovel analisado" continua condicional (`${data.x ? ... : ""}` no e-mail; `.filter(Boolean)` no WhatsApp).
- Título usa `Godoy Prime Realty — Analise Preliminar` e assinatura `Godoy Prime Realty — CRECI-RJ 11841` em ambos os canais.
- NBR 14.653 aparece exclusivamente no CTA de Parecer Tecnico (uma ocorrência no WhatsApp, uma no e-mail).
- Handler, `serve(handler)`, chamada `resend.emails.send(...)` e chamadas Z-API permanecem idênticas em assinatura e payload.
- Sem deploy.

## Arquivos tocados

- `supabase/functions/send-lead-notification/index.ts` (único).