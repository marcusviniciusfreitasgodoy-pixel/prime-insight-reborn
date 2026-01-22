import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

// PWA: garante que usuários recebam a versão mais recente (evita ficar preso em cache antigo)
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // UI simples e confiável (sem depender de componentes): força atualização quando houver nova versão
    const shouldUpdate = window.confirm(
      "Uma nova versão do app está disponível. Atualizar agora?"
    );
    if (shouldUpdate) updateSW(true);
  },
  onOfflineReady() {
    // opcional: pode ficar silencioso
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
