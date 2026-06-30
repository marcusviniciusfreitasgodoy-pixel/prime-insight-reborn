import { useState, useEffect, useRef } from "react";
import { RealCaseComparison } from "@/components/leads/RealCaseComparison";
import marcusPhoto from "@/assets/marcus-godoy-portrait.jpg.asset.json";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useUTMTracking } from "@/hooks/useUTMTracking";
import { PHONE, WHATSAPP_MESSAGES, whatsappUrl, CTA_LABELS } from "@/config/contact";
import { sendCtaClickToCrm } from "@/lib/crmWebhook";
import {
  ArrowRight,
  Shield,
  TrendingUp,
  Award,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Eye,
  Calculator,
  Target,
  Users,
  Home,
  DollarSign,
  BarChart3,
  FileSearch,
  Clock,
  Building2,
  ChevronDown,
  HelpCircle,
  Lock,
  Zap,
  ThumbsUp,
  BadgeCheck,
  Timer,
  Receipt,
  Ban,
  Wallet,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import godoyLogo from "@/assets/godoy-logo-symbol.png";
import heroBackground from "@/assets/hero-barra-luxury.jpg";
import luxuryBleed from "@/assets/luxury-interior-bleed.jpg";
import { useIsMobile } from "@/hooks/use-mobile";

const HERO_STATS = [
  { value: "80.000+", label: "Transações Oficiais", icon: FileSearch },
  { value: "5 Anos", label: "De Dados Históricos", icon: Clock },
  { value: "142", label: "Bairros do Rio", icon: Building2 },
];

const PROBLEMS = [
  { icon: Eye, title: "Anúncios refletem o desejo de proprietários", description: "Preços de anúncios não refletem o valor real de venda. Vendedores pedem mais, compradores oferecem menos." },
  { icon: Calculator, title: "Algoritmos genéricos", description: "Ferramentas online usam fórmulas simplistas que ignoram os diferenciais únicos de cada imóvel e se baseiam em valores anunciados, com objetivo de atrair novos anunciantes." },
  { icon: Target, title: "Falta de dados oficiais", description: "Sem acesso a transações reais, você negocia no escuro e pode perder dinheiro." },
];

const SOLUTIONS = [
  { icon: Shield, title: "Dados Oficiais de Transações", description: "Usamos transações reais registradas e não apenas preços de anúncios, além disso tratamos estatisticamente a nossa base para evitar desvios de avaliação com base em metodologias da NBR.", highlight: "Fonte oficial confiável" },
  { icon: Award, title: "Especialistas em Alto Padrão", description: "Receba avaliações de qualquer Bairro do RJ, porém nosso foco é na região da Barra da Tijuca.", highlight: "Conhecimento local profundo" },
  { icon: BarChart3, title: "Metodologia Transparente", description: "Você vê exatamente como calculamos: base de dados, filtros aplicados e período analisado.", highlight: "Sem caixas-pretas" },
];

const PERSONAS = [
  { icon: Users, title: "Compradores", subtitle: "Quer negociar com confiança?", description: "Saiba se o preço pedido está dentro da realidade de mercado antes de fazer uma proposta.", cta: "Negocie com informações reais e pague o valor justo" },
  { icon: DollarSign, title: "Investidores", subtitle: "Quer identificar oportunidades?", description: "Compare valores por região e tipologia para encontrar as melhores oportunidades de investimento.", cta: "Tome decisões com dados reais" },
  { icon: Home, title: "Proprietários", subtitle: "Seu imóvel está anunciado há mais de 90 dias?", description: "Após 90 dias sem propostas concretas, o mercado já respondeu. Descubra o valor real de transação e reposicione seu anúncio com base em dados e não em achismos e emoção.", cta: "Reposicione seu imóvel e acelere a venda" },
];

const WRONG_PRICE_SELLER = [
  { icon: TrendingDown, title: "Menos Visitas e Interesse", description: "Preço acima da curva filtra seu imóvel nos portais, reduzindo cliques e agendamentos de compradores qualificados." },
  { icon: Timer, title: "Imóvel 'Encalhado'", description: "Semanas ou meses parado criam percepção de problema oculto, queimando seu ativo digitalmente." },
  { icon: Receipt, title: "Custo de Carregar", description: "IPTU, condomínio, manutenção. Cada mês parado é dinheiro saindo do bolso e oportunidade perdida." },
];

const WRONG_PRICE_BUYER = [
  { icon: Wallet, title: "Pagar Acima do Mercado", description: "Sem dados reais de transações, você corre o risco de pagar 20-30% acima do valor justo." },
  { icon: Clock, title: "Oportunidades Perdidas", description: "Enquanto negocia um imóvel supervalorizado, outros compradores fecham as melhores ofertas." },
  { icon: Ban, title: "Financiamento Travado", description: "Banco financia pelo valor de mercado. Preço inflado exige que você cubra a diferença do próprio bolso." },
];

const FAQ_DATA = [
  { category: "usabilidade", icon: Zap, question: "Como funciona a avaliação? É complicado?", answer: "É muito simples! Você preenche seus dados de contato, informa o bairro, endereço e área do imóvel, e em 30 segundos recebe uma estimativa de valor baseada em transações reais. Não precisa de cadastro complexo, download de aplicativo ou conhecimento técnico." },
  { category: "usabilidade", icon: Calculator, question: "Posso fazer quantas consultas quiser?", answer: "Você pode fazer até 2 consultas gratuitas por email. Isso permite avaliar imóveis diferentes ou testar cenários. Se precisar de mais consultas ou uma análise mais detalhada, oferecemos o Parecer Técnico Godoy Prime com análise completa por um especialista." },
  { category: "confianca", icon: Shield, question: "De onde vêm os dados? São confiáveis?", answer: "Usamos dados analisados e registrados oficialmente pelas autoridades no Rio de Janeiro. São registros reais de compra e venda, não preços de anúncios inflacionados. Dados 100% oficiais." },
  { category: "confianca", icon: BadgeCheck, question: "Por que dados oficiais são melhores que preços de anúncios?", answer: "Anúncios mostram o preço que o vendedor DESEJA receber, não o valor real de venda. Pesquisas mostram que a diferença pode chegar a 20-30%. Já os dados oficiais registram o valor que efetivamente foi pago na transação, depois de toda negociação. É o valor real de mercado." },
  { category: "confianca", icon: Lock, question: "Meus dados estão seguros? Vocês vendem informações?", answer: "Seus dados são protegidos com criptografia e armazenados em servidores seguros. Não vendemos, compartilhamos ou divulgamos suas informações para terceiros. Usamos apenas para enviar sua avaliação e, se você autorizar, informações relevantes sobre o mercado imobiliário." },
  { category: "beneficios", icon: TrendingUp, question: "Como essa avaliação me ajuda a vender meu imóvel?", answer: "Conhecendo o valor real de mercado, você pode precificar corretamente seu imóvel desde o início. Imóveis com preço justo vendem em média 3x mais rápido. Você evita perder meses com um preço irrealista e também evita vender abaixo do valor por desconhecimento." },
  { category: "beneficios", icon: DollarSign, question: "Como essa avaliação me ajuda a comprar um imóvel?", answer: "Antes de fazer uma proposta, você descobre se o preço pedido está dentro da realidade de mercado. Com dados reais em mãos, você tem argumentos sólidos para negociar e pode economizar dezenas ou centenas de milhares de reais pagando o valor justo." },
  { category: "beneficios", icon: Target, question: "Qual a vantagem em relação a outras ferramentas online?", answer: "A maioria das ferramentas usa algoritmos genéricos baseados em preços de anúncios. Nossa ferramenta usa dados oficiais de transações reais, específicos para cada região do Rio de Janeiro, com metodologia transparente. Você vê exatamente quantas transações embasam sua estimativa." },
];

const SEO_CONFIG = {
  title: "Avaliação Imóvel Barra da Tijuca em 30s | Godoy Prime",
  description: "Descubra o valor real do seu imóvel na Barra da Tijuca em 30s, com base em +80.000 transações oficiais. Gratuito e sem compromisso.",
  keywords: "avaliação imóvel gratuita, valor imóvel Barra da Tijuca, preço m2 Rio de Janeiro, quanto vale meu apartamento, transações oficiais, avaliação online, valor real imóvel",
  canonical: "https://avaliacao.godoyprime.com.br",
  ogImage: "https://avaliacao.godoyprime.com.br/og-image.jpg",
};

export default function AvaliacaoPublica() {
  const [weeklySlots, setWeeklySlots] = useState(5);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const problemReveal = useScrollReveal(0.15);
  const solutionReveal = useScrollReveal(0.15);
  const personaReveal = useScrollReveal(0.15);
  const serviceReveal = useScrollReveal(0.15);

  const { utmParams, hasUTM } = useUTMTracking();

  useEffect(() => {
    const fetchWeeklyCount = async () => {
      try {
        const { count, error } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        if (!error && count !== null) {
          setWeeklySlots(Math.max(0, 15 - count));
        }
      } catch {
        setWeeklySlots(5);
      }
    };
    fetchWeeklyCount();
  }, []);

  const goToWizard = (tipo?: string) => {
    const qs = tipo ? `?tipo=${tipo}` : "";
    navigate(`/avaliacao-direta${qs}`);
  };

  const scrollToSelector = () => {
    document.getElementById("seletor-topo")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const heroRef = useRef<HTMLElement | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Helmet>
        <title>{SEO_CONFIG.title}</title>
        <meta name="title" content={SEO_CONFIG.title} />
        <meta name="description" content={SEO_CONFIG.description} />
        <meta name="keywords" content={SEO_CONFIG.keywords} />
        <link rel="canonical" href={SEO_CONFIG.canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SEO_CONFIG.canonical} />
        <meta property="og:title" content={SEO_CONFIG.title} />
        <meta property="og:description" content={SEO_CONFIG.description} />
        <meta property="og:image" content={SEO_CONFIG.ogImage} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Godoy Prime Realty" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={SEO_CONFIG.canonical} />
        <meta property="twitter:title" content={SEO_CONFIG.title} />
        <meta property="twitter:description" content={SEO_CONFIG.description} />
        <meta property="twitter:image" content={SEO_CONFIG.ogImage} />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Godoy Prime Realty" />
        <meta name="geo.region" content="BR-RJ" />
        <meta name="geo.placename" content="Rio de Janeiro" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateAgent",
            name: "Godoy Prime Realty",
            description: "Avaliação imobiliária premium baseada em dados oficiais de transações",
            url: SEO_CONFIG.canonical,
            logo: "https://avaliacao.godoyprime.com.br/godoy-logo.png",
            telephone: PHONE.intl,
            email: "contato@godoyprime.com.br",
            address: { "@type": "PostalAddress", addressLocality: "Rio de Janeiro", addressRegion: "RJ", addressCountry: "BR" },
            areaServed: { "@type": "City", name: "Rio de Janeiro" },
            priceRange: "$$$$",
            sameAs: ["https://www.instagram.com/godoyprime"],
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Avaliação Imobiliária Gratuita",
            description: "Descubra o valor real do seu imóvel baseado em +80.000 transações oficiais registradas",
            provider: { "@type": "RealEstateAgent", name: "Godoy Prime Realty" },
            areaServed: { "@type": "City", name: "Rio de Janeiro" },
            offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
          })}
        </script>
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* ============ STICKY CTA BAR ============ */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            showStickyBar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="bg-[#071829]/90 backdrop-blur-md border-b border-white/10">
            <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-white/90 text-xs sm:text-sm font-medium truncate">
                Saber o valor do meu imóvel
              </span>
              <button
                onClick={scrollToSelector}
                className="shrink-0 bg-[#C4993A] hover:bg-[#9E7B2A] text-[#0C2340] font-mono font-medium uppercase tracking-[0.18em] text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 rounded-[2px] transition-colors"
              >
                Começar →
              </button>
            </div>
          </div>
        </div>

        {/* ============ HERO ============ */}
        <section ref={heroRef} className="relative text-white overflow-hidden">
          <img src={heroBackground} alt="" loading="eager" decoding="async" fetchPriority="high" width={1920} height={1080} className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0C2340]/95 via-[#0C2340]/90 to-[#1a3a5c]/85" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
          </div>

          <header className="relative z-10 container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={godoyLogo} alt="Godoy Prime" loading="eager" decoding="async" width={48} height={48} className="h-10 md:h-12 w-auto drop-shadow-lg" />
              <div className="hidden sm:block">
                <h1 className="font-semibold text-base md:text-lg tracking-tight">Godoy Prime Realty</h1>
                <p className="text-xs text-[#D4AF37] font-medium">Avaliação Imobiliária Premium</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/faq" className="hidden sm:flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
                <HelpCircle className="h-4 w-4" />
                FAQ
              </Link>
              <Button onClick={() => goToWizard()} className="bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] tracking-widest uppercase text-xs font-semibold transition-colors duration-300" size="sm">
                Consultar Valor
              </Button>
            </div>
          </header>

          <div className="relative z-10 container mx-auto px-4 py-12 md:py-20 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-[#D4AF37] animate-fade-in">
                <BadgeCheck className="h-3.5 w-3.5" />
                <span className="font-mono font-medium tracking-tight normal-case">+80.000</span> transações oficiais analisadas
              </div>

              <h2 className="font-serif text-3xl md:text-5xl font-bold tracking-tight animate-fade-in [animation-delay:150ms]">
                <span className="text-white">Saiba quanto vale seu imóvel com </span>
                <span className="text-[#D4AF37]">dados oficiais</span>
                <span className="text-white"> de transações reais</span>
              </h2>

              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto animate-fade-in [animation-delay:300ms]">
                Avaliação gratuita em 4 passos. Sem cadastro até ver o resultado.
              </p>

              {/* Card de entrada: escolha do tipo de imóvel */}
              <div id="seletor-topo" className="max-w-2xl mx-auto pt-6 animate-fade-in [animation-delay:450ms] scroll-mt-24">
                <div className="bg-white/[0.06] backdrop-blur-md border border-white/15 rounded-[2px] p-5 sm:p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
                  <p className="text-sm sm:text-base text-white/80 mb-4 font-medium">
                    Selecione o tipo do seu imóvel para começar:
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { tipo: "apartamento", label: "Apartamento", Icon: Building2 },
                      { tipo: "casa", label: "Casa", Icon: Home },
                      { tipo: "cobertura", label: "Cobertura", Icon: Sparkles },
                    ].map(({ tipo, label, Icon }) => (
                      <button
                        key={tipo}
                        onClick={() => goToWizard(tipo)}
                        className="group flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-[#D4AF37] hover:text-[#0C2340] border border-white/20 hover:border-[#D4AF37] rounded-[2px] py-4 sm:py-5 px-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-10px_rgba(212,175,55,0.5)]"
                      >
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-[#D4AF37] group-hover:text-[#0C2340] transition-colors" />
                        <span className="text-xs sm:text-sm font-semibold tracking-wide">{label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-5 text-[11px] sm:text-xs text-white/70">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#D4AF37]" />Menos de 2 minutos</span>
                    <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-[#D4AF37]" /><span className="font-mono font-medium tracking-tight">100%</span> gratuito</span>
                    <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-[#D4AF37]" />Sem cadastro inicial</span>
                  </div>
                </div>
              </div>

              {/* Prévia ilustrativa da Estimativa de Mercado */}
              <div className="max-w-2xl mx-auto pt-4 animate-fade-in [animation-delay:550ms]">
                <div className="bg-[#1A1208] border border-[#C4993A]/30 rounded-[4px] overflow-hidden text-left shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
                  {/* Topo */}
                  <div className="px-5 sm:px-6 py-4 flex items-center gap-2 border-b border-[#C4993A]/20">
                    <ArrowRight className="h-3.5 w-3.5 -rotate-45 text-[#C4993A]" />
                    <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C4993A]">
                      Estimativa de Mercado · Prime Circle
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    {/* 3 boxes: Mínimo / Médio / Máximo */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { label: "Mínimo", value: "R$ 1.180.000", highlight: false },
                        { label: "Médio", value: "R$ 1.250.000", highlight: true },
                        { label: "Máximo", value: "R$ 1.310.000", highlight: false },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-[3px] px-2 sm:px-3 py-4 sm:py-5 text-center border ${
                            item.highlight
                              ? "bg-[#2A1D0C] border-[#C4993A]/60"
                              : "bg-[#241810] border-white/5"
                          }`}
                        >
                          <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-white/55 mb-2">
                            {item.label}
                          </p>
                          <p
                            className={`font-serif text-base sm:text-xl tracking-tight ${
                              item.highlight ? "text-[#D4AF37]" : "text-white/90"
                            }`}
                          >
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* R$/m² */}
                    <p className="font-mono text-[11px] sm:text-xs text-white/55">
                      R$/m²: mín <span className="text-white/85">R$ 8.310</span> · médio{" "}
                      <span className="text-white/85">R$ 8.803</span> · máx{" "}
                      <span className="text-white/85">R$ 9.225</span>
                    </p>

                    <div className="border-t border-dashed border-white/15" />

                    {/* Base de transações */}
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                      Baseado em <span className="font-mono font-semibold text-[#D4AF37]">89</span>{" "}
                      transações reais realizadas na região nos últimos 12 meses
                    </p>

                    {/* Tipo/Localização + Área */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="rounded-[3px] bg-[#241810] border border-white/5 px-3 sm:px-4 py-3">
                        <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-white/55 mb-1.5">
                          Tipo · Localização
                        </p>
                        <p className="text-sm text-white/90">Apartamento · Barra da Tijuca</p>
                      </div>
                      <div className="rounded-[3px] bg-[#241810] border border-white/5 px-3 sm:px-4 py-3">
                        <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-white/55 mb-1.5">
                          Área
                        </p>
                        <p className="text-sm text-white/90">142 m²</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Disclaimer separado */}
                <div className="mt-3 bg-[#1A1208] border border-[#C4993A]/15 rounded-[4px] px-5 sm:px-6 py-4 flex gap-3">
                  <ArrowRight className="h-3.5 w-3.5 -rotate-45 text-[#C4993A] mt-1 shrink-0" />
                  <p className="text-[11px] sm:text-xs text-white/60 leading-relaxed">
                    Estimativa estatística baseada em transações reais da região nos últimos 12 meses.
                    Não é laudo formal nos termos da NBR 14653. Para imóveis exclusivos, a variação
                    pode chegar a 15%. Para o Parecer Técnico formal com validação do especialista
                    credenciado, acesse a plataforma.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 pt-6 sm:pt-8 border-t border-white/10 mt-6 sm:mt-8 animate-fade-in [animation-delay:600ms]">
                {HERO_STATS.map((stat, index) => (
                  <div key={index} className="text-center hover:scale-105 transition-transform duration-300 cursor-default">
                    <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#D4AF37] mx-auto mb-1 sm:mb-2" />
                    <p className="text-lg sm:text-xl md:text-3xl font-mono font-medium tracking-tight">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-white/60 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            
          </div>
        </section>

        {/* ============ PROBLEM ============ */}
        <section className="relative py-10 sm:py-12 md:py-14 px-4 bg-[#F3EBE0] overflow-hidden">
          {/* Decorative SVG elements */}
          <div className="absolute top-10 -right-20 w-64 h-64 rounded-full border border-[#8C8278]/15 opacity-40" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full border border-[#8C8278]/10 opacity-30" />
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="text-center mb-8 sm:mb-10">
              <div className="w-12 h-px bg-[#D4AF37] mx-auto mb-6" />
              <h3 className="font-serif text-xl sm:text-2xl md:text-4xl font-bold text-[#0C2340] mb-3 sm:mb-4 leading-tight px-2">Por Que Você Está Negociando no Escuro?</h3>
              <p className="text-left text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                A diferença entre o preço anunciado e o valor real de venda pode chegar a <span className="font-mono font-medium tracking-tight text-[#D4AF37]">30%</span>, isto significa diferenças de até <span className="font-mono font-medium tracking-tight text-[#D4AF37]">R$ 400.000</span> ou mais.
              </p>
            </div>
            <div ref={problemReveal.ref} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
              {PROBLEMS.map((problem, index) => (
                <div
                  key={index}
                  className={`group flex flex-row items-start gap-4 bg-[#FAFAF8] p-5 sm:p-6 border border-[#8C8278]/20 border-l-4 border-l-[#8C8278] hover:border-l-[#0C2340] transition-colors duration-500 h-full ${problemReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 150}ms`, borderRadius: '2px' }}
                >
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-[#8C8278]/10 flex items-center justify-center" style={{ borderRadius: '2px' }}>
                    <problem.icon className="h-6 w-6 sm:h-7 sm:w-7 text-[#8C8278]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-[#0C2340] mb-1">{problem.title}</h4>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{problem.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <button onClick={scrollToSelector} className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-[#C4993A] hover:text-[#9E7B2A] transition-colors">
                Começar minha avaliação →
              </button>
            </div>
          </div>
        </section>

        <RealCaseComparison />
        <div className="bg-[#F3EBE0] pt-2 pb-8 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <button onClick={scrollToSelector} className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-[#C4993A] hover:text-[#9E7B2A] transition-colors">
              Começar minha avaliação →
            </button>
          </div>
        </div>

        {/* ============ AUTHORITY / WHO SIGNS ============ */}
        <section className="py-10 sm:py-12 md:py-14 px-4 bg-[#F3EBE0]">
          <div className="container mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 items-stretch rounded-[2px] overflow-hidden">
              <div className="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-auto md:h-full md:min-h-[480px] bg-[#1E1B18] overflow-hidden">
                <img
                  src={marcusPhoto.url}
                  alt="Marcus Godoy, perito avaliador imobiliário"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: "center 22%", filter: "grayscale(100%) contrast(1.05) brightness(.95)" }}
                />
              </div>
              <div className="bg-[#1E1B18] p-8 sm:p-10 md:p-12 flex flex-col justify-center">
                <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#C4993A] mb-5">
                  ✦ QUEM ASSINA SUA AVALIAÇÃO
                </p>
                <p className="font-serif italic text-xl sm:text-2xl md:text-[26px] leading-snug text-[#F3EBE0] mb-7">
                  "O mercado não foi desenhado para o comprador. Aqui, o interesse é um só: o seu."
                </p>
                <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.18em] text-[#CCC4B8] mb-6">
                  MARCUS GODOY · PERSONAL SHOPPER IMOBILIÁRIO
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "CRECI/RJ", value: "80.199" },
                    { label: "PERITO", value: "TJRJ" },
                    { label: "METODOLOGIA ABNT NBR", value: "14.653" },
                  ].map((c) => (
                    <span
                      key={c.label}
                      className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#CCC4B8] border border-[#CCC4B8]/30 px-2.5 py-1 rounded-[2px]"
                    >
                      {c.label} <span className="text-[#C4993A]">{c.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SOLUTION ============ */}
        <section className="py-12 sm:py-14 md:py-16 px-4 bg-[#D4AF37]/[0.04]">
          <div className="container mx-auto max-w-6xl">
            <div ref={solutionReveal.ref} className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start">
              {/* Coluna esquerda: texto */}
              <div className="md:col-span-5">
                <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[#C4993A] mb-4">
                  ✦ A Solução
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#0C2340] leading-tight mb-5">
                  A Solução Que Muda Tudo
                </h3>
                <p className="text-sm sm:text-base text-[#4A443C] leading-relaxed mb-6">
                  Avaliação imparcial baseada em dados de transações reais, e não em plataformas que privilegiam vendedores, achismos ou opiniões de vizinhos.
                </p>
                <button
                  onClick={scrollToSelector}
                  className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-[#C4993A] hover:text-[#9E7B2A] transition-colors"
                >
                  Começar minha avaliação →
                </button>
              </div>

              {/* Coluna direita: lista de pontos */}
              <ul className="md:col-span-7 divide-y divide-[#0C2340]/10 border-t border-b border-[#0C2340]/10">
                {SOLUTIONS.map((solution, index) => (
                  <li
                    key={index}
                    className={`py-5 sm:py-6 flex gap-4 transition-all duration-500 ${
                      solutionReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${index * 120}ms` }}
                  >
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#C4993A] shrink-0" aria-hidden />
                    <div>
                      <h4 className="font-serif text-lg sm:text-xl font-bold text-[#0C2340] mb-1.5">
                        {solution.title}
                      </h4>
                      <p className="text-sm text-[#4A443C] leading-relaxed mb-2">{solution.description}</p>
                      <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-[#8C8278]">
                        {solution.highlight}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ============ FULL-BLEED LUXURY IMAGE ============ */}
        <div className="relative w-full h-56 sm:h-72 md:h-96 overflow-hidden bg-[#0C2340]">
          <img
            src={luxuryBleed}
            alt="Interior de imóvel de alto padrão na Barra da Tijuca"
            loading="lazy"
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C2340]/10 via-transparent to-[#0C2340]/40" />
        </div>

        {/* ============ PARA QUEM ============ */}
        <section className="py-10 sm:py-12 md:py-14 px-4 bg-[#0C2340]">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-8 sm:mb-10">
              <div className="w-12 h-px bg-[#D4AF37] mx-auto mb-6" />
              <h3 className="font-serif text-xl sm:text-2xl md:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">Para Quem É Esta Avaliação?</h3>
            </div>
            <div ref={personaReveal.ref} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {PERSONAS.map((persona, index) => (
                <div key={index} className={`group relative bg-white/8 backdrop-blur-md rounded-[2px] sm:rounded-[2px] p-6 sm:p-8 border border-white/15 hover:border-[#D4AF37]/60 hover:bg-white/15 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] transition-all duration-500 text-left ${personaReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${index * 200}ms` }}>
                  {/* Glow circle behind icon */}
                  <div className="relative mb-4 w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/20 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-500" />
                    <persona.icon className="relative h-8 w-8 text-[#D4AF37] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h4 className="font-serif font-bold text-lg sm:text-xl text-white mb-1">{persona.title}</h4>
                  <p className="text-[#D4AF37] font-medium text-xs sm:text-sm mb-3">{persona.subtitle}</p>
                  <p className="text-white/70 text-xs sm:text-sm mb-4 leading-relaxed whitespace-pre-line">{persona.description}</p>
                  <div className="inline-flex items-center gap-2 text-xs text-white/60 bg-white/5 rounded-full px-3 py-1.5 group-hover:bg-white/10 transition-colors duration-300">
                    <CheckCircle className="h-3.5 w-3.5 text-[#D4AF37] flex-shrink-0" />
                    {persona.cta}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ O QUE ACONTECE APÓS ============ */}
        <section className="py-10 sm:py-12 md:py-14 px-4 bg-[#0C2340]">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-8 sm:mb-10">
              <div className="w-12 h-px bg-[#D4AF37] mx-auto mb-6" />
              <h3 className="font-serif text-xl sm:text-2xl md:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">O Que Acontece Após a Avaliação?</h3>
              <p className="text-left text-white/60 max-w-2xl mx-auto text-sm sm:text-base">
                A avaliação gratuita é o primeiro passo. Para quem está em negociação ativa, oferecemos serviços especializados em três níveis:
              </p>
            </div>

            <div ref={serviceReveal.ref} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Card 1 */}
              <div className={`group relative bg-white/10 backdrop-blur-sm rounded-[2px] sm:rounded-[2px] p-6 sm:p-8 border border-white/15 hover:border-[#D4AF37]/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all duration-500 overflow-hidden ${serviceReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <span className="absolute top-3 right-4 text-5xl sm:text-6xl font-bold text-white/[0.06] group-hover:text-white/[0.12] transition-all duration-500 select-none leading-none">01</span>
                <Shield className="h-8 w-8 text-[#D4AF37] mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h4 className="font-serif font-bold text-lg sm:text-xl text-white mb-2 text-left">Parecer Godoy Prime</h4>
                <p className="text-white/60 text-xs sm:text-sm text-left leading-relaxed whitespace-pre-line">
                  Você já tem um imóvel em vista e quer saber se o preço é justo{"\n"}
                  Laudo técnico completo com vistoria presencial, análise de valor real e recomendação de preço justo para negociar com fundamento técnico.
                </p>
              </div>

              {/* Card 2: Compra Blindada */}
              <div className={`group relative bg-white/10 backdrop-blur-sm rounded-[2px] sm:rounded-[2px] p-6 sm:p-8 border border-white/15 hover:border-[#D4AF37]/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all duration-500 overflow-hidden ${serviceReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
                <span className="absolute top-3 right-4 text-5xl sm:text-6xl font-bold text-white/[0.06] group-hover:text-white/[0.12] transition-all duration-500 select-none leading-none">02</span>
                <Lock className="h-8 w-8 text-[#D4AF37] mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h4 className="font-serif font-bold text-lg sm:text-xl text-white mb-2 text-left">Compra Blindada</h4>
                <p className="text-white/60 text-xs sm:text-sm text-left leading-relaxed">
                  Proteção completa para quem já encontrou o imóvel. Inclui laudo técnico com vistoria presencial + condução integral da negociação + due diligence documental + acompanhamento até a assinatura do contrato. Tudo com um único especialista ao seu lado.
                </p>
              </div>

              {/* Card 3: Prime Buyer Experience (destacado) */}
              <div className={`group relative bg-white/10 backdrop-blur-sm rounded-[2px] pt-9 sm:pt-10 px-6 sm:px-8 pb-6 sm:pb-8 border border-[#D4AF37] transition-colors duration-500 overflow-hidden ${serviceReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>
                <span className="absolute top-3 right-4 text-5xl sm:text-6xl font-bold text-[#D4AF37]/[0.1] group-hover:text-[#D4AF37]/[0.2] transition-all duration-500 select-none leading-none">03</span>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#C4993A] text-[#0C2340] font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-b-[2px] whitespace-nowrap">
                  Mais Completo
                </div>
                <Sparkles className="h-8 w-8 text-[#D4AF37] mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />
                <h4 className="font-serif font-bold text-lg sm:text-xl text-white mb-2 text-left">Prime Buyer Experience</h4>
                <p className="text-white/60 text-xs sm:text-sm text-left leading-relaxed">
                  Representação completa durante todo o processo de compra: curadoria, análise técnica, negociação blindada e acompanhamento total do início ao fechamento.
                </p>
              </div>
            </div>

            <p className="text-left text-sm sm:text-base text-white/50 mt-10 sm:mt-12 max-w-2xl mx-auto">
              Faça sua avaliação gratuita agora e descubra qual nível de proteção faz sentido para a sua negociação.
            </p>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="relative overflow-hidden bg-[#071829] py-14 sm:py-20 md:py-24 px-4">
          {/* Subtle gold glow accent */}
          <div
            className="pointer-events-none absolute -top-32 -right-32 w-[480px] h-[480px] opacity-[0.18]"
            style={{ background: 'radial-gradient(circle, #C4993A 0%, transparent 60%)' }}
          />
          <div className="container mx-auto max-w-3xl relative z-10">
            <p className="font-mono text-[11px] sm:text-xs font-medium tracking-[0.25em] uppercase text-[#C4993A] mb-5">
              ✦ Avaliação gratuita
            </p>
            <h3 className="font-serif text-2xl sm:text-3xl md:text-5xl font-bold text-white leading-[1.1] mb-5 max-w-2xl">
              Pronto para descobrir o valor do seu imóvel?
            </h3>
            <p className="font-mono text-sm sm:text-base text-[#CCC4B8] mb-9 max-w-xl">
              Comece agora, leva apenas <span className="text-white">30</span> segundos.
            </p>
            <Button
              onClick={() => goToWizard()}
              size="lg"
              style={{ borderRadius: '2px' }}
              className="bg-[#C4993A] hover:bg-[#9E7B2A] text-[#071829] tracking-[0.18em] uppercase text-xs font-semibold px-8 py-4 h-auto transition-colors duration-300 w-full sm:w-auto"
            >
              <span>Quero saber o valor do meu imóvel</span>
              <ArrowRight className="ml-2 h-4 w-4 flex-shrink-0" />
            </Button>
            <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
              <p className="font-mono text-xs sm:text-sm text-[#CCC4B8]">
                Atendemos no máximo <span className="text-white">4</span> clientes por mês.
              </p>
              <p className="font-mono text-[11px] sm:text-xs text-[#8C8278]">
                Resultado em <span className="text-[#CCC4B8]">30</span> segundos · Sem compromisso · Dados <span className="text-[#CCC4B8]">100%</span> seguros
              </p>
            </div>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="py-10 sm:py-12 md:py-14 px-4 bg-[#F8F6F0] bg-[radial-gradient(circle,_rgba(212,175,55,0.06)_1px,_transparent_1px)] bg-[length:24px_24px]">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8 sm:mb-10">
              <div className="w-12 h-px bg-[#D4AF37] mx-auto mb-6" />
              <h3 className="font-serif text-2xl md:text-4xl font-bold text-[#0C2340] mb-4">Tire Suas Dúvidas</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">Respondemos as principais perguntas sobre a ferramenta, segurança dos dados e como ela pode ajudar você.</p>
            </div>

            <div className="space-y-8">
              {([
                { key: "usabilidade", label: "Como Usar", icon: Zap, color: "border border-[#C4993A]/40 bg-transparent", iconColor: "text-[#C4993A]" },
                { key: "confianca", label: "Confiança e Segurança", icon: Shield, color: "border border-[#8C8278]/40 bg-transparent", iconColor: "text-[#8C8278]" },
                { key: "beneficios", label: "Benefícios", icon: TrendingUp, color: "border border-[#8C8278]/40 bg-transparent", iconColor: "text-[#8C8278]" },
              ] as const).map(({ key, label, icon: Icon, color, iconColor }) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-[2px] ${color} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                    <h4 className="font-bold text-lg text-[#0C2340]">{label}</h4>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {FAQ_DATA.filter((f) => f.category === key).map((faq, index) => (
                      <AccordionItem key={`${key}-${index}`} value={`${key}-${index}`} className="bg-white rounded-[2px] border border-gray-100 px-4 hover:border-[#D4AF37]/20 hover:shadow-sm transition-all duration-300 data-[state=open]:bg-[#D4AF37]/5 data-[state=open]:border-[#D4AF37]/30">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <span className="text-left font-medium text-[#0C2340]">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">Ainda tem dúvidas?</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => goToWizard()} className="bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] tracking-widest uppercase text-xs font-semibold px-8 py-3 rounded-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto">
                    <Calculator className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Fazer Minha Avaliação Gratuita</span>
                  </Button>
                  <Button variant="outline" onClick={() => { sendCtaClickToCrm("whatsapp_duvida_avaliacao"); window.open(whatsappUrl(WHATSAPP_MESSAGES.duvidaAvaliacao()), "_blank"); }} className="border-[#0C2340]/20 tracking-wide uppercase text-xs font-semibold transition-colors duration-300 w-full sm:w-auto">
                    <MessageCircle className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Falar com Especialista</span>
                  </Button>
                </div>
            </div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="py-12 px-4 bg-[#0C2340]">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                  <img src={godoyLogo} alt="Godoy Prime" loading="lazy" decoding="async" width={40} height={40} className="h-10 w-auto" />
                  <div>
                    <h4 className="font-serif font-semibold text-white">Godoy Prime Realty</h4>
                    <p className="text-xs text-[#D4AF37]">CRECI 11841/PJ - 80199/PF</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm max-w-md">Especialistas em imóveis de alto padrão na Barra da Tijuca. Avaliações baseadas em transações oficiais da cidade do Rio de Janeiro.</p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-white/80 text-sm mb-2">Av. das Américas, 10101 - Bloco 2, Sala 316</p>
                <div className="flex flex-col sm:flex-row justify-center md:justify-end gap-2 sm:gap-4 text-sm">
                  <a href={PHONE.tel} className="text-white/80 hover:text-[#D4AF37] transition-colors">📞 {PHONE.display}</a>
                  <a href={`https://wa.me/${PHONE.e164}`} target="_blank" rel="noopener noreferrer" onClick={() => sendCtaClickToCrm("whatsapp_footer")} className="text-white/80 hover:text-[#D4AF37] transition-colors">💬 WhatsApp</a>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-white/40 text-xs">© {new Date().getFullYear()} Godoy Prime Realty. Todos os direitos reservados.</p>
              <p className="text-white/30 text-[10px] leading-relaxed max-w-xl">Aviso: Esta é uma estimativa automática baseada em dados históricos de transações oficiais. Não substitui um laudo técnico assinado por perito avaliador.</p>
              <div className="flex items-center gap-4">
                <Link to="/politica-privacidade" className="text-white/40 text-xs hover:text-[#D4AF37] transition-colors">Política de Privacidade</Link>
                <span className="text-white/20">|</span>
                <span className="text-white/40 text-xs">Desenvolvido por Godoy Prime Realty</span>
                <span className="text-white/20">|</span>
                <Link to="/auth" className="text-white/30 text-xs hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </footer>

      </main>
    </>
  );
}
