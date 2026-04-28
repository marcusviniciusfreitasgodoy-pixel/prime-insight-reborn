import { Check, X, AlertTriangle, Shield } from "lucide-react";

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
    withParecer: "Alto (laudo técnico em mãos)",
  },
  {
    criteria: "Risco de prejuízo",
    alone: "R$ 100-300 mil",
    withParecer: "Minimizado com análise profissional",
  },
];

export function ComparisonTable() {
  const renderCell = (value: boolean | string, isPositive: boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-green-600 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-red-500 mx-auto" />
      );
    }
    return (
      <span className={`text-xs sm:text-sm ${isPositive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {value}
      </span>
    );
  };

  const renderInline = (value: boolean | string, isPositive: boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <span className="inline-flex items-center gap-1 font-medium text-green-700">
          <Check className="h-4 w-4" /> Sim
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-medium text-red-600">
          <X className="h-4 w-4" /> Não
        </span>
      );
    }
    return (
      <span className={`text-xs leading-snug ${isPositive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {value}
      </span>
    );
  };

  return (
    <div className="w-full">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 text-center flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
        <span>Negociar Sozinho vs. Com Parecer Godoy Prime</span>
      </h3>

      {/* ===== MOBILE: cards empilhados ===== */}
      <div className="sm:hidden space-y-3">
        {comparisonData.map((row, index) => (
          <div key={index} className="rounded-lg border border-border overflow-hidden bg-card">
            <div className="px-3 py-2 bg-muted/50 border-b border-border">
              <p className="text-xs font-semibold text-foreground">{row.criteria}</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border">
              <div className="p-3 bg-red-50/60 space-y-1">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-red-700">
                  <AlertTriangle className="h-3 w-3" /> Sozinho
                </div>
                <div>{renderInline(row.alone, false)}</div>
              </div>
              <div className="p-3 bg-green-50/60 space-y-1">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-green-700">
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
              <th className="text-center p-3 bg-red-50 border-b border-red-200 font-medium text-red-700 text-sm">
                <div className="flex items-center justify-center gap-1">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Negociar Sozinho</span>
                </div>
              </th>
              <th className="text-center p-3 bg-green-50 border-b border-green-200 font-medium text-green-700 text-sm">
                <div className="flex items-center justify-center gap-1">
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  <span>Com Parecer ⭐</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row, index) => (
              <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3 text-sm text-muted-foreground font-medium">{row.criteria}</td>
                <td className="p-3 text-center bg-red-50/50">{renderCell(row.alone, false)}</td>
                <td className="p-3 text-center bg-green-50/50">{renderCell(row.withParecer, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800 text-center leading-relaxed">
          <strong>⚠️ Atenção:</strong> Vendedor + Corretor + Imobiliária lucram quando você paga mais.
          Você precisa de um defensor técnico exclusivo do seu lado.
        </p>
      </div>
    </div>
  );
}
