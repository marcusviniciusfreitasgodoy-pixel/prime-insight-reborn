import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ValuationWizard } from "@/components/leads/wizard/ValuationWizard";
import logoSymbol from "@/assets/godoy-logo-symbol.png";
import { PHONE, BRAND, whatsappUrl, WHATSAPP_MESSAGES } from "@/config/contact";

export default function AvaliacaoDireta() {
  return (
    <>
      <Helmet>
        <title>Avaliação Direta | Godoy Prime</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="description"
          content="Avaliação imobiliária baseada em transações reais registradas na cidade do Rio de Janeiro. Preencha o formulário e receba sua estimativa na hora."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-[#F8F6F0] text-[#0C2340] antialiased">
        {/* Header navy com logo dourado */}
        <header className="bg-[#0C2340] px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-lg">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <img
              src={logoSymbol}
              alt="Godoy Prime"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div className="border-l border-[#C9A84C]/30 pl-2 sm:pl-3">
              <h1 className="font-bold text-sm sm:text-lg text-white tracking-wider leading-tight">
                GODOY <span className="text-[#C9A84C]">PRIME</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-[#C9A84C] font-semibold tracking-[0.2em] uppercase">
                Avaliação Imobiliária
              </p>
            </div>
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
              © {new Date().getFullYear()} {BRAND.name}, {BRAND.creci}
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