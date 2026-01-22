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
    toast("Nova versão disponível", {
      description: "Uma atualização está pronta para ser instalada.",
      duration: Infinity,
      action: {
        label: "Atualizar",
        onClick: () => {
          if (updateSWFn) updateSWFn(true);
        },
      },
      cancel: {
        label: "Depois",
        onClick: () => {},
      },
    });
  },
  onOfflineReady() {
    // silencioso
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
