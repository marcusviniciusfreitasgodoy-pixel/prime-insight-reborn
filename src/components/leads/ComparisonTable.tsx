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
  const renderValue = (value: boolean | string, isPositive: boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-green-500 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-red-400 mx-auto" />
      );
    }
    return (
      <span className={`text-sm ${isPositive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
        {value}
      </span>
    );
  };

  return (
    <div className="w-full overflow-x-auto -mx-2 px-2">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 text-center flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
        <span>Negociar Sozinho vs. Com Parecer Godoy Prime</span>
      </h3>
      <table className="w-full border-collapse min-w-[320px]">
        <thead>
          <tr>
            <th className="text-left p-2 sm:p-3 bg-muted/50 border-b border-border font-medium text-foreground text-xs sm:text-sm">
              Critério
            </th>
            <th className="text-center p-2 sm:p-3 bg-red-50 border-b border-red-200 font-medium text-red-700 text-xs sm:text-sm">
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Negociar Sozinho</span>
                <span className="sm:hidden">Sozinho</span>
              </div>
            </th>
            <th className="text-center p-2 sm:p-3 bg-green-50 border-b border-green-200 font-medium text-green-700 text-xs sm:text-sm">
              <div className="flex items-center justify-center gap-1">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Com Parecer ⭐</span>
                <span className="sm:hidden">Parecer ⭐</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {comparisonData.map((row, index) => (
            <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              <td className="p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground font-medium">
                {row.criteria}
              </td>
              <td className="p-2 sm:p-3 text-center bg-red-50/50">
                {renderValue(row.alone, false)}
              </td>
              <td className="p-2 sm:p-3 text-center bg-green-50/50">
                {renderValue(row.withParecer, true)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800 text-center">
          <strong>⚠️ Atenção:</strong> Vendedor + Corretor + Imobiliária lucram quando você paga mais. 
          Você precisa de um defensor técnico exclusivo do seu lado.
        </p>
      </div>
    </div>
  );
}
