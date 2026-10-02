import { AlertTriangle, TrendingDown, CheckCircle, ArrowRight } from "lucide-react";

const comparisons = [
  {
    label: "Portal A",
    value: "R$ 2.000.000",
    badge: "Preço de Anúncio",
    badgeColor: "border border-[#8C8278]/40 text-[#4A443C]",
    cardStyle: "border-[#8C8278]/30 bg-[#F3EBE0]",
    icon: TrendingDown,
    iconColor: "text-[#8C8278]",
  },
  {
    label: "Portal B",
    value: "R$ 1.600.000",
    badge: "Preço de Anúncio",
    badgeColor: "border border-[#8C8278]/40 text-[#4A443C]",
    cardStyle: "border-[#8C8278]/30 bg-[#F3EBE0]",
    icon: TrendingDown,
    iconColor: "text-[#8C8278]",
  },
  {
    label: "Godoy Prime",
    value: "R$ 1.300.000",
    badge: "Transação Real",
    badgeColor: "border border-[#C4993A] text-[#C4993A]",
    cardStyle: "border-[#C4993A] bg-[#FAFAF8]",
    icon: CheckCircle,
    iconColor: "text-[#C4993A]",
    highlight: true,
  },
];

export function RealCaseComparison() {
  return (
    <section className="py-10 sm:py-12 md:py-14 px-4 bg-[#FAFAF8]">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="w-12 h-px bg-[#D4AF37] mx-auto mb-6" />
          <h3 className="font-serif text-xl sm:text-2xl md:text-4xl font-bold text-[#0C2340] mb-3 sm:mb-4 leading-tight px-2">
            Quanto Você Pagaria a Mais?
          </h3>
          <p className="text-left text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Veja esse caso real: Apartamento de <span className="font-mono font-medium tracking-tight">99m²</span> na Avenida Lucio Costa na Barra da Tijuca avaliado por <span className="font-mono font-medium tracking-tight">2</span> portais imobiliários muito conhecidos e a nossa ferramenta.
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
                className={`relative rounded-[2px] p-5 sm:p-6 border transition-colors duration-300 ${item.cardStyle}`}
              >
                {item.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[#C4993A] text-[#0C2340] font-mono text-[10px] uppercase tracking-[0.16em] rounded-[2px] whitespace-nowrap">
                    VALOR REAL DE MERCADO
                  </div>
                )}
                <div className="text-center space-y-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[2px] mx-auto flex items-center justify-center border ${item.highlight ? "border-[#C4993A]/40" : "border-[#8C8278]/30"}`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.iconColor}`} />
                  </div>
                  <p className="text-sm font-semibold text-[#0C2340]">{item.label}</p>
                  <p className={`text-2xl sm:text-3xl font-mono font-medium tracking-tight ${item.highlight ? "text-[#0C2340]" : "text-[#4A443C]"}`}>
                    {item.value}
                  </p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-[2px] font-mono text-[10px] uppercase tracking-[0.16em] ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alert banner */}
        <div className="bg-[#0C2340] rounded-[2px] p-4 sm:p-6 text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-[#D4AF37]" />
            <p className="text-white font-bold text-base sm:text-lg">
              Duas fontes, valores muito diferentes para o mesmo imóvel
            </p>
          </div>
          <p className="text-white/70 text-sm">
            Qual valor você usaria para negociar a compra?
          </p>
        </div>

        {/* Explanation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#F3EBE0] border border-[#8C8278]/30 rounded-[2px] p-4 flex gap-3 transition-colors">
            <TrendingDown className="h-5 w-5 text-[#8C8278] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-[#4A443C] mb-1">Portais Imobiliários</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Os preços apresentados se baseiam nos anúncios em divulgação. Portanto o ponto de vista da avaliação é favorável ao Vendedor sempre. Objetivo final é de atrair novos anunciantes.
              </p>
            </div>
          </div>
          <div className="bg-[#FAFAF8] border border-[#C4993A]/40 rounded-[2px] p-4 flex gap-3 transition-colors">
            <CheckCircle className="h-5 w-5 text-[#C4993A] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-[#0C2340] mb-1">Godoy Prime</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Usa transações reais registradas na cidade do Rio de Janeiro, com o valor efetivamente pago após toda negociação. O objetivo é ajudar a comprar pelo preço justo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
