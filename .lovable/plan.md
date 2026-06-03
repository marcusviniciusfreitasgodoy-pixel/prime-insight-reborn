## O que vou corrigir

1. Restabelecer a captura do lead no wizard de `/avaliacao-direta` para que o cadastro realmente grave no backend antes de tentar disparar notificações.
2. Ajustar o fluxo de Google para usar validação real no domínio publicado/customizado e evitar o fallback indevido para formulário manual.
3. Unificar o conteúdo do laudo enviado por e-mail e WhatsApp com o mesmo conjunto de dados exibido no resultado do site.
4. Habilitar o envio de e-mail do projeto, porque hoje ele não está configurado.

## Diagnóstico encontrado

- Não existe nenhum lead recente com `origem` de avaliação direta, então o processo não chegou a concluir a captura do cliente.
- Não há logs recentes dos disparos de e-mail/WhatsApp, o que confirma que o backend de notificação não foi acionado nesse fluxo.
- O botão “Continuar com Google” foi programado para cair no formulário manual no ambiente de preview, então o comportamento visto não é a validação final esperada.
- O projeto não tem domínio de e-mail configurado no backend; por isso, o envio de e-mail para o cliente não pode funcionar de forma confiável agora.
- O conteúdo enviado por e-mail/WhatsApp hoje é montado separadamente do resultado renderizado no site, então há risco de divergência entre o que o cliente vê e o que recebe.

## Plano de implementação

### 1. Corrigir o fluxo de captura do wizard
- Revisar o submit final do `ValuationWizard`.
- Garantir persistência do lead com todos os campos do wizard antes do redirecionamento final.
- Fazer o disparo das notificações com tratamento explícito de erro e retorno visível em log/toast para não falhar silenciosamente.

### 2. Corrigir o fluxo do Google
- Ajustar a regra de ambiente para que o Google continue normalmente no domínio publicado e no domínio customizado.
- Preservar o estado do wizard no retorno do OAuth.
- Evitar que o usuário seja jogado para preenchimento manual quando a autenticação Google estiver realmente disponível.

### 3. Unificar os dados do laudo
- Criar uma única montagem de payload com os mesmos dados usados no resultado do site.
- Reutilizar esse payload no resultado visual, no e-mail e no WhatsApp.
- Garantir consistência entre endereço, tipologia, área, quartos, banheiros, suítes, vagas, faixa estimada e demais atributos efetivamente coletados no wizard.

### 4. Corrigir os disparos de WhatsApp e e-mail
- Validar a função de notificação ponta a ponta.
- Garantir que WhatsApp do cliente e do corretor sejam disparados após captura bem-sucedida.
- Ajustar o e-mail do cliente para refletir exatamente a mesma estimativa e os mesmos dados do resultado.

### 5. Habilitar o canal de e-mail do projeto
- Configurar o domínio de envio de e-mail do projeto no backend integrado.
- Depois disso, validar o disparo real para o cliente.

## Validação final

Vou validar estes cenários:

- cadastro manual completo salva lead com `origem = avaliacao_direta`
- Google retorna para o passo de captura com dados verificados preenchidos
- envio de WhatsApp acontece após cadastro concluído
- envio de e-mail acontece após cadastro concluído
- conteúdo do e-mail e do WhatsApp bate com o resultado exibido na página

## Observação importante

O ponto do e-mail não é só código: hoje falta a configuração do domínio de envio no projeto. Sem isso, mesmo corrigindo o fluxo, o cliente pode continuar sem receber o e-mail.