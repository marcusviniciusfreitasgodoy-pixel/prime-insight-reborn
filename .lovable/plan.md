## Objetivo
Eliminar a ambiguidade entre os dois botões do bloco de captura e corrigir a percepção de que o Google “não faz nada”.

## O que vou ajustar

1. **Deixar a proposta dos botões inequívoca**
   - Transformar o bloco em dois caminhos claramente distintos:
     - **Opção 1:** liberar o laudo detalhado após identificação
     - **Opção 2:** falar direto no WhatsApp com o especialista, sem promessa de entrega automática do mesmo laudo
   - Reescrever títulos, subtítulos e rótulos para que não pareçam dois botões com a mesma função.

2. **Reorganizar a hierarquia visual**
   - Destacar apenas um CTA principal no card.
   - Rebaixar o botão de WhatsApp para alternativa secundária de contato.
   - Remover o “ou” genérico e substituir por um texto explicativo do tipo “Prefere falar direto com um especialista?”.

3. **Corrigir a experiência do Google**
   - Garantir feedback visível imediato no clique: estado de carregamento, mensagem de redirecionamento ou erro claro.
   - Revisar o caso em que o OAuth não redireciona nem retorna erro perceptível.
   - Validar o comportamento no domínio publicado, já que o preview pode ter comportamento diferente de autenticação.

4. **Ajustar a promessa do conteúdo entregue**
   - Garantir que o fluxo identificado entregue o laudo detalhado por e-mail/WhatsApp.
   - Garantir que o botão alternativo de WhatsApp deixe claro que ele abre conversa direta com o especialista, e não necessariamente o mesmo disparo automático do fluxo identificado.

## Sugestão de copy

### Estrutura sugerida
- **Título do card:** Receba seu laudo detalhado
- **Texto de apoio:** Identifique-se para receber a análise completa com os dados deste imóvel.
- **Botão principal:** Receber laudo detalhado
- **Separador secundário:** Prefere atendimento imediato?
- **Botão secundário:** Falar com especialista no WhatsApp
- **Texto pequeno abaixo do secundário:** Abre uma conversa direta para análise manual do imóvel.

## Resultado esperado
- O usuário entende imediatamente que:
  - um botão **libera/envia o laudo** após cadastro
  - o outro botão **abre conversa direta no WhatsApp**
- O clique no Google passa a ter retorno perceptível e menos chance de parecer inativo.

## Detalhes técnicos
- Ajustar `StepResultCapture.tsx` para nova hierarquia, nova copy e diferenciação de intenção entre CTAs.
- Ajustar `GoogleEmailCapture.tsx` para feedback explícito de loading/redirect/erro no OAuth.
- Validar a restauração do estado no retorno do Google em `ValuationWizard.tsx`.
- Testar especificamente no domínio publicado, além do preview, para separar problema real de diferença de ambiente de autenticação.