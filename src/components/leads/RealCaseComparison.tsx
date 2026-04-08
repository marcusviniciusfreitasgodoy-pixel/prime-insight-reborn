import { AlertTriangle, TrendingDown, CheckCircle, ArrowRight } from "lucide-react";

const comparisons = [
  {
    label: "Portal B",
    value: "R$ 2.000.000",
    badge: "Preço de Anúncio",
    badgeColor: "bg-destructive/10 text-destructive",
    cardStyle: "border-destructive/20 bg-red-50/50",
    icon: TrendingDown,
    iconColor: "text-destructive",
  },
  {
    label: "Portal A",
    value: "R$ 1.600.000",
    badge: "Preço de Anúncio",
    badgeColor: "bg-destructive/10 text-destructive",
    cardStyle: "border-destructive/20 bg-red-50/50",
    icon: TrendingDown,
    iconColor: "text-destructive",
  },
  {
    label: "Godoy Prime",
    value: "R$ 1.300.000",
    badge: "Transação Real",
    badgeColor: "bg-[#D4AF37]/15 text-[#0C2340]",
    cardStyle: "border-[#D4AF37] bg-[#D4AF37]/5 ring-2 ring-[#D4AF37]/20 shadow-lg",
    icon: CheckCircle,
    iconColor: "text-[#D4AF37]",
    highlight: true,
  },
];

export function RealCaseComparison() {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 bg-white">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-block px-3 sm:px-4 py-1 rounded-full bg-destructive/10 text-destructive text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            CASO REAL
          </span>
          <h3 className="text-xl sm:text-2xl md:text-4xl font-bold text-[#0C2340] mb-3 sm:mb-4 leading-tight px-2">
            Quanto Você Pagaria a Mais?
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Apartamento de 99m² na Barra da Tijuca avaliado por 3 ferramentas diferentes.
            Veja a diferença que a <strong className="text-[#0C2340]">fonte de dados</strong> faz.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {comparisons.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`relative rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 transition-all duration-300 ${item.cardStyle}`}
              >
                {item.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#D4AF37] text-[#0C2340] text-[10px] sm:text-xs font-bold rounded-full whitespace-nowrap">
                    VALOR REAL DE MERCADO
                  </div>
                )}
                <div className="text-center space-y-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl mx-auto flex items-center justify-center ${item.highlight ? "bg-[#D4AF37]/20" : "bg-destructive/10"}`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.iconColor}`} />
                  </div>
                  <p className="text-sm font-semibold text-[#0C2340]">{item.label}</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${item.highlight ? "text-[#0C2340]" : "text-destructive/80"}`}>
                    {item.value}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alert banner */}
        <div className="bg-[#0C2340] rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-[#D4AF37]" />
            <p className="text-white font-bold text-base sm:text-lg">
              Diferença de até <span className="text-[#D4AF37]">R$ 700 mil</span> no mesmo imóvel
            </p>
          </div>
          <p className="text-white/70 text-sm">
            Qual valor você usaria para negociar a compra?
          </p>
        </div>

        {/* Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <TrendingDown className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-destructive mb-1">Portais Imobiliários</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Usam preços de anúncios conforme desejo do vendedor, não o valor real de venda. Podem estar inflados em até 30%. Objetivo de atrair novos anunciantes.
              </p>
            </div>
          </div>
          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-xl p-4 flex gap-3">
            <CheckCircle className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-[#0C2340] mb-1">Godoy Prime</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Usa dados oficiais de transações reais registradas o valor que foi efetivamente pago após toda negociação. Objetivo de ajudar a comprar pelo preço justo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
