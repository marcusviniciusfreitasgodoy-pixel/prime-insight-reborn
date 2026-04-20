import { AlertTriangle, TrendingDown, CheckCircle, ArrowRight } from "lucide-react";

const comparisons = [
  {
    label: "Portal A",
    value: "R$ 2.000.000",
    badge: "Preço de Anúncio",
    badgeColor: "bg-destructive/10 text-destructive",
    cardStyle: "border-destructive/20 bg-red-50/50",
    icon: TrendingDown,
    iconColor: "text-destructive",
  },
  {
    label: "Portal B",
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
    <section className="py-10 sm:py-12 md:py-14 px-4 bg-gradient-to-b from-white to-[#D4AF37]/[0.05]">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="w-12 h-px bg-[#D4AF37] mx-auto mb-6" />
          <h3 className="font-serif text-xl sm:text-2xl md:text-4xl font-bold text-[#0C2340] mb-3 sm:mb-4 leading-tight px-2">
            Quanto Você Pagaria a Mais?
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Veja esse caso real: Apartamento de 99m² na Avenida Lucio Costa na Barra da Tijuca avaliado por 2 portais imobiliários muito conhecidos e a nossa ferramenta.
            <br />
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
                className={`relative rounded-xl sm:rounded-2xl p-5 sm:p-6 border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${item.highlight ? "animate-glow-pulse" : ""} ${item.cardStyle}`}
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <TrendingDown className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-destructive mb-1">Portais Imobiliários</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Os preços apresentados se baseiam nos anúncios em divulgação. Portanto o ponto de vista da avaliação é favorável ao Vendedor sempre. Objetivo final é de atrair novos anunciantes.
              </p>
            </div>
          </div>
          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-xl p-4 flex gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
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
