# Análise do disparo incorreto de Leads no Meta Pixel

## Diagnóstico
Hoje o código explícito do evento padrão `Lead` existe em **apenas um ponto**:

1. `src/components/leads/QuickValuationForm.tsx` — submit do botão **"Ver Análise Agora"**.

O formulário longo `LeadCaptureForm.tsx` já foi ajustado e agora dispara apenas o evento custom `LeadCaptureFormSubmitted`, sem somar no `Lead` oficial.

## O que o print sugere
O arquivo enviado mostra **vários eventos Lead ativos na mesma página**, mesmo na tela de limite atingido. Isso indica que o problema mais provável **não é mais o formulário longo**, e sim um destes cenários:

1. O `Lead` está sendo disparado **toda vez que o submit do formulário rápido conclui com sucesso**, inclusive para leads já existentes.
2. O auxiliar do Meta está exibindo **múltiplos Leads acumulados na sessão atual da SPA**, não necessariamente múltiplos botões ativos na tela.
3. O usuário pode estar conseguindo gerar mais de um submit válido antes de chegar ao estado de limite.

## Evidência no código
Em `QuickValuationForm.tsx`, o `trackLead()` roda tanto para lead novo quanto para lead recorrente:

```text
content_category: existingLead ? "returning_lead" : "new_lead"
```

Ou seja: se a pessoa fizer nova análise com o mesmo email antes de bater o limite, o Pixel registra outro `Lead`.

## Plano de correção
1. Manter `Lead` apenas no primeiro cadastro válido do formulário rápido.
2. Trocar o caso de lead recorrente por evento custom, por exemplo `ReturningLeadEvaluation`.
3. Validar no preview/network que `ev=Lead` ocorre apenas no primeiro envio elegível.

## Arquivos que devem ser ajustados
- `src/components/leads/QuickValuationForm.tsx` — condicionar `trackLead()` a `!existingLead` e enviar evento custom para recorrentes.

## Validação esperada
- Primeiro envio de um email novo: `ev=Lead`
- Novo envio do mesmo email: evento custom, sem `Lead`
- Formulário longo: `LeadCaptureFormSubmitted`, sem `Lead`
