import { Minus, Plus } from "lucide-react";

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export function NumberStepper({ label, value, onChange, min = 0, max = 20 }: NumberStepperProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-[#0C2340]/10 last:border-0">
      <span className="text-sm sm:text-base font-medium text-[#0C2340]">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Diminuir ${label}`}
          className="h-11 w-11 rounded-full border border-[#0C2340]/20 flex items-center justify-center hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-[250ms]"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-base font-semibold text-[#0C2340] tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Aumentar ${label}`}
          className="h-11 w-11 rounded-full border border-[#0C2340]/20 flex items-center justify-center hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-[250ms]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}