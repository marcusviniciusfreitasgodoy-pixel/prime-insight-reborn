import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const MESSAGES = [
  "Analisando transações recentes na Barra…",
  "Comparando com imóveis similares…",
  "Calculando faixa de mercado…",
];

export function AnalyzingLoader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setIndex(1), 500);
    const t2 = setTimeout(() => setIndex(2), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 min-h-[280px]">
      <Loader2 className="h-12 w-12 animate-spin text-[#C9A84C]" />
      <p
        key={index}
        className="text-sm sm:text-base text-[#0C2340] font-medium text-center animate-in fade-in duration-[250ms]"
      >
        {MESSAGES[index]}
      </p>
    </div>
  );
}