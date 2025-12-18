import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AvaliacaoPublica from "./pages/AvaliacaoPublica";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import PesquisaPublica from "./pages/PesquisaPublica";
import FAQ from "./pages/FAQ";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AvaliacaoPublica />} />
            <Route path="/avaliacao" element={<AvaliacaoPublica />} />
            <Route path="/pesquisa" element={<PesquisaPublica />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
