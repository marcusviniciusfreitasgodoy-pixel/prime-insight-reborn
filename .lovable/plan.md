

## Plano: Remover Sofia da página pública de avaliação

### Objetivo
Remover o chatbot da Sofia da página pública (`AvaliacaoPublica.tsx`), mantendo apenas o botão do WhatsApp como canal de contato direto. O fluxo de suporte passa a ser: FAQ → Reunião estratégica gratuita.

### Alterações

**`src/pages/AvaliacaoPublica.tsx`**
1. Remover o import lazy do `PublicSofiaAssistant` (linhas 10-12)
2. Remover o bloco `<Suspense>` que renderiza o `<PublicSofiaAssistant />` (linhas 915-918)
3. Adicionar um botão flutuante de WhatsApp standalone diretamente na página (o atual está embutido dentro do `PublicSofiaAssistant`), para manter o canal de contato via WhatsApp

Nenhuma alteração no banco de dados é necessária.

