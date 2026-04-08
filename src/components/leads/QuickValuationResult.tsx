import { useState, useEffect, lazy, Suspense } from "react";
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
  MessageSquareHeart,
  Map,
  Loader2,
  ArrowDown,
  ArrowUp,
  Minus,
} from "lucide-react";
import { PeritEvaluationSection } from "./PeritEvaluationSection";
import { HistoricalAnalysisChart } from "@/components/valuation/HistoricalAnalysisChart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackParecerSolicitado, trackWhatsAppClick } from "@/utils/metaPixel";

const PropertyMap = lazy(() => import("@/components/map/PropertyMap").then(m => ({ default: m.PropertyMap })));

const PARECER_FAQ = [
  { category: "servico", question: "O que exatamente é o Parecer Técnico Godoy Prime?", answer: "É uma análise completa e personalizada do seu imóvel, elaborada por Marcus Godoy, perito avaliador credenciado pelo Tribunal de Justiça do Rio de Janeiro. Inclui visita técnica, análise de 26 características que impactam o valor, comparativo com transações recentes, e um laudo profissional que você pode usar em negociações, financiamentos e processos judiciais." },
  { category: "servico", question: "Qual a diferença entre a avaliação gratuita e o Parecer Técnico?", answer: "A avaliação gratuita usa médias estatísticas da região. O Parecer Técnico considera os diferenciais ESPECÍFICOS do seu imóvel: vista, andar, reforma, estado de conservação, posição solar, infraestrutura do condomínio, etc. Essas características podem representar uma diferença de 15% a 30% no valor final." },
  { category: "servico", question: "O Parecer Técnico tem validade jurídica?", answer: "Sim. O laudo é assinado por perito avaliador credenciado, seguindo a metodologia NBR 14653-2 da ABNT. Pode ser usado em inventários, divórcios, financiamentos bancários, disputas judiciais e qualquer situação que exija comprovação técnica do valor do imóvel." },
  { category: "processo", question: "Como funciona o processo do Parecer Técnico?", answer: "1) Você solicita pelo WhatsApp; 2) Agendamos uma visita técnica ao imóvel (duração: 1-2 horas); 3) Analisamos os dados e comparamos com transações recentes; 4) Em até 5 dias úteis, você recebe o laudo completo em PDF com todos os detalhes da avaliação, inclusive fotos." },
  { category: "processo", question: "Preciso estar presente na visita técnica?", answer: "Recomendamos que você ou alguém de confiança esteja presente para esclarecer dúvidas sobre reformas realizadas, histórico do imóvel e características que não são visíveis. Mas se não for possível, podemos realizar a vistoria com acesso ao imóvel." },
  { category: "processo", question: "Quanto tempo leva para receber o laudo?", answer: "O prazo padrão é de 5 dias úteis após a visita técnica. Em casos urgentes (inventários, propostas em andamento), oferecemos opção expressa com entrega em 48 horas mediante taxa adicional." },
  { category: "investimento", question: "Quanto custa o Parecer Técnico?", answer: "O investimento varia de acordo com a tipologia e complexidade do imóvel. Apartamentos padrão partem de R$ 4.900. Casas, coberturas e imóveis de alto padrão têm valores específicos. Entre em contato para um orçamento personalizado sem compromisso." },
  { category: "investimento", question: "Vale a pena investir no Parecer Técnico?", answer: "Considere: a diferença entre precificar corretamente e errar pode ser de R$ 50.000 a R$ 500.000 ou mais. Clientes que usam nosso parecer garantem economia e argumentos para uma boa negociação. O investimento se paga dezenas de vezes." },
  { category: "investimento", question: "E se eu não concordar com o valor do Parecer?", answer: "Oferecemos garantia de satisfação. Se você discordar fundamentadamente do valor apresentado, agendamos uma reunião para revisar os critérios. Nossa metodologia é transparente: você vê exatamente como chegamos a cada número. Em casos excepcionais, podemos refazer a análise sem custo adicional." },
  { category: "confianca", question: "Quem é Marcus Godoy?", answer: "Marcus Godoy é corretor de imóveis (CRECI 80.199) e perito avaliador credenciado pelo Tribunal de Justiça do Rio de Janeiro, com especialização em imóveis de alto padrão na Barra da Tijuca. A Godoy Prime Realty (CRECI 11841-PJ) é sua empresa especializada em consultoria imobiliária premium." },
  { category: "confianca", question: "Vocês têm alguma certificação ou credenciamento?", answer: "Sim. Somos registrados no CRECI-RJ (11841-PJ), Perito Avaliador credenciado junto ao Tribunal de Justiça do Rio de Janeiro. Seguimos a metodologia NBR 14653-2 da ABNT para avaliações, e utilizamos dados oficiais de transações registradas na cidade do Rio de Janeiro. Nossos laudos são aceitos por bancos, cartórios e tribunais." },
  { category: "confianca", question: "Posso ver exemplos de laudos anteriores?", answer: "Por questões de confidencialidade, não compartilhamos laudos de outros clientes. Porém, podemos mostrar a estrutura e o nível de detalhe do documento durante nossa conversa no WhatsApp, para que você veja exatamente o que receberá." },
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
  valorPedidoVendedor?: number;
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
  leadName: string;
  leadEmail: string;
  leadPhone: string;
}

