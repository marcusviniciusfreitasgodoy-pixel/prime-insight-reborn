## Objetivo
Atualizar a mensagem para remover o termo “ITBI” da comunicação visível ao usuário e reduzir a ambiguidade entre o fluxo de e-mail e o contato por WhatsApp, além de revisar o comportamento do clique no WhatsApp à luz do bloqueio mostrado no print.

## Plano
1. **Trocar a copy visível no resultado**
   - Substituir o texto:
     - `Esta é uma estimativa algorítmica baseada em ITBI...`
   - Pela versão pedida com linguagem mais clara:
     - `Esta é uma estimativa algorítmica baseada em transações reais realizadas na região do imóvel avaliado nos últimos 12 meses...`
   - Revisar também a linha curta acima do valor (`Baseado em ... transações ITBI reais`) para manter consistência da mesma linguagem.

2. **Deixar os dois caminhos mais distintos na interface**
   - Manter o bloco principal como caminho de **recebimento do laudo por e-mail**.
   - Reforçar o bloco alternativo como **atendimento manual via WhatsApp**, sem parecer que faz a mesma coisa do botão principal.
   - Ajustar títulos/microcopys para que o usuário entenda de imediato:
     - um botão = receber análise completa preenchendo os dados;
     - outro botão = abrir conversa direta com especialista.

3. **Revisar o clique do botão de WhatsApp**
   - Verificar se o link continua sendo gerado pelo helper central de WhatsApp.
   - Ajustar a abertura para o formato mais confiável no navegador/preview, com fallback quando a aba externa for bloqueada.
   - Se o bloqueio vier do navegador/ambiente externo (como o print sugere), deixar o comportamento mais resiliente sem alterar o restante do funil.

4. **Validar o resultado final**
   - Confirmar que a nova copy aparece corretamente.
   - Confirmar que a distinção entre os CTAs ficou inequívoca.
   - Testar novamente o clique do WhatsApp no fluxo final.

## Detalhes técnicos
- Arquivo principal já identificado: `src/components/leads/wizard/StepResultCapture.tsx`
- O link do WhatsApp hoje é montado a partir de `src/config/contact.ts`
- O print sugere bloqueio em `api.whatsapp.com` no navegador, então a implementação vai focar em reduzir esse ponto de falha no front sem mexer no backend de notificações