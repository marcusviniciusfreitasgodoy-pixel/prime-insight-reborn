import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Maximize2, 
  Home, 
  Calculator, 
  AlertCircle, 
  Shield, 
  MessageCircle, 
  Phone, 
  Check,
  HelpCircle,
  FileText,
  CalendarCheck,
  BadgeCheck,
  Banknote,
  ExternalLink,
  MessageSquareHeart
} from "lucide-react";
import { ComparisonTable } from "./ComparisonTable";
import { PeritEvaluationSection } from "./PeritEvaluationSection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// FAQ específica sobre o Parecer Técnico (perguntas sobre dados oficiais, uso, legal e tecnologia estão na página /faq)
const PARECER_FAQ = [
  // Categoria: Sobre o Serviço
  {
    category: "servico",
    question: "O que exatamente é o Parecer Técnico Godoy Prime?",
    answer: "É uma análise completa e personalizada do seu imóvel, elaborada por Marcus Godoy, perito avaliador credenciado pelo Tribunal de Justiça do Rio de Janeiro. Inclui visita técnica, análise de 26 características que impactam o valor, comparativo com transações recentes, e um laudo profissional que você pode usar em negociações, financiamentos e processos judiciais.",
  },
  {
    category: "servico",
    question: "Qual a diferença entre a avaliação gratuita e o Parecer Técnico?",
    answer: "A avaliação gratuita usa médias estatísticas da região. O Parecer Técnico considera os diferenciais ESPECÍFICOS do seu imóvel: vista, andar, reforma, estado de conservação, posição solar, infraestrutura do condomínio, etc. Essas características podem representar uma diferença de 15% a 30% no valor final.",
  },
  {
    category: "servico",
    question: "O Parecer Técnico tem validade jurídica?",
    answer: "Sim. O laudo é assinado por perito avaliador credenciado, seguindo a metodologia NBR 14653-2 da ABNT. Pode ser usado em inventários, divórcios, financiamentos bancários, disputas judiciais e qualquer situação que exija comprovação técnica do valor do imóvel.",
  },
  // Categoria: Processo
  {
    category: "processo",
    question: "Como funciona o processo do Parecer Técnico?",
    answer: "1) Você solicita pelo WhatsApp; 2) Agendamos uma visita técnica ao imóvel (duração: 1-2 horas); 3) Analisamos os dados e comparamos com transações recentes; 4) Em até 5 dias úteis, você recebe o laudo completo em PDF com todos os detalhes da avaliação, inclusive fotos.",
  },
  {
    category: "processo",
    question: "Preciso estar presente na visita técnica?",
    answer: "Recomendamos que você ou alguém de confiança esteja presente para esclarecer dúvidas sobre reformas realizadas, histórico do imóvel e características que não são visíveis. Mas se não for possível, podemos realizar a vistoria com acesso ao imóvel.",
  },
  {
    category: "processo",
    question: "Quanto tempo leva para receber o laudo?",
    answer: "O prazo padrão é de 5 dias úteis após a visita técnica. Em casos urgentes (inventários, propostas em andamento), oferecemos opção expressa com entrega em 48 horas mediante taxa adicional.",
  },
  // Categoria: Investimento
  {
    category: "investimento",
    question: "Quanto custa o Parecer Técnico?",
    answer: "O investimento varia de acordo com a tipologia e complexidade do imóvel. Apartamentos padrão partem de R$ 1.500. Casas, coberturas e imóveis de alto padrão têm valores específicos, em média R$ 5.000,00. Entre em contato para um orçamento personalizado sem compromisso.",
  },
  {
    category: "investimento",
    question: "Vale a pena investir no Parecer Técnico?",
    answer: "Considere: a diferença entre precificar corretamente e errar pode ser de R$ 50.000 a R$ 500.000 ou mais. Clientes que usam nosso parecer garantem economia e argumentos para uma boa negociação. O investimento se paga dezenas de vezes.",
  },
  {
    category: "investimento",
    question: "E se eu não concordar com o valor do Parecer?",
    answer: "Oferecemos garantia de satisfação. Se você discordar fundamentadamente do valor apresentado, agendamos uma reunião para revisar os critérios. Nossa metodologia é transparente: você vê exatamente como chegamos a cada número. Em casos excepcionais, podemos refazer a análise sem custo adicional.",
  },
  // Categoria: Confiança
  {
    category: "confianca",
    question: "Quem é Marcus Godoy?",
    answer: "Marcus Godoy é corretor de imóveis (CRECI 80.199) e perito avaliador credenciado pelo Tribunal de Justiça do Rio de Janeiro, com especialização em imóveis de alto padrão na Barra da Tijuca. A Godoy Prime Realty (CRECI 11841-PJ) é sua empresa especializada em consultoria imobiliária premium.",
  },
  {
    category: "confianca",
    question: "Vocês têm alguma certificação ou credenciamento?",
    answer: "Sim. Somos registrados no CRECI-RJ (11841-PJ), Perito Avaliador credenciado junto ao Tribunal de Justiça do Rio de Janeiro. Seguimos a metodologia NBR 14653-2 da ABNT para avaliações, e utilizamos dados oficiais de transações registradas na cidade do Rio de Janeiro. Nossos laudos são aceitos por bancos, cartórios e tribunais.",
  },
  {
    category: "confianca",
    question: "Posso ver exemplos de laudos anteriores?",
    answer: "Por questões de confidencialidade, não compartilhamos laudos de outros clientes. Porém, podemos mostrar a estrutura e o nível de detalhe do documento durante nossa conversa no WhatsApp, para que você veja exatamente o que receberá.",
  },
];