interface QuickValuationResultProps {
  data: QuickValuationData;
  onNewValuation: () => void;
}

export function QuickValuationResult({ data, onNewValuation }: QuickValuationResultProps) {
  const navigate = useNavigate();
  const [parecerRequested, setParecerRequested] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);

  useEffect(() => {
    if (feedbackDismissed) return;
    const timer = setTimeout(() => setShowFeedbackModal(true), 20000);
    return () => clearTimeout(timer);
  }, [feedbackDismissed]);

  const handleFeedbackAccept = () => { setShowFeedbackModal(false); setFeedbackDismissed(true); navigate('/feedback'); };
  const handleFeedbackDismiss = () => { setShowFeedbackModal(false); setFeedbackDismissed(true); };

  const formatCurrency = (value: number, compact = false) => {
    if (compact && value >= 1000000) return `R$ ${(value / 1000000).toFixed(1).replace('.', ',')} mi`;
    if (compact && value >= 1000) return `R$ ${(value / 1000).toFixed(0)} mil`;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const hasData = data.itbiData && data.estimativa;

  // Gap calculation
  const hasGap = data.valorPedidoVendedor && data.valorPedidoVendedor > 0 && data.estimativa;
  const gapValue = hasGap ? data.valorPedidoVendedor! - data.estimativa!.med : 0;
  const gapPercent = hasGap ? ((gapValue / data.estimativa!.med) * 100) : 0;
  const gapDirection = gapValue > 0 ? "above" : gapValue < 0 ? "below" : "fair";

  const handleRequestParecer = async () => {
    setIsRequesting(true);
    try {
      trackParecerSolicitado({ bairro: data.bairro, valor_estimado: data.estimativa?.med });
      const { error } = await supabase.functions.invoke('send-lead-notification', {
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
        toast.success("Solicitação enviada com sucesso!");
      }
      setParecerRequested(true);
      setTimeout(() => {
        trackWhatsAppClick({ source: 'parecer_request', phone_number: '5521964075124' });
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
            <Button onClick={onNewValuation} variant="outline">Tentar Novamente</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Feedback Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
              <MessageSquareHeart className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Sua opinião é importante!</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Ajude-nos a melhorar! Responda nossa pesquisa rápida de <strong>2 minutos</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex flex-col gap-2">
              <Button onClick={handleFeedbackAccept} className="w-full bg-primary hover:bg-primary/90" size="lg">
                <MessageSquareHeart className="mr-2 h-5 w-5" />
                Participar da Pesquisa
              </Button>
              <Button variant="ghost" onClick={handleFeedbackDismiss} className="w-full text-muted-foreground">Talvez depois</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Info Badge */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-green-800 text-sm sm:text-base truncate">{data.leadName}</p>
            <p className="text-xs text-green-600 truncate">{data.leadEmail}</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs flex-shrink-0">Cadastro Confirmado</Badge>
      </div>

      {/* ===== GAP VISUAL (if valor pedido is provided) ===== */}
      {hasGap && (
        <Card className={`border-2 shadow-xl ${
          gapDirection === "above" ? "border-red-400/50 bg-gradient-to-br from-red-50 to-white" :
          gapDirection === "below" ? "border-green-400/50 bg-gradient-to-br from-green-50 to-white" :
          "border-blue-400/50 bg-gradient-to-br from-blue-50 to-white"
        }`}>
          <CardContent className="py-6 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-1">
                Comparação: Preço Pedido vs. Mercado Real
              </h3>
              <p className="text-sm text-muted-foreground">
                Baseado em {data.itbiData!.transaction_count} transações oficiais registradas
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {/* Valor pedido */}
              <div className="text-center p-2.5 sm:p-4 rounded-xl bg-white border border-border">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Valor pedido pelo vendedor</p>
                <p className="text-base sm:text-2xl font-bold text-foreground">{formatCurrency(data.valorPedidoVendedor!, true)}</p>
              </div>
              {/* Valor mercado */}
              <div className="text-center p-2.5 sm:p-4 rounded-xl bg-primary/5 border-2 border-primary/20">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Valor provável de mercado</p>
                <p className="text-base sm:text-2xl font-bold text-primary">{formatCurrency(data.estimativa!.med, true)}</p>
              </div>
            </div>

            {/* Gap indicator */}
            <div className={`text-center p-3 sm:p-4 rounded-xl ${
              gapDirection === "above" ? "bg-red-100 border border-red-200" :
              gapDirection === "below" ? "bg-green-100 border border-green-200" :
              "bg-blue-100 border border-blue-200"
            }`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                {gapDirection === "above" ? (
                  <ArrowUp className="h-5 w-5 text-red-600" />
                ) : gapDirection === "below" ? (
                  <ArrowDown className="h-5 w-5 text-green-600" />
                ) : (
                  <Minus className="h-5 w-5 text-blue-600" />
                )}
                <span className={`text-2xl font-bold ${
                  gapDirection === "above" ? "text-red-700" :
                  gapDirection === "below" ? "text-green-700" :
                  "text-blue-700"
                }`}>
                  {gapPercent > 0 ? "+" : ""}{gapPercent.toFixed(1)}%
                </span>
              </div>
              <p className={`text-sm font-medium ${
                gapDirection === "above" ? "text-red-700" :
                gapDirection === "below" ? "text-green-700" :
                "text-blue-700"
              }`}>
                {gapDirection === "above"
                  ? `O vendedor pede ${formatCurrency(Math.abs(gapValue), true)} acima do valor provável de mercado`
                  : gapDirection === "below"
                  ? `O preço pedido está ${formatCurrency(Math.abs(gapValue), true)} abaixo do valor provável — possível oportunidade`
                  : "O preço pedido está alinhado com o valor de mercado"}
              </p>
              {gapDirection === "above" && Math.abs(gapPercent) > 10 && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Diferença significativa — recomendamos um Parecer Técnico para negociação fundamentada.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
            <Badge variant="secondary" className="flex items-center gap-1"><MapPin className="h-3 w-3" />{data.bairro}</Badge>
            {data.logradouro && <Badge variant="outline" className="flex items-center gap-1">{data.logradouro}</Badge>}
            <Badge variant="secondary" className="flex items-center gap-1"><Maximize2 className="h-3 w-3" />{data.area_m2} m²</Badge>
            <Badge variant="secondary" className="flex items-center gap-1"><Home className="h-3 w-3" />{data.tipologia}</Badge>
          </div>

          <Separator />

          {/* Value Estimation */}
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

        </CardContent>
      </Card>

      {/* Perit evaluation section (includes pitch, comparison table, features, photo, guarantee, investment, prime buyer) */}
      <Card className="border-border shadow-lg">
        <CardContent className="py-6">
          <PeritEvaluationSection valorPedido={data.valorPedidoVendedor} valorMercado={data.estimativa?.med} />
        </CardContent>
      </Card>


      {/* FAQ Parecer */}
      <Card className="border-border">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Dúvidas sobre o Parecer Técnico</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Entenda como funciona nossa avaliação profissional completa</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {(["servico", "processo", "investimento", "confianca"] as const).map((cat) => {
            const catConfig = {
              servico: { label: "Sobre o Serviço", icon: FileText, color: "bg-[#D4AF37]/20 text-[#D4AF37]" },
              processo: { label: "Como Funciona", icon: CalendarCheck, color: "bg-blue-500/20 text-blue-600" },
              investimento: { label: "Investimento e Valor", icon: Banknote, color: "bg-green-500/20 text-green-600" },
              confianca: { label: "Credenciais e Garantias", icon: BadgeCheck, color: "bg-amber-500/20 text-amber-600" },
            }[cat];
            const Icon = catConfig.icon;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${catConfig.color.split(" ")[0]}`}>
                    <Icon className={`h-4 w-4 ${catConfig.color.split(" ")[1]}`} />
                  </div>
                  <h4 className="font-semibold text-sm text-primary">{catConfig.label}</h4>
                </div>
                <Accordion type="single" collapsible className="space-y-1.5">
                  {PARECER_FAQ.filter(f => f.category === cat).map((faq, index) => (
                    <AccordionItem key={`${cat}-${index}`} value={`${cat}-${index}`} className="bg-muted/30 rounded-lg border-0 px-3">
                      <AccordionTrigger className="hover:no-underline py-3 text-sm">
                        <span className="text-left font-medium">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground pb-3">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
          <div className="pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">Tem dúvidas sobre dados oficiais, metodologia ou aspectos legais?</p>
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

      {/* Parecer CTA */}
      {parecerRequested ? (
        <Card className="border-green-500/30 bg-green-50">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-800">Solicitação de Parecer Técnico Enviada!</h3>
              <p className="text-green-700">Obrigado, <strong>{data.leadName}</strong>! Nossa equipe entrará em contato em breve para iniciar a proteção do seu patrimônio.</p>
              <p className="text-sm text-green-600">Também abrimos o WhatsApp para você enviar uma mensagem direta.</p>
              <Button onClick={onNewValuation} variant="outline" className="mt-4">Fazer Nova Consulta de Valor</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-accent/30 bg-gradient-to-b from-accent/5 to-transparent">
          <CardContent className="py-8">
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-xl font-bold">🏆 Próximo Passo: Validação Técnica Completa</h3>
                <p className="text-muted-foreground mt-2">Proteja seu patrimônio com o <strong>Parecer Técnico Godoy Prime</strong></p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleRequestParecer} disabled={isRequesting} className="bg-[#C9A84C] hover:bg-[#b8963f] text-[#0C2340] shadow-lg font-semibold" size="lg">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {isRequesting ? "Enviando..." : "Solicitar Parecer Técnico"}
                </Button>
                <Button variant="outline" onClick={() => window.open("tel:+5521964075124", "_self")} size="lg">
                  <Phone className="mr-2 h-5 w-5" />
                  Ligar: (21) 96407-5124
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>🔒 Sem compromisso de contratação</span>
                <span>⚡ Retorno em até 2h</span>
                <span>📋 Orçamento gratuito</span>
              </div>
              <p className="text-xs text-muted-foreground">Preencha seus dados e nossa equipe entrará em contato em até 2 horas para agendar sua análise.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rodapé discreto */}
      <div className="text-center space-y-3 pt-4">
        <Link to="/feedback" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
          Ajude-nos a melhorar — responda nossa pesquisa rápida
        </Link>
        {!parecerRequested && (
          <p>
            <button onClick={onNewValuation} className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              ← Voltar e fazer nova consulta
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
