import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";
import AvaliacaoPublica from "./pages/AvaliacaoPublica";

// Lazy load non-critical routes
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Leads = lazy(() => import("./pages/Leads"));
const AdminFeedbacks = lazy(() => import("./pages/AdminFeedbacks"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));

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
                <Route path="/" element={<AvaliacaoPublica />} />
                <Route path="/avaliacao" element={<AvaliacaoPublica />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route 
                  path="/leads" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <Leads />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/feedbacks" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminFeedbacks />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/analytics" 
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminAnalytics />
                    </ProtectedRoute>
                  } 
                />
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
