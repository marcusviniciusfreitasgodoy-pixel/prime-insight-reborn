import { useState } from "react";
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
  Clock,
  FileText,
  Users,
  DollarSign,
  Award,
  CalendarCheck,
  Briefcase,
  BadgeCheck,
  Banknote,
  Building2,
  Scale,
  Cpu,
  Target
} from "lucide-react";
import { ComparisonTable } from "./ComparisonTable";
import { PeritEvaluationSection } from "./PeritEvaluationSection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// FAQ específica sobre o Parecer Técnico
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
  {
    category: "servico",
    question: "Essa ferramenta substitui uma avaliação técnica tradicional?",
    answer: "Não completamente, mas é um excelente complemento. A avaliação por ITBI é baseada em transações reais, usa método científico reconhecido e tem custo muito menor. Para imóveis com características únicas, reformas especiais ou localização premium, recomendamos complementar com avaliação técnica presencial.",
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
  {
    category: "processo",
    question: "Preciso renovar a avaliação periodicamente?",
    answer: "Depende do uso. Para venda iminente: renove a cada 3-6 meses. Para análise de investimento: anualmente. Para fins de ITBI: no momento da transação. Os dados são atualizados continuamente pela Prefeitura.",
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
    answer: "Considere: a diferença entre precificar corretamente e errar pode ser de R$ 50.000 a R$ 200.000 ou mais. Clientes que usam nosso parecer economizam em média R$ 67.000 em negociações. O investimento se paga dezenas de vezes.",
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
    answer: "Sim. Somos registrados no CRECI-RJ (11841-PJ), Perito Avaliador credenciado junto ao Tribunal de Justiça do Rio de Janeiro. Seguimos a metodologia NBR 14653-2 da ABNT para avaliações, e utilizamos dados oficiais ITBI da Prefeitura do Rio de Janeiro. Nossos laudos são aceitos por bancos, cartórios e tribunais.",
  },
  {
    category: "confianca",
    question: "Posso ver exemplos de laudos anteriores?",
    answer: "Por questões de confidencialidade, não compartilhamos laudos de outros clientes. Porém, podemos mostrar a estrutura e o nível de detalhe do documento durante nossa conversa no WhatsApp, para que você veja exatamente o que receberá.",
  },
  {
    category: "confianca",
    question: "Posso auditar os dados e metodologia de vocês?",
    answer: "Absolutamente. Oferecemos transparência total: você pode solicitar documentação completa da análise, verificar os dados nos portais da Prefeitura, e explicamos passo a passo como chegamos ao valor. Se discordar, podemos reanalisar e ajustar.",
  },
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
    answer: "Não. O IPTU usa fórmulas genéricas que resultam em valores frequentemente defasados. Já o ITBI reflete transações individualizadas e reais. A diferença entre ITBI e IPTU é normal e esperada. Inclusive, o STJ confirmou que as bases de cálculo são independentes e não devem ser confundidas.",
  },
  {
    category: "itbi",
    question: "Por que o IPTU é tão diferente do ITBI?",
    answer: "Porque o IPTU usa 'lançamento em massa' - fórmulas padronizadas que não acompanham a dinâmica real do mercado. O ITBI incide apenas sobre transações específicas, com valor efetivamente negociado. O STJ foi claro: 'se existe distorção, ela ocorre no IPTU, não no ITBI'.",
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
  // Categoria: Aspectos Legais
  {
    category: "legal",
    question: "Se a Prefeitura cobrar ITBI diferente do que declarei, o que faço?",
    answer: "Você tem direitos claros. Dentro de 30 dias, impugne administrativamente usando a decisão do STJ (Tema 1.113) que estabelece que o valor da escritura presume-se correto. Apresente documentação (contrato, negociação, justificativas). Nossa avaliação pode ser usada como suporte técnico no processo.",
  },
  {
    category: "legal",
    question: "Se eu vender abaixo da avaliação, terei problemas?",
    answer: "Em princípio, não - desde que a diferença seja justificada. O valor declarado presume-se correto (STJ, Tema 1.113). Pode haver razões legítimas (urgência, negociação). A Prefeitura só pode arbitrar se instaurar processo administrativo específico com contraditório.",
  },
  {
    category: "legal",
    question: "Por que o preço anunciado é tão diferente do ITBI?",
    answer: "O preço anunciado é o ponto de partida para negociação, não o final. Em média, é 17% a 30% mais alto que o valor pago. Exemplo: anúncio R$ 2.000.000, após negociação (-15%), valor final (ITBI) R$ 1.700.000. O anúncio reflete expectativa, o ITBI reflete a realidade.",
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
    answer: "Sim. Usamos tecnologia avançada: integração com bases públicas de ITBI, algoritmos para identificar imóveis similares, modelos de regressão para estimar valores, validação com múltiplas fontes, e dashboards interativos. Toda metodologia é transparente e explicável - não é uma 'caixa preta'.",
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
  const [parecerRequested, setParecerRequested] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

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
                Baseado em {data.itbiData!.transaction_count} transações dos últimos 12 meses
              </p>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <strong>Aviso:</strong> Esta é uma estimativa automática baseada em dados históricos de transações ITBI 
            e em regras estatísticas. Para ter certeza do valor real, você precisa de uma análise técnica completa.
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

          {/* ITBI - Dados e Metodologia */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <h4 className="font-semibold text-sm text-primary">Sobre Dados de ITBI</h4>
            </div>
            <Accordion type="single" collapsible className="space-y-1.5">
              {PARECER_FAQ.filter(f => f.category === "itbi").map((faq, index) => (
                <AccordionItem 
                  key={`itbi-${index}`} 
                  value={`itbi-${index}`}
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

          {/* Uso Prático */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Target className="h-4 w-4 text-cyan-600" />
              </div>
              <h4 className="font-semibold text-sm text-primary">Uso Prático da Avaliação</h4>
            </div>
            <Accordion type="single" collapsible className="space-y-1.5">
              {PARECER_FAQ.filter(f => f.category === "uso").map((faq, index) => (
                <AccordionItem 
                  key={`uso-${index}`} 
                  value={`uso-${index}`}
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

          {/* Aspectos Legais */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Scale className="h-4 w-4 text-red-600" />
              </div>
              <h4 className="font-semibold text-sm text-primary">Aspectos Legais e Tributários</h4>
            </div>
            <Accordion type="single" collapsible className="space-y-1.5">
              {PARECER_FAQ.filter(f => f.category === "legal").map((faq, index) => (
                <AccordionItem 
                  key={`legal-${index}`} 
                  value={`legal-${index}`}
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

          {/* Tecnologia */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Cpu className="h-4 w-4 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-sm text-primary">Tecnologia e Dados</h4>
            </div>
            <Accordion type="single" collapsible className="space-y-1.5">
              {PARECER_FAQ.filter(f => f.category === "tecnologia").map((faq, index) => (
                <AccordionItem 
                  key={`tecnologia-${index}`} 
                  value={`tecnologia-${index}`}
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
