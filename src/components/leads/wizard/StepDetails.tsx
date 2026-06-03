import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

const TOGGLES: Array<{ key: keyof DetailsState; label: string }> = [
  { key: "vistaMar", label: "Vista para o mar" },
  { key: "reformado", label: "Reformado recentemente" },
  { key: "varandaGourmet", label: "Varanda gourmet" },
];

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

      <div className="rounded-xl border border-[#0C2340]/10 bg-white p-4 space-y-3">
        {TOGGLES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between min-h-[44px]">
            <Label htmlFor={`toggle-${key}`} className="text-sm font-medium text-[#0C2340] cursor-pointer">
              {label}
            </Label>
            <Switch
              id={`toggle-${key}`}
              checked={details[key] as boolean}
              onCheckedChange={(v) => onChange({ [key]: v } as Partial<DetailsState>)}
              className="data-[state=checked]:bg-[#C9A84C]"
            />
          </div>
        ))}
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