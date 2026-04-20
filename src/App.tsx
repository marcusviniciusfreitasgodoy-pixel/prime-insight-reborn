import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/AdminLayout";
import { Loader2 } from "lucide-react";
import AvaliacaoPublica from "./pages/AvaliacaoPublica";

// Lazy load pages
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Admin pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Microbairros = lazy(() => import("./pages/Microbairros"));
const AvaliacaoImobiliaria = lazy(() => import("./pages/AvaliacaoImobiliaria"));
const HistoricoAvaliacoes = lazy(() => import("./pages/HistoricoAvaliacoes"));
const VistoriaDigital = lazy(() => import("./pages/VistoriaDigital"));
const Documentacao = lazy(() => import("./pages/Documentacao"));
const BaseConhecimento = lazy(() => import("./pages/BaseConhecimento"));
const CalibradorAvaliacao = lazy(() => import("./pages/CalibradorAvaliacao"));
const Leads = lazy(() => import("./pages/Leads"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const AdminFeedbacks = lazy(() => import("./pages/AdminFeedbacks"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<AvaliacaoPublica />} />
                <Route path="/avaliacao" element={<AvaliacaoPublica />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Admin routes with sidebar layout */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AvaliacaoImobiliaria />} />
                  <Route path="microbairros" element={<Microbairros />} />
                  <Route path="pesquisas-mercado" element={<Dashboard />} />
                  <Route path="avaliacao-imobiliaria" element={<AvaliacaoImobiliaria />} />
                  <Route path="historico-avaliacoes" element={<HistoricoAvaliacoes />} />
                  <Route path="vistoria-digital" element={<VistoriaDigital />} />
                  <Route path="documentacao" element={<Documentacao />} />
                  <Route path="base-conhecimento" element={<BaseConhecimento />} />
                  <Route path="calibrador-avaliacao" element={<CalibradorAvaliacao />} />
                  <Route path="leads" element={<Leads />} />
                  <Route path="usuarios" element={<Usuarios />} />
                  <Route path="feedbacks" element={<AdminFeedbacks />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
