import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Maximize2 } from "lucide-react";
import { NumberStepper } from "./NumberStepper";

interface Props {
  area: string;
  quartos: number;
  onChange: (patch: { area?: string; quartos?: number }) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepProperty({ area, quartos, onChange, onNext, onBack }: Props) {
  const areaNum = parseFloat(area);
  const canAdvance = !!areaNum && areaNum > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-[250ms]">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0C2340] mb-1">Sobre o imóvel</h2>
        <p className="text-sm text-muted-foreground">Esses dados definem 80% do valor.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="area" className="text-sm font-medium text-[#0C2340]">
          Área (m²)
        </Label>
        <div className="relative">
          <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C2340]/40" />
          <Input
            id="area"
            type="number"
            inputMode="decimal"
            value={area}
            onChange={(e) => onChange({ area: e.target.value })}
            placeholder="Ex: 120"
            className="pl-9 h-12 text-lg font-semibold"
            min="1"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#0C2340]/10 bg-white px-4">
        <NumberStepper label="Quartos" value={quartos} onChange={(v) => onChange({ quartos: v })} min={0} max={10} />
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
          disabled={!canAdvance}
          className="flex-1 h-12 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white font-semibold"
        >
          Continuar <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}