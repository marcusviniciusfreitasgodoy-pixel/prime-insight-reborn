import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ValuationWizard } from "@/components/leads/wizard/ValuationWizard";
import { PHONE, BRAND, whatsappUrl, WHATSAPP_MESSAGES } from "@/config/contact";

export default function AvaliacaoDireta() {
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

      <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#0C2340] antialiased">
        {/* Header navy com logo dourado */}
        <header className="bg-[#0C2340] px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-lg">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full text-[#C9A84C]"
                aria-hidden="true"
              >
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-white font-bold text-lg sm:text-xl tracking-tight uppercase">
              Godoy <span className="text-[#C9A84C]">Prime</span>
            </span>
          </Link>
          <a
            href={whatsappUrl(WHATSAPP_MESSAGES.duvidaAvaliacao())}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-[#C9A84C] transition-colors font-medium text-xs sm:text-sm"
          >
            {PHONE.display}
          </a>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-grow flex flex-col items-center px-4 py-10 sm:py-14">
          {/* Hero */}
          <div className="text-center max-w-3xl mb-10 sm:mb-12">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight text-[#0C2340]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Avaliação do seu imóvel com{" "}
              <span className="text-[#C9A84C]">dados oficiais</span> de
              transações reais
            </h1>
            <p className="text-slate-500 text-base sm:text-lg">
              Em 4 passos rápidos. Sem cadastro até ver o resultado.
            </p>
          </div>

          {/* Wizard */}
          <div className="w-full max-w-2xl">
            <ValuationWizard origem="avaliacao_direta" />
          </div>
        </main>

        {/* Rodapé minimalista */}
        <footer className="py-8 px-6 border-t border-slate-200">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">
            <p className="text-center md:text-left">
              © {new Date().getFullYear()} {BRAND.name} — {BRAND.creci}
            </p>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
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