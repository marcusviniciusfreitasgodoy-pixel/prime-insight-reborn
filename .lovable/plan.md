
Objetivo: eliminar o que ainda faz o browser expor `fbq` e deixar o projeto realmente limpo para futura configuração via GTM, sem mexer em UTMs, formulários ou backend funcional.

1. Remover a causa mais provável do falso “tracking ativo”: PWA/service worker
- Remover `vite-plugin-pwa` de `vite.config.ts`.
- Remover toda a lógica de registro/atualização de service worker em `src/main.tsx`.
- Remover os tipos de `virtual:pwa-register` em `src/vite-env.d.ts`.
- Remover a dependência `vite-plugin-pwa` de `package.json`.
- Manter apenas metadados simples de app/installabilidade no `index.html` se necessário, sem service worker.

2. Eliminar resíduos de cache antigo que podem continuar servindo assets com pixel
- Publicar uma nova versão sem service worker.
- Forçar invalidação da versão anterior para que o browser deixe de reutilizar bundles antigos.
- Validar que o domínio publicado não está mais servindo nenhum asset previamente cacheado que contenha pixel.

3. Remover a camada interna de analytics legado do app
- Remover a rota admin `/admin/analytics` em `src/App.tsx`.
- Remover o item “Analytics” da sidebar em `src/components/AppSidebar.tsx`.
- Remover `src/pages/AdminAnalytics.tsx`.
- Remover `src/hooks/useAnalyticsEvents.ts`.
- Não editar `src/integrations/supabase/types.ts` manualmente; se depois quiser limpeza estrutural no backend, isso fica para uma etapa separada.

4. Preservar explicitamente o que deve continuar
- Manter `src/hooks/useUTMTracking.ts` intacto na captura de `utm_*`, `gclid` e `fbclid`.
- Não alterar formulários, Edge Functions, envio de e-mail, WhatsApp ou lógica de leads.

5. Fazer uma varredura final de código
- Confirmar zero referências no código-fonte a:
  - `fbq`
  - `fbevents`
  - `connect.facebook.net`
  - `facebook.com/tr`
  - `gtag`
  - `googletagmanager`
  - qualquer helper antigo de tracking
- Confirmar também que não restou carregamento dinâmico de script em inicialização global.

6. Validar no browser após a limpeza
- Abrir a versão atualizada e checar:
  - `typeof fbq === "undefined"`
  - nenhuma requisição para `connect.facebook.net`
  - nenhuma requisição para `facebook.com/tr`
  - nenhum script externo de tracking carregado
- Se ainda aparecer `fbq`, tratar como problema de cache do navegador/distribuição e repetir a validação na versão publicada após a nova build limpa.

Arquivos previstos para alteração
- `vite.config.ts`
- `src/main.tsx`
- `src/vite-env.d.ts`
- `package.json`
- `src/App.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/AdminAnalytics.tsx` (remoção)
- `src/hooks/useAnalyticsEvents.ts` (remoção)

Resultado esperado
- `fbq` inexistente no código e indefinido no browser.
- Nenhum script externo de tracking carregado.
- Projeto limpo para receber uma nova configuração via Google Tag Manager.
