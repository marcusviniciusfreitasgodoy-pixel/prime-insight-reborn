/// <reference types="vite/client" />

// Tipos para o helper de update do PWA (vite-plugin-pwa)
declare module "virtual:pwa-register" {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }

  /**
   * Retorna uma função `updateSW(reloadPage?: boolean)`.
   * Quando `reloadPage=true`, aplica a nova versão e recarrega.
   */
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}
