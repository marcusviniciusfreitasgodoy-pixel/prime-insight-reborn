
## Plano: Aprimorar lógica do contador de escassez

### Contexto atual
- Fórmula: `Math.max(1, 7 - leads_da_semana)` — nunca chega a zero
- O contador é **apenas visual** (gatilho de urgência), não bloqueia avaliações
- O bloqueio real acontece por email (máx 2 avaliações por email)

### Problema
Se muitos leads entram, o número fica preso em "1" indefinidamente, perdendo credibilidade. Se poucos entram, mostra "6" ou "7", reduzindo a urgência.

### Proposta de melhoria

**Opção recomendada — Escassez inteligente com fallback suave:**

1. **Manter o contador como gatilho visual** (não bloquear ninguém)
2. **Quando chegar a 1 ou 0**, trocar a mensagem para algo como:
   - `"🔥 Últimas vagas desta semana — garanta sua análise agora"`
   - Isso mantém urgência sem mostrar "0 disponíveis" (o que afastaria o cliente)
3. **Ajustar a fórmula** para um range mais realista (ex: limite de 15 em vez de 7), para que o número varie de forma mais natural
4. **Nunca mostrar zero** — quando o cálculo dá ≤ 1, exibir a mensagem alternativa de urgência em vez do número

### Mudanças técnicas

**Arquivo**: `src/pages/AvaliacaoPublica.tsx`

- Alterar o limite semanal de 7 para um valor mais alto (ex: 15) para que o número desça gradualmente
- Adicionar lógica condicional na renderização:
  - Se `weeklySlots >= 2`: mostra "⚡ Esta semana: X avaliações gratuitas disponíveis"
  - Se `weeklySlots <= 1`: mostra "🔥 Últimas vagas desta semana — garanta sua análise agora"
- Manter `Math.max(0, limite - count)` — permitir zero no cálculo, mas nunca exibir o número zero

### Resultado
- O cliente **nunca vê uma porta fechada** (zero vagas)
- A urgência **aumenta naturalmente** conforme mais leads entram
- A mensagem alternativa cria **mais urgência** que mostrar "1"
