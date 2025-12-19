import { useState, useRef, useEffect, memo } from "react";
import { Helmet } from "react-helmet-async";
import { QuickValuationForm, QuickValuationData } from "@/components/leads/QuickValuationForm";
import { QuickValuationResult } from "@/components/leads/QuickValuationResult";
import { PublicSofiaAssistant } from "@/components/leads/PublicSofiaAssistant";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useUTMTracking } from "@/hooks/useUTMTracking";
import { ArrowRight, Shield, TrendingUp, Award, CheckCircle, AlertCircle, MessageCircle, Eye, Calculator, Target, Users, Home, DollarSign, BarChart3, FileSearch, Clock, Building2, ChevronDown, HelpCircle, Lock, Zap, ThumbsUp, BadgeCheck, Timer, Receipt, Ban, Wallet, TrendingDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import godoyLogo from "@/assets/godoy-logo-symbol.png";
import heroBackground from "@/assets/hero-barra-luxury.jpg";
type Step = "form" | "result";

// Stats for hero
const HERO_STATS = [{
  value: "80.000+",
  label: "Transações Oficiais",
  icon: FileSearch
}, {
  value: "5 Anos",
  label: "De Dados Históricos",
  icon: Clock
}, {
  value: "142",
  label: "Bairros do Rio",
  icon: Building2
}];

// Problems section data
const PROBLEMS = [{
  icon: Eye,
  title: "Anúncios inflacionados",
  description: "Preços de anúncios não refletem o valor real de venda. Vendedores pedem mais, compradores oferecem menos."
}, {
  icon: Calculator,
  title: "Algoritmos genéricos",
  description: "Ferramentas online usam fórmulas simplistas que ignoram os diferenciais únicos de cada imóvel."
}, {
  icon: Target,
  title: "Falta de dados oficiais",
  description: "Sem acesso a transações reais, você negocia no escuro e pode perder dinheiro."
}];

// Solutions section data
const SOLUTIONS = [{
  icon: Shield,
  title: "Dados Oficiais ITBI",
  description: "Usamos transações reais registradas na Prefeitura do RJ, não apenas preços de anúncios.",
  highlight: "Fonte governamental confiável"
}, {
  icon: Award,
  title: "Especialistas em Alto Padrão",
  description: "Foco exclusivo em Barra da Tijuca e bairros nobres do Rio com metodologia específica.",
  highlight: "Conhecimento local profundo"
}, {
  icon: BarChart3,
  title: "Metodologia Transparente",
  description: "Você vê exatamente como calculamos: base de dados, filtros aplicados e período analisado.",
  highlight: "Sem caixas-pretas"
}];

// Audience personas
const PERSONAS = [{
  icon: Home,
  title: "Proprietários",
  subtitle: "Quer vender pelo melhor preço?",
  description: "Descubra o valor real do seu imóvel baseado em transações oficiais e negocie com segurança.",
  cta: "Posicione seu imóvel com preço correto e evite perder meses tentando vender sem sucesso."
}, {
  icon: Users,
  title: "Compradores",
  subtitle: "Quer negociar com confiança?",
  description: "Saiba se o preço pedido está dentro da realidade de mercado antes de fazer uma proposta.",
  cta: "Negocie com informações reais e pague o valor justo"
}, {
  icon: DollarSign,
  title: "Investidores",
  subtitle: "Quer identificar oportunidades?",
  description: "Compare valores por região e tipologia para encontrar as melhores oportunidades de investimento.",
  cta: "Tome decisões com dados reais"
}];

// Wrong price impacts - bilateral view for sellers and buyers
const WRONG_PRICE_SELLER = [
  {
    icon: TrendingDown,
    title: "Menos Visitas e Interesse",
    description: "Preço acima da curva filtra seu imóvel nos portais, reduzindo cliques e agendamentos de compradores qualificados."
  },
  {
    icon: Timer,
    title: "Imóvel 'Encalhado'",
    description: "Semanas ou meses parado criam percepção de problema oculto, queimando seu ativo digitalmente."
  },
  {
    icon: Receipt,
    title: "Custo de Carregar",
    description: "IPTU, condomínio, manutenção — cada mês parado é dinheiro saindo do bolso e oportunidade perdida."
  }
];

const WRONG_PRICE_BUYER = [
  {
    icon: Wallet,
    title: "Pagar Acima do Mercado",
    description: "Sem dados reais de transações, você corre o risco de pagar 20-30% acima do valor justo."
  },
  {
    icon: Clock,
    title: "Oportunidades Perdidas",
    description: "Enquanto negocia um imóvel supervalorizado, outros compradores fecham as melhores ofertas."
  },
  {
    icon: Ban,
    title: "Financiamento Travado",
    description: "Banco financia pelo valor de mercado. Preço inflado exige que você cubra a diferença do próprio bolso."
  }
];

// FAQ Data - Perguntas frequentes com objeções e argumentos
const FAQ_DATA = [{
  category: "usabilidade",
  icon: Zap,
  question: "Como funciona a avaliação? É complicado?",
  answer: "É muito simples! Você preenche seus dados de contato, informa o bairro, endereço e área do imóvel, e em 30 segundos recebe uma estimativa de valor baseada em transações reais. Não precisa de cadastro complexo, download de aplicativo ou conhecimento técnico."
}, {
  category: "usabilidade",
  icon: Clock,
  question: "Quanto tempo leva para receber o resultado?",
  answer: "O resultado é instantâneo. Assim que você enviar o formulário, nossa tecnologia consulta o banco de dados com mais de 80.000 transações e calcula a estimativa em tempo real. Em menos de 30 segundos você já tem os valores na tela."
}, {
  category: "usabilidade",
  icon: Calculator,
  question: "Posso fazer quantas consultas quiser?",
  answer: "Você pode fazer até 2 consultas gratuitas por email. Isso permite avaliar imóveis diferentes ou testar cenários. Se precisar de mais consultas ou uma análise mais detalhada, oferecemos o Parecer Técnico Godoy Prime com análise completa por um especialista."
}, {
  category: "confianca",
  icon: Shield,
  question: "De onde vêm os dados? São confiáveis?",
  answer: "Usamos dados oficiais de transações ITBI (Imposto de Transmissão de Bens Imóveis) da Prefeitura do Rio de Janeiro. São registros reais de compra e venda, não preços de anúncios inflacionados. São os mesmos dados usados pelo governo para calcular impostos."
}, {
  category: "confianca",
  icon: BadgeCheck,
  question: "Por que dados ITBI são melhores que preços de anúncios?",
  answer: "Anúncios mostram o preço que o vendedor DESEJA receber, não o valor real de venda. Pesquisas mostram que a diferença pode chegar a 20-30%. Já o ITBI registra o valor que efetivamente foi pago na transação, depois de toda negociação. É o valor real de mercado."
}, {
  category: "confianca",
  icon: Lock,
  question: "Meus dados estão seguros? Vocês vendem informações?",
  answer: "Seus dados são protegidos com criptografia e armazenados em servidores seguros. Não vendemos, compartilhamos ou divulgamos suas informações para terceiros. Usamos apenas para enviar sua avaliação e, se você autorizar, informações relevantes sobre o mercado imobiliário."
}, {
  category: "beneficios",
  icon: TrendingUp,
  question: "Como essa avaliação me ajuda a vender meu imóvel?",
  answer: "Conhecendo o valor real de mercado, você pode precificar corretamente seu imóvel desde o início. Imóveis com preço justo vendem em média 3x mais rápido. Você evita perder meses com um preço irrealista e também evita vender abaixo do valor por desconhecimento."
}, {
  category: "beneficios",
  icon: DollarSign,
  question: "Como essa avaliação me ajuda a comprar um imóvel?",
  answer: "Antes de fazer uma proposta, você descobre se o preço pedido está dentro da realidade de mercado. Com dados reais em mãos, você tem argumentos sólidos para negociar e pode economizar dezenas ou centenas de milhares de reais pagando o valor justo."
}, {
  category: "beneficios",
  icon: Target,
  question: "Qual a vantagem em relação a outras ferramentas online?",
  answer: "A maioria das ferramentas usa algoritmos genéricos baseados em preços de anúncios. Nossa ferramenta usa dados oficiais de transações reais, específicos para cada região do Rio de Janeiro, com metodologia transparente. Você vê exatamente quantas transações embasam sua estimativa."
}, {
  category: "objecoes",
  icon: AlertCircle,
  question: "É só uma estimativa, não é o valor exato, certo?",
  answer: "Correto. Esta é uma estimativa preliminar baseada em médias de transações na região. O valor exato depende de características específicas do imóvel (vista, andar, reforma, etc.). Por isso oferecemos o Parecer Técnico Godoy Prime, onde um especialista analisa todos os diferenciais do seu imóvel para um valor preciso."
}, {
  category: "objecoes",
  icon: HelpCircle,
  question: "Por que preciso informar meus dados de contato?",
  answer: "Precisamos do seu contato para enviar o resultado da avaliação e, principalmente, para proteger nosso sistema contra robôs e consultas em massa. Seus dados são usados apenas para comunicação sobre sua avaliação. Você pode cancelar o recebimento a qualquer momento."
}, {
  category: "objecoes",
  icon: ThumbsUp,
  question: "E se eu não concordar com o valor apresentado?",
  answer: "A estimativa é uma referência de mercado, não uma verdade absoluta. Se você acredita que seu imóvel vale mais (ou menos), pode ter razão! Características únicas como vista privilegiada, reforma recente ou localização premium podem justificar valores diferentes. Nesse caso, o Parecer Técnico considera esses fatores."
}, {
  category: "objecoes",
  icon: MessageCircle,
  question: "Vocês vão ficar me ligando depois?",
  answer: "Não praticamos telemarketing agressivo. Você receberá apenas informações relevantes sobre sua avaliação e, ocasionalmente, insights de mercado úteis. Se preferir não receber nada além da avaliação, basta nos avisar. Respeitamos sua privacidade e seu tempo."
}];

// SEO meta tags otimizadas para conversão
const SEO_CONFIG = {
  title: "Avaliação Imobiliária Gratuita | Descubra o Valor Real do Seu Imóvel | Godoy Prime",
  description: "Descubra o valor real do seu imóvel na Barra da Tijuca em 30 segundos. Avaliação baseada em +80.000 transações oficiais ITBI da Prefeitura do RJ. Gratuito e sem compromisso.",
  keywords: "avaliação imóvel gratuita, valor imóvel Barra da Tijuca, preço m2 Rio de Janeiro, quanto vale meu apartamento, ITBI, avaliação online, valor real imóvel",
  canonical: "https://avaliacao.godoyprime.com.br",
  ogImage: "https://avaliacao.godoyprime.com.br/og-image.jpg"
};
export default function AvaliacaoPublica() {
  const [step, setStep] = useState<Step>("form");
  const [valuationData, setValuationData] = useState<QuickValuationData | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // UTM tracking para campanhas
  const {
    utmParams,
    hasUTM
  } = useUTMTracking();
  const handleQuickValuationComplete = (data: QuickValuationData) => {
    setValuationData(data);
    setStep("result");
    // Scroll to result
    setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  };
  const handleNewValuation = () => {
    setValuationData(null);
    setStep("form");
    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);
  };
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };
  return <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{SEO_CONFIG.title}</title>
        <meta name="title" content={SEO_CONFIG.title} />
        <meta name="description" content={SEO_CONFIG.description} />
        <meta name="keywords" content={SEO_CONFIG.keywords} />
        <link rel="canonical" href={SEO_CONFIG.canonical} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SEO_CONFIG.canonical} />
        <meta property="og:title" content={SEO_CONFIG.title} />
        <meta property="og:description" content={SEO_CONFIG.description} />
        <meta property="og:image" content={SEO_CONFIG.ogImage} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Godoy Prime Realty" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={SEO_CONFIG.canonical} />
        <meta property="twitter:title" content={SEO_CONFIG.title} />
        <meta property="twitter:description" content={SEO_CONFIG.description} />
        <meta property="twitter:image" content={SEO_CONFIG.ogImage} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Godoy Prime Realty" />
        <meta name="geo.region" content="BR-RJ" />
        <meta name="geo.placename" content="Rio de Janeiro" />
        
        {/* Structured Data - LocalBusiness */}
        <script type="application/ld+json">
          {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          "name": "Godoy Prime Realty",
          "description": "Avaliação imobiliária premium baseada em dados oficiais ITBI",
          "url": SEO_CONFIG.canonical,
          "logo": "https://avaliacao.godoyprime.com.br/godoy-logo.png",
          "telephone": "+55-21-96407-5124",
          "email": "contato@godoyprime.com.br",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Rio de Janeiro",
            "addressRegion": "RJ",
            "addressCountry": "BR"
          },
          "areaServed": {
            "@type": "City",
            "name": "Rio de Janeiro"
          },
          "priceRange": "$$$$",
          "sameAs": ["https://www.instagram.com/godoyprime"]
        })}
        </script>
        
        {/* Structured Data - Service */}
        <script type="application/ld+json">
          {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Avaliação Imobiliária Gratuita",
          "description": "Descubra o valor real do seu imóvel baseado em +80.000 transações oficiais ITBI",
          "provider": {
            "@type": "RealEstateAgent",
            "name": "Godoy Prime Realty"
          },
          "areaServed": {
            "@type": "City",
            "name": "Rio de Janeiro"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "BRL"
          }
        })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* ============ SECTION 1: HERO (Navy with background image) ============ */}
        <section className="relative text-white overflow-hidden">
          {/* Background image with overlay - optimized with lazy loading */}
          <img 
            src={heroBackground} 
            alt="" 
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0C2340]/95 via-[#0C2340]/90 to-[#1a3a5c]/85" />
          
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
          </div>

          {/* Header */}
          <header className="relative z-10 container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={godoyLogo} 
                alt="Godoy Prime" 
                loading="eager"
                decoding="async"
                width={48}
                height={48}
                className="h-10 md:h-12 w-auto drop-shadow-lg" 
              />
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
              <Button onClick={scrollToForm} className="bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all duration-200" size="sm">
                Consultar Valor
              </Button>
            </div>
          </header>

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 py-12 md:py-20 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium animate-fade-in">
                <Shield className="h-4 w-4 text-[#D4AF37]" />
                Dados Oficiais ITBI da Prefeitura do Rio de Janeiro
              </div>

              <h2 className="text-3xl md:text-5xl font-bold tracking-tight animate-fade-in [animation-delay:150ms]">
                Negocie com Confiança:
                <br />
                <span className="text-[#D4AF37]">Descubra o Valor Real</span>
                <br className="hidden md:block" />
                {" "}de Qualquer Imóvel
              </h2>

              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto animate-fade-in [animation-delay:300ms]">
                Avaliação baseada em transações reais de compra e venda, 
                não em preços de anúncios inflacionados.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in [animation-delay:450ms]">
                <Button onClick={scrollToForm} size="lg" className="bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                  <span className="truncate">Descobrir Valor Real Agora</span>
                  <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 pt-6 sm:pt-8 border-t border-white/10 mt-6 sm:mt-8 animate-fade-in [animation-delay:600ms]">
                {HERO_STATS.map((stat, index) => <div key={index} className="text-center">
                    <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-[#D4AF37] mx-auto mb-1 sm:mb-2" />
                    <p className="text-lg sm:text-xl md:text-3xl font-bold">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-white/60 leading-tight">{stat.label}</p>
                  </div>)}
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
              <ChevronDown className="h-6 w-6 text-white/40" />
            </div>
          </div>
        </section>

        {/* ============ SECTION 2: WRONG PRICE IMPACTS - ATENÇÃO (White background) ============ */}
        <section className="py-16 md:py-20 px-4 bg-white">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12 animate-fade-in">
              <span className="inline-block px-4 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-semibold mb-4">
                ATENÇÃO
              </span>
              <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#0C2340] mb-3 sm:mb-4 leading-tight">
                O Preço Errado Prejudica Todo Mundo
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                Seja vendedor ou comprador, negociar sem dados reais custa tempo, dinheiro e oportunidades.
              </p>
            </div>

            {/* Two columns: Sellers and Buyers */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Seller Column */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 animate-fade-in">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                    <Home className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-[#0C2340]">Para Quem Vende</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Impactos de precificar errado</p>
                  </div>
                </div>
                
                {WRONG_PRICE_SELLER.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-3 sm:p-4 border border-orange-200/50 hover:border-orange-300 hover:shadow-md transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${(index + 1) * 100}ms` }}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-semibold text-sm sm:text-base text-[#0C2340] mb-0.5 sm:mb-1">{item.title}</h5>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Buyer Column */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 animate-fade-in [animation-delay:150ms]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-[#0C2340]">Para Quem Compra</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">Riscos de negociar sem dados</p>
                  </div>
                </div>
                
                {WRONG_PRICE_BUYER.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-blue-200/50 hover:border-blue-300 hover:shadow-md transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${(index + 1) * 100 + 150}ms` }}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-semibold text-sm sm:text-base text-[#0C2340] mb-0.5 sm:mb-1">{item.title}</h5>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conclusion Card */}
            <div className="bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/5 to-[#D4AF37]/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-[#D4AF37]/30 animate-fade-in [animation-delay:500ms]">
              <div className="text-center mb-4 sm:mb-6">
                <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0C2340] mb-1 sm:mb-2">
                  Informação é Poder dos Dois Lados
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground px-2">
                  Preço certo desde o início significa menos desgaste e mais dinheiro no bolso.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="flex items-center justify-center gap-2 bg-white/60 rounded-lg py-2 sm:py-3 px-3 sm:px-4">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37] flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-[#0C2340]">
                    <strong>Vendedor:</strong> Venda mais rápida
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-white/60 rounded-lg py-2 sm:py-3 px-3 sm:px-4">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37] flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-[#0C2340]">
                    <strong>Comprador:</strong> Economia real
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-white/60 rounded-lg py-2 sm:py-3 px-3 sm:px-4">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37] flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-[#0C2340]">
                    <strong>Ambos:</strong> Menos tempo perdido
                  </span>
                </div>
              </div>
            </div>

            {/* Statistic */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground italic max-w-2xl mx-auto">
                "Estudos mostram que <strong className="text-[#0C2340]">mais da metade dos imóveis à venda está anunciada acima do valor real de mercado</strong>, prejudicando vendedores que perdem tempo e compradores que pagam mais do que deviam."
              </p>
            </div>

            {/* Mini CTA */}
            <div className="mt-12 text-center animate-fade-in [animation-delay:600ms]">
              <div className="bg-gradient-to-r from-[#0C2340] to-[#1a3a5c] rounded-2xl p-6 md:p-8 shadow-xl">
                <h4 className="text-xl md:text-2xl font-bold text-white mb-3">
                  Não Deixe o Preço Errado Custar Caro
                </h4>
                <p className="text-white/80 mb-6 max-w-lg mx-auto">
                  Descubra agora o valor real do seu imóvel com nossa avaliação gratuita baseada em dados oficiais.
                </p>
                <Button 
                  onClick={scrollToForm}
                  size="lg"
                  className="bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-base w-full sm:w-auto max-w-xs sm:max-w-none"
                >
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Avaliar Meu Imóvel Grátis</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5 sm:ml-2 flex-shrink-0" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION 3: PROBLEM (Gray background) ============ */}
        <section className="py-12 sm:py-16 md:py-20 px-4 bg-gray-50">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-8 sm:mb-12">
              <span className="inline-block px-3 sm:px-4 py-1 rounded-full bg-destructive/10 text-destructive text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                O PROBLEMA
              </span>
              <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#0C2340] mb-3 sm:mb-4 leading-tight px-2">
                Por Que Você Está Negociando no Escuro?
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                A diferença entre o preço pedido e o valor real pode chegar a <strong className="text-[#D4AF37]">R$ 200.000</strong> ou mais.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {PROBLEMS.map((problem, index) => <div key={index} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:border-[#D4AF37]/30 hover:shadow-lg transition-all duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-3 sm:mb-4">
                    <problem.icon className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                  </div>
                  <h4 className="font-bold text-base sm:text-lg text-[#0C2340] mb-1 sm:mb-2">{problem.title}</h4>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{problem.description}</p>
                </div>)}
            </div>
          </div>
        </section>

        {/* ============ SECTION 4: SOLUTION (White background) ============ */}
        <section className="py-12 sm:py-16 md:py-20 px-4 bg-white">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-8 sm:mb-12">
              <span className="inline-block px-3 sm:px-4 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                A SOLUÇÃO
              </span>
              <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#0C2340] mb-3 sm:mb-4 leading-tight px-2">
                A Solução Que Muda Tudo
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
                Avaliação baseada em dados reais da Prefeitura, não em achismos ou algoritmos genéricos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {SOLUTIONS.map((solution, index) => <div key={index} className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-[#D4AF37]/20 hover:border-[#D4AF37]/50 shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center mb-3 sm:mb-4">
                    <solution.icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#D4AF37]" />
                  </div>
                  <h4 className="font-bold text-base sm:text-lg text-[#0C2340] mb-1 sm:mb-2">{solution.title}</h4>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">{solution.description}</p>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs bg-[#D4AF37]/10 text-[#0C2340] rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-[#D4AF37] flex-shrink-0" />
                    <span className="leading-tight">{solution.highlight}</span>
                  </div>
                </div>)}
            </div>
          </div>
        </section>

        {/* ============ SECTION 4: PARA QUEM É (Gray background) ============ */}
        <section className="py-12 sm:py-16 md:py-20 px-4 bg-gray-50">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-8 sm:mb-12">
              <span className="inline-block px-3 sm:px-4 py-1 rounded-full bg-[#0C2340]/10 text-[#0C2340] text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
                PARA QUEM É
              </span>
              <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#0C2340] mb-3 sm:mb-4 leading-tight">
                Para Quem É Esta Avaliação?
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {PERSONAS.map((persona, index) => <div key={index} className="bg-white sm:bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:border-[#D4AF37]/30 hover:shadow-lg transition-all duration-300 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0C2340] to-[#1a3a5c] flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <persona.icon className="h-6 w-6 sm:h-8 sm:w-8 text-[#D4AF37]" />
                  </div>
                  <h4 className="font-bold text-lg sm:text-xl text-[#0C2340] mb-0.5 sm:mb-1">{persona.title}</h4>
                  <p className="text-[#D4AF37] font-medium text-xs sm:text-sm mb-2 sm:mb-3">{persona.subtitle}</p>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">{persona.description}</p>
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs bg-[#D4AF37]/10 text-[#0C2340] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 font-medium">
                    <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#D4AF37] flex-shrink-0" />
                    {persona.cta}
                  </div>
                </div>)}
            </div>
          </div>
        </section>

        {/* ============ SECTION 5: FINAL CTA (Gold background) ============ */}
        <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-br from-[#D4AF37] to-[#c9a432]">
          <div className="container mx-auto max-w-3xl text-center px-2">
            <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#0C2340] mb-3 sm:mb-4 leading-tight">
              Pronto para Descobrir o Valor Real?
            </h3>
            <p className="text-[#0C2340]/80 text-sm sm:text-lg mb-6 sm:mb-8">
              Comece agora – leva apenas 30 segundos.
            </p>
            <Button onClick={scrollToForm} size="lg" className="bg-[#0C2340] hover:bg-[#0a1d33] text-white font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 text-sm sm:text-base px-6 sm:px-10 py-3 sm:py-4 w-full sm:w-auto max-w-xs sm:max-w-none">
              <span className="truncate">Consultar Valor Real</span>
              <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            </Button>
          </div>
        </section>

        {/* ============ SECTION 6: FORM (Light gray background) ============ */}
        <section ref={formRef} className="py-16 md:py-20 px-4 bg-gray-50 scroll-mt-4">
          <div className="container mx-auto max-w-2xl">
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-1 rounded-full bg-[#0C2340]/10 text-[#0C2340] text-sm font-semibold mb-4">
                AVALIAÇÃO PRELIMINAR
              </span>
              <h3 className="text-2xl md:text-4xl font-bold text-[#0C2340] mb-4">
                Consulte o Valor Real
              </h3>
              <p className="text-muted-foreground">
                Resultado instantâneo baseado em transações reais • Sem compromisso
              </p>
            </div>

            {step === "form" && <div className="space-y-6">
                <QuickValuationForm onComplete={handleQuickValuationComplete} />

                {/* Trust badges */}
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 text-[#D4AF37]" />
                    Dados da Prefeitura RJ
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-[#D4AF37]" />
                    Sem compromisso
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 text-[#D4AF37]" />
                    Resultado em 30 segundos
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Aviso:</strong> Esta é uma estimativa automática baseada em dados 
                      históricos de transações ITBI. Não substitui um laudo técnico assinado por perito avaliador.
                    </p>
                  </div>
                </div>
              </div>}
          </div>
        </section>

        {/* ============ RESULT SECTION (appears after form submit) ============ */}
        {step === "result" && valuationData && <section ref={resultRef} className="py-12 px-4 bg-gradient-to-b from-gray-50 to-white scroll-mt-4">
            <div className="container mx-auto max-w-3xl">
              <QuickValuationResult data={valuationData} onNewValuation={handleNewValuation} />
            </div>
          </section>}

        {/* ============ SECTION 7: FAQ (White background) ============ */}
        <section className="py-16 md:py-20 px-4 bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1 rounded-full bg-[#0C2340]/10 text-[#0C2340] text-sm font-semibold mb-4">
                PERGUNTAS FREQUENTES
              </span>
              <h3 className="text-2xl md:text-4xl font-bold text-[#0C2340] mb-4">
                Tire Suas Dúvidas
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Respondemos as principais perguntas sobre a ferramenta, segurança dos dados e como ela pode ajudar você.
              </p>
            </div>

            {/* FAQ Categories */}
            <div className="space-y-8">
              {/* Usabilidade */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-[#D4AF37]" />
                  </div>
                  <h4 className="font-bold text-lg text-[#0C2340]">Como Usar</h4>
                </div>
                <Accordion type="single" collapsible className="space-y-2">
                  {FAQ_DATA.filter(f => f.category === "usabilidade").map((faq, index) => <AccordionItem key={`usabilidade-${index}`} value={`usabilidade-${index}`} className="bg-gray-50 rounded-xl border border-gray-100 px-4 data-[state=open]:bg-[#D4AF37]/5 data-[state=open]:border-[#D4AF37]/30">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="text-left font-medium text-[#0C2340]">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>)}
                </Accordion>
              </div>

              {/* Confiança */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <h4 className="font-bold text-lg text-[#0C2340]">Confiança e Segurança</h4>
                </div>
                <Accordion type="single" collapsible className="space-y-2">
                  {FAQ_DATA.filter(f => f.category === "confianca").map((faq, index) => <AccordionItem key={`confianca-${index}`} value={`confianca-${index}`} className="bg-gray-50 rounded-xl border border-gray-100 px-4 data-[state=open]:bg-green-50 data-[state=open]:border-green-200">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="text-left font-medium text-[#0C2340]">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>)}
                </Accordion>
              </div>

              {/* Benefícios */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-lg text-[#0C2340]">Benefícios</h4>
                </div>
                <Accordion type="single" collapsible className="space-y-2">
                  {FAQ_DATA.filter(f => f.category === "beneficios").map((faq, index) => <AccordionItem key={`beneficios-${index}`} value={`beneficios-${index}`} className="bg-gray-50 rounded-xl border border-gray-100 px-4 data-[state=open]:bg-blue-50 data-[state=open]:border-blue-200">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="text-left font-medium text-[#0C2340]">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>)}
                </Accordion>
              </div>

              {/* Objeções */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <HelpCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <h4 className="font-bold text-lg text-[#0C2340]">Dúvidas Comuns</h4>
                </div>
                <Accordion type="single" collapsible className="space-y-2">
                  {FAQ_DATA.filter(f => f.category === "objecoes").map((faq, index) => <AccordionItem key={`objecoes-${index}`} value={`objecoes-${index}`} className="bg-gray-50 rounded-xl border border-gray-100 px-4 data-[state=open]:bg-amber-50 data-[state=open]:border-amber-200">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="text-left font-medium text-[#0C2340]">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>)}
                </Accordion>
              </div>
            </div>

            {/* CTA após FAQ */}
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">Ainda tem dúvidas?</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={scrollToForm} className="bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] font-semibold hover:scale-105 active:scale-95 transition-all duration-200 text-sm sm:text-base px-4 sm:px-6 w-full sm:w-auto">
                  <Calculator className="mr-1.5 sm:mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Fazer Minha Avaliação Gratuita</span>
                </Button>
                <Button variant="outline" onClick={() => window.open("https://wa.me/5521964075124?text=Ol%C3%A1!%20Tenho%20d%C3%BAvidas%20sobre%20a%20avalia%C3%A7%C3%A3o%20de%20im%C3%B3veis.", "_blank")} className="border-[#0C2340]/20 hover:scale-105 active:scale-95 transition-all duration-200 text-sm sm:text-base px-4 sm:px-6 w-full sm:w-auto">
                  <MessageCircle className="mr-1.5 sm:mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Falar com Especialista</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SECTION 8: FOOTER (Navy background) ============ */}
        <footer className="py-12 px-4 bg-[#0C2340]">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Logo and info */}
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                  <img 
                    src={godoyLogo} 
                    alt="Godoy Prime" 
                    loading="lazy"
                    decoding="async"
                    width={40}
                    height={40}
                    className="h-10 w-auto" 
                  />
                  <div>
                    <h4 className="font-semibold text-white">Godoy Prime Realty</h4>
                    <p className="text-xs text-[#D4AF37]">CRECI 11841-PJ</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm max-w-md">
                  Especialistas em imóveis de alto padrão na Barra da Tijuca. 
                  Avaliações baseadas em dados oficiais ITBI da Prefeitura do Rio de Janeiro.
                </p>
              </div>

              {/* Contact */}
              <div className="text-center md:text-right">
                <p className="text-white/80 text-sm mb-2">
                  Av. das Américas, 10101 - Bloco 2, Sala 316
                </p>
                <div className="flex flex-col sm:flex-row justify-center md:justify-end gap-2 sm:gap-4 text-sm">
                  <a href="tel:+5521964075124" className="text-white/80 hover:text-[#D4AF37] transition-colors">
                    📞 (21) 96407-5124
                  </a>
                  <a href="https://wa.me/5521964075124" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-[#D4AF37] transition-colors">
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-white/40 text-xs">
                © {new Date().getFullYear()} Godoy Prime Realty. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4">
                <Link to="/politica-privacidade" className="text-white/40 text-xs hover:text-[#D4AF37] transition-colors">
                  Política de Privacidade
                </Link>
                <span className="text-white/20">|</span>
                <span className="text-white/40 text-xs">
                  Desenvolvido por Godoy Prime Realty
                </span>
                <span className="text-white/20">|</span>
                <Link to="/auth" className="text-white/30 text-xs hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </footer>

        {/* Sofia Assistant for Public Page (includes WhatsApp button) */}
        <PublicSofiaAssistant />
      </div>
    </>;
}