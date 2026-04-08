

## Plano: Seção "Caso Real" na Landing Page

### Objetivo
Criar uma nova seção na landing page que use o caso real comparativo (Godoy Prime R$ 1.3M vs ZAP R$ 1.6M vs QuintoAndar R$ 2M) como prova social e argumento de vendas, posicionada entre a seção "O PROBLEMA" e "A SOLUÇÃO".

### O que será criado

**Novo componente: `src/components/leads/RealCaseComparison.tsx`**

Uma seção visual com:
- Titulo: "Caso Real: Quanto Você Pagaria a Mais?"
- 3 cards lado a lado comparando as ferramentas:
  - **QuintoAndar**: ~R$ 2.000.000 (badge "Preço de Anúncio")
  - **ZAP Imóveis**: ~R$ 1.600.000 (badge "Preço de Anúncio")  
  - **Godoy Prime**: ~R$ 1.300.000 (badge "Transação Real" + destaque dourado)
- Abaixo dos cards, uma faixa de alerta: "Diferença de até R$ 700 mil no mesmo imóvel. Qual valor você usaria para negociar?"
- Nota explicativa: "Portais usam preços de anúncios (desejo do vendedor). Godoy Prime usa dados oficiais de transações reais registradas."
- Os nomes dos portais concorrentes aparecerão como "Portal A" e "Portal B" para evitar problemas legais, mas com as cores/estilos reconhecíveis

**Alteração: `src/pages/AvaliacaoPublica.tsx`**
- Inserir o novo componente entre a seção "O PROBLEMA" (Section 3) e "A SOLUÇÃO" (Section 4), criando uma ponte narrativa: Problema → Prova Real → Solução

### Detalhes técnicos
- Componente estático, sem dependências de banco de dados
- Usa os mesmos tokens de design (navy `#0C2340`, gold `#D4AF37`)
- Responsivo mobile-first
- 2 arquivos alterados/criados, sem mudanças no banco

