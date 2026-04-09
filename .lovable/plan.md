

## Plano: Variar formato dos cards e adicionar hover mais impactante

### Problema
Todos os cards seguem o mesmo padrão visual: retângulo branco, ícone pequeno, título, texto. Isso cria fadiga visual no scroll mobile.

### Estratégia
Variar o layout dos cards por seção e adicionar hover effects mais expressivos, sem alterar conteúdo.

### Mudanças

**1. Cards PROBLEM — layout horizontal com ícone grande à esquerda**
- Mudar de vertical (ícone em cima) para horizontal (`flex-row`) com ícone em círculo colorido à esquerda
- Hover: rotação sutil do ícone (`group-hover:rotate-12`) + borda esquerda que expande + sombra vermelha
- No mobile: mantém horizontal mas compacto

**2. Cards SOLUTION — card com header colorido separado**
- Adicionar uma faixa dourada no topo do card com o ícone centralizado (como um "ribbon")
- Hover: a faixa expande levemente + card sobe mais (`-translate-y-2`) + sombra dourada (`shadow-[#D4AF37]/20`)
- O highlight text vai para um badge no rodapé do card

**3. Cards PARA QUEM — glassmorphism com glow no hover**
- Manter o layout atual mas adicionar um glow circular atrás do ícone no hover (`group-hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]`)
- Hover: border muda para dourado sólido + background fica `bg-white/15` + escala sutil (`scale-[1.02]`)

**4. Cards O QUE ACONTECE — estilo "pricing card" com número/step**
- Adicionar um número de ordem (01, 02, 03) grande e semitransparente no canto superior
- Hover: o número fica mais visível + card inteiro ganha borda dourada animada (`transition-all`)

**5. Cards WRONG PRICE (Seller/Buyer) — se existirem visualmente na página**
- Verificar se são renderizados (não parecem estar na página atual, apenas definidos como dados)

### Arquivos modificados
- `src/pages/AvaliacaoPublica.tsx` — todos os blocos de cards das 4 seções principais

### Resultado esperado
Cada seção tem um formato de card distinto, quebrando a monotonia. Hovers mais expressivos com rotações, glows e transições criam sensação de interatividade premium.

