import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { ValuationWizard } from "@/components/leads/wizard/ValuationWizard";
import logoSymbol from "@/assets/godoy-logo-symbol.png";
import { BRAND } from "@/config/contact";
import { Clock3, Database, BadgeCheck } from "lucide-react";

export default function AvaliacaoDireta() {
  const [searchParams] = useSearchParams();
  const isSellerProfile = searchParams.get("perfil")?.toLowerCase() === "vendedor";

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
        <header className="bg-[#0C2340] px-4 sm:px-6 py-3 flex justify-center items-center">
          <div className="flex items-center gap-2 sm:gap-3" aria-label="Godoy Prime Realty">
            <img
              src={logoSymbol}
              alt="Godoy Prime"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div className="border-l border-[#C9A84C]/30 pl-2 sm:pl-3">
              <p className="font-bold text-sm sm:text-lg text-white tracking-wider leading-tight">
                GODOY <span className="text-[#C9A84C]">PRIME</span>
              </p>
              <p className="text-[9px] sm:text-[10px] text-[#C9A84C] font-semibold tracking-[0.2em] uppercase">
                Avaliação Imobiliária
              </p>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-grow flex flex-col items-center px-4 py-5 sm:py-7">
          {/* Hero */}
          <div className="text-center max-w-3xl mb-5 sm:mb-6">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight text-[#0C2340]"
            >
              {isSellerProfile ? (
                <>Descubra por quanto seu imóvel realmente vende na Barra, por <span className="text-[#C9A84C]">transações reais registradas</span></>
              ) : (
                <>Avaliação do seu imóvel com <span className="text-[#C9A84C]">transações reais</span> registradas na cidade do Rio de Janeiro</>
              )}
            </h1>
            <p className="text-[#4A443C] text-sm sm:text-base">
              {isSellerProfile ? "Em 3 passos rápidos. Sem cadastro até ver o resultado." : "Em 4 passos rápidos. Sem cadastro até ver o resultado."}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-y border-[#0C2340]/10 py-3">
              {[
                { Icon: Clock3, label: "Resultado na hora" },
                { Icon: Database, label: "Transações reais registradas" },
                { Icon: BadgeCheck, label: "Perito TJRJ" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex flex-col sm:flex-row items-center justify-center gap-1.5 text-[#0C2340]">
                  <Icon className="h-4 w-4 text-[#C9A84C] shrink-0" />
                  <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.08em] leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Wizard */}
          <div className="w-full max-w-2xl">
            <ValuationWizard origem={isSellerProfile ? "avaliacao_direta_vendedor" : "avaliacao_direta"} sellerProfile={isSellerProfile} />
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