## Objetivo
Ajustar o novo fluxo `/avaliacao-direta` sem mexer em `/avaliacao`, removendo elementos indevidos, adicionando o CTA do laudo via WhatsApp no resultado e corrigindo/diagnosticando os problemas de Google, WhatsApp e e-mail.

## O que vou implementar

### 1. Limpeza do passo de detalhes
- Remover do wizard as opções:
  - Vista para o mar
  - Reformado recentemente
  - Varanda gourmet
- Ajustar o estado do wizard para não exibir nem usar mais esses campos no payload do lead/CRM.

### 2. Limpeza visual da página
- Remover os badges:
  - Dados ITBI Oficiais
  - NBR 14653-2
- Manter apenas os sinais de confiança que fizerem sentido na versão direta da rota.

### 3. WhatsApp na página de resultado
- Inserir na tela de resultado uma ação clara para solicitar o laudo completo via WhatsApp.
- Usar a configuração central de contato/mensagem já existente para não hardcodar número ou texto.
- Garantir que o CTA funcione tanto após captura manual quanto após captura com Google.

### 4. Fluxo “Continuar com o Google”
- Verificar se o problema é do ambiente de preview ou do fluxo da aplicação.
- Se for apenas limitação do preview, preservar a implementação correta e validar no domínio publicado/customizado.
- Se houver falha no app, ajustar a retomada do estado após retorno do OAuth para que o usuário volte ao passo de resultado corretamente.

### 5. Verificação do envio de WhatsApp e e-mail
- Auditar o fluxo que chama `send-lead-notification` após o cadastro de e-mail e telefone.
- Conferir logs e respostas da função para identificar por que você não recebeu nem WhatsApp nem e-mail.
- Corrigir o ponto de falha no envio e/ou no tratamento de erro.
- Melhorar o feedback em tela quando o lead for salvo mas a notificação externa falhar.

## Detalhes técnicos
- **Frontend**
  - `src/components/leads/wizard/StepDetails.tsx`
  - `src/components/leads/wizard/ValuationWizard.tsx`
  - `src/pages/AvaliacaoDireta.tsx`
  - `src/components/leads/QuickValuationResult.tsx`
- **Backend integrado**
  - Revisar `supabase/functions/send-lead-notification/index.ts`
  - Validar logs da função e o comportamento de envio para e-mail e WhatsApp
- **Sem mudança de rota original**
  - `/avaliacao` permanece intacta para teste A/B
- **Sem nova estrutura de dados**
  - A gravação continua usando a tabela `leads` com `origem = "avaliacao_direta"`

## Validação
- Testar o fluxo completo em `/avaliacao-direta`
- Confirmar:
  - os 3 toggles removidos
  - os 2 badges removidos
  - botão de laudo via WhatsApp no resultado
  - salvamento do lead
  - disparo de e-mail/WhatsApp ou mensagem clara de falha
  - comportamento do Google no ambiente correto

## Observação importante
Pelos sinais atuais, o OAuth com Google pode estar esbarrando no ambiente de preview, então a validação final desse ponto deve ser feita no domínio publicado ou customizado, além do ajuste de robustez no retorno do fluxo.