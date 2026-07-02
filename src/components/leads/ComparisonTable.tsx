import { Check, X, AlertTriangle, Shield, ShieldCheck } from "lucide-react";

const comparisonData = [
  {
    criteria: "Quem define o preço?",
    alone: "Você aceita o que dizem",
    withParecer: "Você decide com dados reais",
  },
  {
    criteria: "Informação sobre valor real",
    alone: false,
    withParecer: true,
  },
  {
    criteria: "Identificação de problemas que afetam o valor",
    alone: false,
    withParecer: true,
  },
  {
    criteria: "Potencial de valorização",
    alone: false,
    withParecer: true,
  },
  {
    criteria: "Poder de negociação",
    alone: "Baixo (sem argumentos técnicos)",
    withParecer: "Alto (Parecer Técnico em mãos)",
  },
  {
    criteria: "Potencial de economia",
    alone: "Perdido sem análise técnica",
    withParecer: "R$ 180-450 mil capturados com análise profissional",
  },
];

export function ComparisonTable() {
  const renderCell = (value: boolean | string, isPositive: boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <span className="inline-flex items-center justify-center gap-1.5 font-medium text-[#0C2340]">
          <Check className="h-4 w-4 text-[#C4993A]" />
          <span className="text-xs sm:text-sm">Sim</span>
        </span>
      ) : (
        <span className="inline-flex items-center justify-center gap-1.5 font-medium text-[#8C8278]">
          <X className="h-4 w-4 text-[#8C8278]" />
          <span className="text-xs sm:text-sm">Não</span>
        </span>
      );
    }
    return (
      <span className={`text-xs sm:text-sm ${isPositive ? "text-[#0C2340] font-medium" : "text-[#4A443C]"}`}>
        {value}
      </span>
    );
  };

  const renderInline = (value: boolean | string, isPositive: boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <span className="inline-flex items-center gap-1 font-medium text-[#0C2340]">
          <Check className="h-4 w-4 text-[#C4993A]" /> Sim
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-medium text-[#8C8278]">
          <X className="h-4 w-4" /> Não
        </span>
      );
    }
    return (
      <span className={`text-xs leading-snug ${isPositive ? "text-[#0C2340] font-medium" : "text-[#4A443C]"}`}>
        {value}
      </span>
    );
  };

  return (
    <div className="w-full">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 text-center flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-[#8C8278] flex-shrink-0" />
        <span>Negociar Sozinho vs. Com Parecer Godoy Prime</span>
      </h3>

      {/* ===== MOBILE: cards empilhados ===== */}
      <div className="sm:hidden space-y-3">
        {comparisonData.map((row, index) => (
          <div key={index} className="rounded-[2px] border border-border overflow-hidden bg-card">
            <div className="px-3 py-2 bg-muted/50 border-b border-border">
              <p className="text-xs font-semibold text-foreground">{row.criteria}</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="p-3 bg-[#F3EBE0]/60 space-y-1">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-[#8C8278]">
                  <AlertTriangle className="h-3 w-3" /> Sozinho
                </div>
                <div>{renderInline(row.alone, false)}</div>
              </div>
              <div className="p-3 bg-[#FAFAF8] space-y-1">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-[#C4993A]">
                  <Shield className="h-3 w-3" /> Com Parecer
                </div>
                <div>{renderInline(row.withParecer, true)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== DESKTOP: tabela tradicional ===== */}
      <div className="hidden sm:block w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 bg-muted/50 border-b border-border font-medium text-foreground text-sm">
                Critério
              </th>
              <th className="text-center p-3 bg-[#F3EBE0] border-b border-[#8C8278]/30 font-medium text-[#4A443C] text-sm">
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Negociar Sozinho</span>
                </div>
              </th>
              <th className="text-center p-3 bg-[#FAFAF8] border-b border-[#C4993A]/30 font-medium text-[#0C2340] text-sm">
                <div className="flex items-center justify-center gap-1">
                  <ShieldCheck className="h-4 w-4 flex-shrink-0 text-[#C4993A]" />
                  <span>Com Parecer</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row, index) => (
              <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3 text-sm text-muted-foreground font-medium">{row.criteria}</td>
                <td className="p-3 text-center bg-[#F3EBE0]/50">{renderCell(row.alone, false)}</td>
                <td className="p-3 text-center bg-[#FAFAF8]">{renderCell(row.withParecer, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-[#F3EBE0] border border-[#8C8278]/30 rounded-[2px]">
        <p className="text-xs text-[#4A443C] text-center leading-relaxed">
          <strong className="text-[#0C2340]">Atenção:</strong> Vendedor, Corretor e Imobiliária lucram quando você paga mais.
          Você precisa de um defensor técnico exclusivo do seu lado.
        </p>
      </div>
    </div>
  );
}
