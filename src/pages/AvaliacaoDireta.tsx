import { useState, useRef, lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { Loader2, Shield, FileSearch, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { QuickValuationForm, QuickValuationData } from "@/components/leads/QuickValuationForm";
import godoyLogo from "@/assets/godoy-logo-symbol.png";
import { PHONE, BRAND, whatsappUrl, WHATSAPP_MESSAGES } from "@/config/contact";

const QuickValuationResult = lazy(() =>
  import("@/components/leads/QuickValuationResult").then((m) => ({ default: m.QuickValuationResult })),
);

type Step = "form" | "loading" | "result";

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-[#C9A84C]" />
      <p className="text-sm text-muted-foreground">
        Consultando transações reais da Prefeitura...
      </p>
    </div>
  );
}

const TRUST_BADGES = [
  { icon: FileSearch, label: "Dados ITBI Oficiais" },
  { icon: BadgeCheck, label: "NBR 14653-2" },
  { icon: Shield, label: BRAND.creci.split(" | ")[0] },
];

export default function AvaliacaoDireta() {
  const [step, setStep] = useState<Step>("form");
  const [valuationData, setValuationData] = useState<QuickValuationData | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const handleComplete = (data: QuickValuationData) => {
    setValuationData(data);
    setStep("loading");
    setTimeout(() => {
      setStep("result");
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }, 3000);
  };

  const handleNew = () => {
    setValuationData(null);
    setStep("form");
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <>
      <Helmet>
        <title>Avaliação Direta | Godoy Prime</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="description"
          content="Avaliação imobiliária baseada em transações reais (ITBI). Preencha o formulário e receba sua estimativa na hora."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-[#F8F6F0] to-white">
        {/* Header minimalista */}
        <header className="border-b border-[#0C2340]/10 bg-white/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={godoyLogo} alt="Godoy Prime" className="h-9 w-auto" />
              <span className="font-semibold text-[#0C2340] hidden sm:inline">
                {BRAND.name}
              </span>
            </Link>
            <a
              href={whatsappUrl(WHATSAPP_MESSAGES.duvidaAvaliacao())}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-[#0C2340] hover:text-[#C9A84C] transition-colors font-medium"
            >
              {PHONE.display}
            </a>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          {step === "form" && (
            <div ref={formRef} className="space-y-6">
              {/* Headline enxuta */}
              <div className="text-center space-y-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0C2340] leading-tight">
                  Avaliação do seu imóvel com{" "}
                  <span className="text-[#C9A84C]">dados oficiais</span> de
                  transações reais
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground">
                  Preencha em 2 minutos e receba sua estimativa preliminar na hora.
                </p>
              </div>

              {/* Selos de confiança */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {TRUST_BADGES.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 bg-white border border-[#0C2340]/15 rounded-full px-3 py-1.5 text-xs sm:text-sm text-[#0C2340] shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-[#C9A84C]" />
                    <span className="font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {/* Formulário em destaque */}
              <div className="pt-2">
                <QuickValuationForm onComplete={handleComplete} origem="avaliacao_direta" />
              </div>
            </div>
          )}

          {step === "loading" && <LoadingScreen />}

          {step === "result" && valuationData && (
            <div ref={resultRef}>
              <Suspense fallback={<LoadingScreen />}>
                <QuickValuationResult data={valuationData} onNewValuation={handleNew} />
              </Suspense>
            </div>
          )}
        </main>

        {/* Rodapé minimalista */}
        <footer className="border-t border-[#0C2340]/10 mt-12 py-6">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} {BRAND.name} — {BRAND.creci}
            </p>
            <div className="flex items-center gap-4">
              <a
                href={whatsappUrl(WHATSAPP_MESSAGES.generico())}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C9A84C] transition-colors"
              >
                WhatsApp {PHONE.display}
              </a>
              <Link
                to="/politica-privacidade"
                className="hover:text-[#C9A84C] transition-colors"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}