interface QuickValuationData {
  bairro: string;
  logradouro: string;
  area_m2: number;
  tipologia: string;
  quartos?: number;
  banheiros?: number;
  suites?: number;
  vagas?: number;
  diferenciais?: string;
  itbiData: {
    min_m2: number;
    med_m2: number;
    max_m2: number;
    transaction_count: number;
  } | null;
  estimativa: {
    min: number;
    med: number;
    max: number;
  } | null;
  // Lead data from form
  leadName: string;
  leadEmail: string;
  leadPhone: string;
}

interface QuickValuationResultProps {
  data: QuickValuationData;
  onNewValuation: () => void;
}

export function QuickValuationResult({ 
  data, 
  onNewValuation 
}: QuickValuationResultProps) {
  const navigate = useNavigate();
  const [parecerRequested, setParecerRequested] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);

  // Show feedback modal after 5 seconds
  useEffect(() => {
    if (feedbackDismissed) return;
    
    const timer = setTimeout(() => {
      setShowFeedbackModal(true);
    }, 20000);

    return () => clearTimeout(timer);
  }, [feedbackDismissed]);

  const handleFeedbackAccept = () => {
    setShowFeedbackModal(false);
    setFeedbackDismissed(true);
    navigate('/feedback');
  };

  const handleFeedbackDismiss = () => {
    setShowFeedbackModal(false);
    setFeedbackDismissed(true);
  };

  const formatCurrency = (value: number, compact = false) => {
    if (compact && value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1).replace('.', ',')} mi`;
    }
    if (compact && value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)} mil`;
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const hasData = data.itbiData && data.estimativa;

  const handleRequestParecer = async () => {
    setIsRequesting(true);
    
    try {
      // Send complete evaluation request notification
      const { data: response, error } = await supabase.functions.invoke('send-lead-notification', {
        body: {
          type: 'complete',
          leadId: '',
          leadName: data.leadName,
          leadEmail: data.leadEmail,
          leadPhone: data.leadPhone,
          interesse: 'compra',
          bairro: data.bairro,
          area: data.area_m2,
          tipologia: data.tipologia,
          quartos: data.quartos,
          banheiros: data.banheiros,
          suites: data.suites,
          vagas: data.vagas,
          estimativaMin: data.estimativa?.min,
          estimativaMed: data.estimativa?.med,
          estimativaMax: data.estimativa?.max,
        }
      });

      if (error) {
        console.error('Error sending notification:', error);
        toast.error("Erro ao enviar solicitação. Tente pelo WhatsApp.");
      } else {
        console.log('Notification sent successfully:', response);
        toast.success("Solicitação enviada com sucesso!");
      }
      
      setParecerRequested(true);

      // Open WhatsApp
      setTimeout(() => {
        const whatsappNumber = "5521964075124";
        const message = encodeURIComponent(
          `Olá! Sou ${data.leadName}.\n\nQuero solicitar meu Parecer Técnico Godoy Prime para proteger meu patrimônio.\n\nImóvel analisado: ${data.tipologia} de ${data.area_m2}m² em ${data.bairro}\nEstimativa Preliminar: ${formatCurrency(data.estimativa?.min || 0)} a ${formatCurrency(data.estimativa?.max || 0)}\n\nMeu WhatsApp: ${data.leadPhone}\nMeu email: ${data.leadEmail}`
        );
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
      }, 500);
    } catch (err) {
      console.error('Request error:', err);
      toast.error("Erro ao enviar. Tente pelo WhatsApp.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (!hasData) {
    return (
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-medium">Dados Insuficientes</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Não encontramos transações suficientes para esta localização específica. 
                Tente expandir a busca removendo o endereço ou alterando o bairro.
              </p>
            </div>
            <Button onClick={onNewValuation} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modal de Feedback Automático */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
              <MessageSquareHeart className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">
              Sua opinião é importante!
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Ajude-nos a melhorar! Responda nossa pesquisa rápida de <strong>2 minutos</strong> e contribua para o aprimoramento da plataforma.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleFeedbackAccept}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                <MessageSquareHeart className="mr-2 h-5 w-5" />
                Participar da Pesquisa
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleFeedbackDismiss}
                className="w-full text-muted-foreground"
              >
                Talvez depois
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Info Badge */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">{data.leadName}</p>
            <p className="text-xs text-green-600">{data.leadEmail}</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Cadastro Confirmado
        </Badge>
      </div>

      {/* Resultado Preliminar */}
      <Card className="border-accent/30 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Sua Análise Preliminar de Valor</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Com base nos dados informados, seu imóvel possui uma estimativa de valor entre:
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Property Summary */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {data.bairro}
            </Badge>
            {data.logradouro && (
              <Badge variant="outline" className="flex items-center gap-1">
                {data.logradouro}
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1">
              <Maximize2 className="h-3 w-3" />
              {data.area_m2} m²
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              {data.tipologia}
            </Badge>
          </div>

          <Separator />

          {/* Value Estimation - Destacado */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <div className="text-center p-2 sm:p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-yellow-600" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Mínimo</p>
                <p className="font-bold text-sm sm:text-lg text-yellow-700">{formatCurrency(data.estimativa!.min, true)}</p>
              </div>
              
              <div className="text-center p-2 sm:p-4 rounded-lg bg-primary/10 border-2 border-primary/30 shadow-lg">
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-primary" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Provável</p>
                <p className="font-bold text-base sm:text-xl text-primary">{formatCurrency(data.estimativa!.med, true)}</p>
              </div>
              
              <div className="text-center p-2 sm:p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-green-600" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Máximo</p>
                <p className="font-bold text-sm sm:text-lg text-green-700">{formatCurrency(data.estimativa!.max, true)}</p>
              </div>
            </div>

            {/* Market Reference */}
            <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-2">
              <h4 className="text-xs sm:text-sm font-medium text-center">Referência de Mercado (R$/m²)</h4>
              <div className="grid grid-cols-3 gap-1 text-center text-xs sm:text-sm">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Mín</p>
                  <p className="font-medium text-[11px] sm:text-sm">{formatCurrency(data.itbiData!.min_m2, true)}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Méd</p>
                  <p className="font-medium text-[11px] sm:text-sm">{formatCurrency(data.itbiData!.med_m2, true)}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Máx</p>
                  <p className="font-medium text-[11px] sm:text-sm">{formatCurrency(data.itbiData!.max_m2, true)}</p>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center pt-1 sm:pt-2">
                Baseado em {data.itbiData!.transaction_count} transações de imóveis com características semelhantes nos últimos 12 meses
              </p>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p>
                  <strong>Importante:</strong> Esta é uma estimativa preliminar baseada em dados históricos de transações oficiais.
                </p>
                <p>
                  Uma <strong>análise técnica completa</strong> considera os diferenciais <strong>específicos</strong> do seu imóvel: 
                  vista, andar, reforma, estado de conservação, posição solar, infraestrutura do condomínio, entre outros. 
                  Essas características podem representar uma <strong>diferença de 15% a 30%</strong> no valor final.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Convite para Pesquisa de Feedback - Com animação */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-background to-accent/10 shadow-lg animate-fade-in hover:shadow-xl transition-all duration-500 hover:scale-[1.01] hover:border-primary/50">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <MessageSquareHeart className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-semibold text-foreground">
                Sua opinião é importante para nós!
              </h4>
              <p className="text-sm text-muted-foreground">
                Responda nossa pesquisa rápida (2 min) e ajude-nos a melhorar a plataforma.
              </p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
              <Link to="/feedback">
                Participar da Pesquisa
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seção Completa de Avaliação com Perito */}
      <Card className="border-border shadow-lg">
        <CardContent className="py-6">
          <PeritEvaluationSection />
        </CardContent>
      </Card>

      {/* Tabela Comparativa */}
      <Card className="border-border">
        <CardContent className="py-6">
          <ComparisonTable />
        </CardContent>
      </Card>

      {/* FAQ sobre o Parecer Técnico */}
      <Card className="border-border">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Dúvidas sobre o Parecer Técnico</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Entenda como funciona nossa avaliação profissional completa
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sobre o Serviço */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#D4AF37]" />
              </div>
              <h4 className="font-semibold text-sm text-primary">Sobre o Serviço</h4>
            </div>
            <Accordion type="single" collapsible className="space-y-1.5">
              {PARECER_FAQ.filter(f => f.category === "servico").map((faq, index) => (
                <AccordionItem 
                  key={`servico-${index}`} 
                  value={`servico-${index}`}
                  className="bg-muted/30 rounded-lg border-0 px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-3 text-sm">
                    <span className="text-left font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Processo */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CalendarCheck className="h-4 w-4 text-blue-600" />
              </div>
              <h4 className="font-semibold text-sm text-primary">Como Funciona</h4>
            </div>
            <Accordion type="single" collapsible className="space-y-1.5">
              {PARECER_FAQ.filter(f => f.category === "processo").map((faq, index) => (
                <AccordionItem 
                  key={`processo-${index}`} 
                  value={`processo-${index}`}
                  className="bg-muted/30 rounded-lg border-0 px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-3 text-sm">
                    <span className="text-left font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Investimento */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Banknote className="h-4 w-4 text-green-600" />
              </div>
              <h4 className="font-semibold text-sm text-primary">Investimento e Valor</h4>
            </div>
            <Accordion type="single" collapsible className="space-y-1.5">
              {PARECER_FAQ.filter(f => f.category === "investimento").map((faq, index) => (
                <AccordionItem 
                  key={`investimento-${index}`} 
                  value={`investimento-${index}`}
                  className="bg-muted/30 rounded-lg border-0 px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-3 text-sm">
                    <span className="text-left font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Confiança */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <BadgeCheck className="h-4 w-4 text-amber-600" />
              </div>
              <h4 className="font-semibold text-sm text-primary">Credenciais e Garantias</h4>
            </div>
            <Accordion type="single" collapsible className="space-y-1.5">
              {PARECER_FAQ.filter(f => f.category === "confianca").map((faq, index) => (
                <AccordionItem 
                  key={`confianca-${index}`} 
                  value={`confianca-${index}`}
                  className="bg-muted/30 rounded-lg border-0 px-3"
                >
                  <AccordionTrigger className="hover:no-underline py-3 text-sm">
                    <span className="text-left font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Link para FAQ completa */}
          <div className="pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Tem dúvidas sobre dados oficiais, metodologia ou aspectos legais?
              </p>
              <Link to="/faq">
                <Button variant="outline" size="sm" className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Ver FAQ Completa
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      {parecerRequested ? (
        <Card className="border-green-500/30 bg-green-50">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-800">
                Solicitação de Parecer Técnico Enviada!
              </h3>
              <p className="text-green-700">
                Obrigado, <strong>{data.leadName}</strong>! Nossa equipe entrará em contato em breve 
                para iniciar a proteção do seu patrimônio.
              </p>
              <p className="text-sm text-green-600">
                Também abrimos o WhatsApp para você enviar uma mensagem direta.
              </p>
              <Button onClick={onNewValuation} variant="outline" className="mt-4">
                Fazer Nova Consulta de Valor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-accent/30 bg-gradient-to-b from-accent/5 to-transparent">
          <CardContent className="py-8">
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-xl font-bold">
                  🏆 Próximo Passo: Validação Técnica Completa
                </h3>
                <p className="text-muted-foreground mt-2">
                  Proteja seu patrimônio com o <strong>Parecer Técnico Godoy Prime</strong>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleRequestParecer}
                  disabled={isRequesting}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  size="lg"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {isRequesting ? "Enviando..." : "Solicitar Parecer Técnico"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open("tel:+5521964075124", "_self")}
                  size="lg"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Ligar: (21) 96407-5124
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Ao solicitar, você será redirecionado para o WhatsApp de Marcus Godoy
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão Nova Avaliação */}
      {!parecerRequested && (
        <div className="text-center">
          <Button variant="ghost" onClick={onNewValuation} className="text-muted-foreground">
            ← Voltar e fazer nova consulta
          </Button>
        </div>
      )}
    </div>
  );
}
