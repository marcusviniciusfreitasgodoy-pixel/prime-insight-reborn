import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AvaliacaoPublica from "./pages/AvaliacaoPublica";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import FAQ from "./pages/FAQ";
import Feedback from "./pages/Feedback";
import Auth from "./pages/Auth";
import Leads from "./pages/Leads";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AvaliacaoPublica />} />
              <Route path="/avaliacao" element={<AvaliacaoPublica />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/leads" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Leads />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
