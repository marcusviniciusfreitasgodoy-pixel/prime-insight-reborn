import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

// PWA: garante que usuários recebam a versão mais recente (evita ficar preso em cache antigo)
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSWFn = updateSW;
    // Atualiza automaticamente sem perguntar ao usuário
    if (updateSWFn) {
      updateSWFn(true);
    } else {
      // Fallback: mostra toast se a função não estiver disponível
      toast("Nova versão disponível", {
        description: "Uma atualização está pronta para ser instalada.",
        duration: Infinity,
        action: {
          label: "Atualizar",
          onClick: () => window.location.reload(),
        },
        cancel: {
          label: "Depois",
          onClick: () => {},
        },
      });
    }
  },
  onOfflineReady() {
    // silencioso
  },
  onRegistered(registration) {
    // Verifica atualizações a cada 60 segundos
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 1000);
    }
  },
});

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  );
}
