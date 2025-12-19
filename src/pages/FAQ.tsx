import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Building2, 
  Cpu, 
  Target,
  ArrowLeft,
  MessageCircle,
  Calculator,
  Shield,
  HelpCircle,
  TrendingUp,
  DollarSign,
  BadgeCheck,
  AlertCircle,
  BarChart3
} from "lucide-react";
import godoyLogo from "@/assets/godoy-logo-symbol.png";

// FAQ sobre ITBI, Metodologia, Uso Prático, Aspectos Legais e Tecnologia
const FAQ_DATA = [
  // Categoria: ITBI - O que é e Por que usar
  {
    category: "itbi",
    question: "O que significa ITBI?",
    answer: "ITBI significa 'Imposto sobre Transmissão de Bens Imóveis'. É um imposto municipal cobrado quando há transferência de propriedade de um imóvel (compra e venda). O ITBI é calculado sobre o valor de mercado do imóvel no momento da transação, tornando esses registros uma fonte extremamente confiável de dados reais.",
  },
  {
    category: "itbi",
    question: "Por que usar dados de ITBI é melhor que preços de anúncios?",
    answer: "Porque os dados de ITBI refletem transações reais que se concretizaram. Estudos comprovam que preços anunciados são, em média, 17% a 30% mais altos que o valor efetivamente pago. Os dados de ITBI eliminam especulação e representam exatamente o que o mercado pagou. Enquanto um anúncio é uma expectativa, um registro de ITBI é um fato comprovado.",
  },
  {
    category: "itbi",
    question: "Como vocês calculam o valor usando dados de ITBI?",
    answer: "Utilizamos dados de transações reais registradas junto à Prefeitura do Rio de Janeiro. Identificamos imóveis similares ao seu (mesmo bairro, rua ou micro-região), consideramos as variações de metragem e tipo de imóvel, e aplicamos fórmulas estatísticas para estimar o valor atual. Esse método garante que a avaliação reflete o que o mercado realmente está pagando.",
  },
  {
    category: "itbi",
    question: "Vocês usam a mesma avaliação do IPTU para calcular o valor?",
    answer: "Não. O IPTU usa fórmulas genéricas que resultam em valores frequentemente defasados. Já o ITBI reflete transações individualizadas e reais. A diferença entre ITBI e IPTU é normal e esperada.",
  },
  {
    category: "itbi",
    question: "Por que o IPTU é tão diferente do ITBI?",
    answer: "Porque o IPTU usa 'lançamento em massa' - fórmulas padronizadas que não acompanham a dinâmica real do mercado. O ITBI incide apenas sobre transações específicas, com valor efetivamente negociado.",
  },
  {
    category: "itbi",
    question: "Qual a confiabilidade dos dados de ITBI?",
    answer: "Altíssima. São registros fiscais oficiais documentados em cartório, baseiam-se em fatos comprovados, eliminam vieses emocionais, e seguem critérios tecnicamente reconhecidos (normas ABNT NBR 14653). A margem de erro é muito menor comparada a avaliações baseadas em anúncios.",
  },
  {
    category: "itbi",
    question: "Os dados de ITBI podem ser manipulados?",
    answer: "Praticamente não. Declarar valor diferente gera risco legal (autuação da Prefeitura), risco bancário (banco não aprova financiamento) e risco para o vendedor. Em imóveis de alto padrão, os valores registrados em ITBI refletem fielmente a realidade das transações.",
  },
  {
    category: "itbi",
    question: "Qual a diferença entre avaliação por ITBI e tradicional?",
    answer: "A avaliação tradicional examina características físicas do imóvel e usa comparáveis do mercado. A avaliação por ITBI usa dados estatísticos de transações reais, eliminando vieses. Ambas são complementares: ITBI fornece a base de mercado, avaliações tradicionais ajustam particularidades específicas.",
  },
  // Categoria: Uso Prático
  {
    category: "uso",
    question: "Posso usar essa avaliação para financiamento bancário?",
    answer: "Nossa avaliação por ITBI é um excelente ponto de partida e justificativa. Bancos fazem avaliação própria, mas você pode apresentar nossa análise como fundamentação. Para financiamento, você precisará de avaliação técnica feita por avaliador credenciado pelo banco, mas nossa análise ajuda a negociar se houver diferença.",
  },
  {
    category: "uso",
    question: "Posso usar para contrato ou negociação imobiliária?",
    answer: "Sim, absolutamente. Nossa avaliação é útil para: definir preço de venda, negociações com argumentação fundamentada, contestar cobranças de ITBI acima do valor da escritura, análise de investimento, e como suporte técnico em processos administrativos ou judiciais.",
  },
  {
    category: "uso",
    question: "Estou comprando um imóvel. Como essa avaliação me ajuda?",
    answer: "Excelente uso: você não paga demais, tem argumentação técnica para negociação, pode apresentar ao banco para aprovação de financiamento, e sabe exatamente quanto está pagando em relação ao mercado real.",
  },
  {
    category: "uso",
    question: "Estou vendendo um imóvel. Como me ajuda?",
    answer: "Fundamental: precifica corretamente (nem muito alto nem muito baixo), oferece defesa perante Prefeitura se cobrar ITBI acima do declarado, atrai mais compradores com preço correto, e justifica tecnicamente o valor do imóvel nas negociações.",
  },
  {
    category: "uso",
    question: "A avaliação é aceita por cartórios e órgãos públicos?",
    answer: "Sim. Cartórios usam para referência, a Prefeitura aceita como suporte em contestações, o Poder Judiciário aceita como prova técnica, e bancos aceitam como complemento. É especialmente útil para argumentar e justificar valores perante essas instituições.",
  },
  {
    category: "uso",
    question: "Essa ferramenta substitui uma avaliação técnica tradicional?",
    answer: "Não completamente, mas é um excelente complemento. A avaliação por ITBI é baseada em transações reais, usa método científico reconhecido e tem custo muito menor. Para imóveis com características únicas, reformas especiais ou localização premium, recomendamos complementar com avaliação técnica presencial.",
  },
  // Categoria: Tecnologia
  {
    category: "tecnologia",
    question: "Como vocês acessam os dados de ITBI?",
    answer: "Os dados não são confidenciais. A Prefeitura publica relatórios com valores médios por m² por trecho de logradouro, disponíveis no portal 'Carioca Digital' e Secretaria Municipal de Fazenda. Compilamos esses dados públicos e os cruzamos com informações de mercado para análises mais precisas.",
  },
  {
    category: "tecnologia",
    question: "Vocês usam inteligência artificial?",
    answer: "Sim. Usamos tecnologia avançada: integração com bases públicas de ITBI, algoritmos para identificar imóveis similares, modelos de regressão para estimar valores, validação com múltiplas fontes, e dashboards interativos.",
  },
  {
    category: "tecnologia",
    question: "Com qual frequência os dados são atualizados?",
    answer: "Dados de ITBI são atualizados continuamente pela Secretaria Municipal de Fazenda. Consolidamos mensalmente os dados mais recentes, indicamos a data de atualização em cada análise, e mantemos séries históricas para análise de tendências.",
  },
  {
    category: "tecnologia",
    question: "Qual é o nível de precisão dessa avaliação?",
    answer: "Margem de erro típica: ±10% a 15% (excelente para real estate). Comparação: preços de anúncio têm margem de ~20-30%, dados ITBI ~10-15%, e avaliação técnica detalhada ~5%. Nossa ferramenta oferece precisão muito superior aos anúncios e é economicamente mais viável que avaliação técnica.",
  },
];

