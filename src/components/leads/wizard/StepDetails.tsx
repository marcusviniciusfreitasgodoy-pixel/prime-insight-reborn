import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { NumberStepper } from "./NumberStepper";

export interface DetailsState {
  banheiros: number;
  suites: number;
  vagas: number;
  andar: number;
  vistaMar: boolean;
  reformado: boolean;
  varandaGourmet: boolean;
}

interface Props {
  details: DetailsState;
  onChange: (patch: Partial<DetailsState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepDetails({ details, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-[250ms]">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0C2340] mb-1">Detalhes do imóvel</h2>
        <p className="text-sm text-muted-foreground">Quanto mais detalhes, mais próxima do valor real.</p>
      </div>

      <div className="rounded-xl border border-[#0C2340]/10 bg-white px-4">
        <NumberStepper label="Banheiros" value={details.banheiros} onChange={(v) => onChange({ banheiros: v })} max={10} />
        <NumberStepper label="Suítes" value={details.suites} onChange={(v) => onChange({ suites: v })} max={10} />
        <NumberStepper label="Vagas de garagem" value={details.vagas} onChange={(v) => onChange({ vagas: v })} max={10} />
        <NumberStepper label="Andar" value={details.andar} onChange={(v) => onChange({ andar: v })} max={50} />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-12 border-[#0C2340]/20 text-[#0C2340]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={onNext}
          className="flex-1 h-12 bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-[#0C2340] font-semibold"
        >
          Ver minha avaliação <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}