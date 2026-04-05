import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

function setupServiceWorker() {
  if (import.meta.env.DEV) {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister().catch(() => undefined);
          });
        });

        if (typeof window !== "undefined" && "caches" in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => {
              caches.delete(key).catch(() => undefined);
            });
          }).catch(() => undefined);
        }
      });
    }
    return;
  }

  let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSWFn = updateSW;
      if (updateSWFn) {
        updateSWFn(true);
      } else {
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
    },
    onRegistered(registration) {
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
  });
}

setupServiceWorker();

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