const CATEGORY_CONFIG = [
  {
    id: "itbi",
    title: "Sobre Dados de ITBI",
    description: "Entenda como funcionam os dados oficiais de transações imobiliárias",
    icon: Building2,
    color: "purple",
  },
  {
    id: "uso",
    title: "Uso Prático da Avaliação",
    description: "Como utilizar nossa avaliação em diferentes situações",
    icon: Target,
    color: "cyan",
  },
  {
    id: "tecnologia",
    title: "Tecnologia e Metodologia",
    description: "Como nossa tecnologia funciona e garante precisão",
    icon: Cpu,
    color: "indigo",
  },
];

const SEO_CONFIG = {
  title: "FAQ - Perguntas Frequentes sobre Avaliação Imobiliária | Godoy Prime",
  description: "Tire suas dúvidas sobre avaliação imobiliária, dados ITBI, metodologia e aspectos legais. Entenda como funciona nossa avaliação baseada em transações reais.",
  keywords: "FAQ avaliação imobiliária, dúvidas ITBI, como funciona avaliação, dados ITBI, metodologia avaliação",
  canonical: "https://avaliacao.godoyprime.com.br/faq",
};

export default function FAQ() {
  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      purple: { bg: "bg-purple-500/20", text: "text-purple-600" },
      cyan: { bg: "bg-cyan-500/20", text: "text-cyan-600" },
      red: { bg: "bg-red-500/20", text: "text-red-600" },
      indigo: { bg: "bg-indigo-500/20", text: "text-indigo-600" },
    };
    return colors[color] || colors.purple;
  };

  return (
    <>
      <Helmet>
        <title>{SEO_CONFIG.title}</title>
        <meta name="description" content={SEO_CONFIG.description} />
        <meta name="keywords" content={SEO_CONFIG.keywords} />
        <link rel="canonical" href={SEO_CONFIG.canonical} />
        <meta property="og:title" content={SEO_CONFIG.title} />
        <meta property="og:description" content={SEO_CONFIG.description} />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0C2340] shadow-lg">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <img src={godoyLogo} alt="Godoy Prime" className="h-10 md:h-12 w-auto drop-shadow-lg" />
                <div className="hidden sm:block">
                  <h1 className="font-semibold text-base md:text-lg tracking-tight text-white">Godoy Prime Realty</h1>
                  <p className="text-xs text-[#D4AF37] font-medium">Perguntas Frequentes</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button 
                  className="bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] font-semibold shadow-lg"
                  size="sm"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Avaliar Imóvel
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#0C2340] to-[#1a3a5c] text-white py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
              <HelpCircle className="h-4 w-4 text-[#D4AF37]" />
              Central de Ajuda
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Tire todas as suas dúvidas sobre nossa metodologia de avaliação,
              dados de ITBI e aspectos legais.
            </p>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Avaliação
          </Link>
        </div>

        {/* FAQ Content */}
        <section className="py-8 md:py-12 px-4">
          <div className="container mx-auto max-w-4xl space-y-8">
            {CATEGORY_CONFIG.map((category) => {
              const colors = getColorClasses(category.color);
              const CategoryIcon = category.icon;
              const categoryFaqs = FAQ_DATA.filter(f => f.category === category.id);
              
              return (
                <Card key={category.id} className="border-border shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <CategoryIcon className={`h-5 w-5 ${colors.text}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      {categoryFaqs.map((faq, index) => (
                        <AccordionItem 
                          key={`${category.id}-${index}`} 
                          value={`${category.id}-${index}`}
                          className="bg-muted/30 rounded-lg border-0 px-4"
                        >
                          <AccordionTrigger className="hover:no-underline py-4 text-sm">
                            <span className="text-left font-medium">{faq.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground pb-4">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl text-center">
            <h3 className="text-2xl font-bold mb-4">Não encontrou sua dúvida?</h3>
            <p className="text-muted-foreground mb-6">
              Fale diretamente com nossa equipe ou faça sua avaliação gratuita agora mesmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button 
                  className="bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] font-semibold w-full sm:w-auto"
                  size="lg"
                >
                  <Calculator className="mr-2 h-5 w-5" />
                  Fazer Avaliação Gratuita
                </Button>
              </Link>
              <a href="tel:+5521964075124">
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-[#0C2340]/20 w-full sm:w-auto"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Ligar: (21) 96407-5124
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              WhatsApp:{" "}
              <a
                href="https://wa.me/5521964075124"
                target="_top"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                +55 21 96407-5124
              </a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 bg-[#0C2340]">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
                  <img src={godoyLogo} alt="Godoy Prime" className="h-10 w-auto" />
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

              <div className="text-center md:text-right">
                <p className="text-white/80 text-sm mb-2">
                  Av. das Américas, 10101 - Bloco 2, Sala 316
                </p>
                <div className="flex flex-col sm:flex-row justify-center md:justify-end gap-2 sm:gap-4 text-sm">
                  <a href="tel:+5521964075124" className="text-white/80 hover:text-[#D4AF37] transition-colors">
                    📞 (21) 96407-5124
                  </a>
                  <a
                    href="https://wa.me/5521964075124"
                    target="_top"
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-[#D4AF37] transition-colors"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-white/40 text-xs">
                © {new Date().getFullYear()} Godoy Prime Realty. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4">
                <Link to="/politica-privacidade" className="text-white/40 text-xs hover:text-[#D4AF37] transition-colors">
                  Política de Privacidade
                </Link>
                <span className="text-white/20">|</span>
                <Link to="/" className="text-white/40 text-xs hover:text-[#D4AF37] transition-colors">
                  Avaliação Gratuita
                </Link>
              </div>
            </div>
          </div>
        </footer>

        {/* Floating WhatsApp Button */}
        <a
          href="https://wa.me/5521964075124?text=Ol%C3%A1!%20Tenho%20d%C3%BAvidas%20sobre%20avalia%C3%A7%C3%A3o%20de%20im%C3%B3veis."
          target="_top"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5C] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          aria-label="Contato via WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="font-medium text-sm hidden sm:inline">Fale Conosco</span>
        </a>
      </div>
    </>
  );
}
