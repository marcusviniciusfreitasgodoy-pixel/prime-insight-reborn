import { useState, FormEvent } from "react";
import { z } from "zod";
import { ShieldCheck, TrendingUp, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import marcusGodoyImg from "@/assets/marcus-godoy-novo.jpg";

export interface EstimativaState {
  itbiData: {
    min_m2: number;
    med_m2: number;
    max_m2: number;
    transaction_count: number;
  };
  estimativa: { min: number; med: number; max: number };
}

interface Props {
  estimativa: EstimativaState;
  intention?: "vender" | "comprar" | null;
  prefilledName?: string;
  isSubmitting: boolean;
  onSubmit: (data: { nome: string; telefone: string }) => void;
  onBack: () => void;
  bairro?: string;
  tipologia?: string;
  area?: number;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const contactSchema = z.object({
  nome: z.string().trim().max(100, "Use no máximo 100 caracteres."),
  telefone: z.string().regex(/^\d{10,11}$/, "Informe um WhatsApp com DDD."),
});

export function StepResultCapture({
  estimativa,
  intention,
  prefilledName,
  isSubmitting,
  onSubmit,
  onBack,
  bairro,
  tipologia,
  area,
}: Props) {
  const { itbiData, estimativa: e } = estimativa;

  const [nome, setNome] = useState(prefilledName ?? "");
  const [telefone, setTelefone] = useState("");
  const [touched, setTouched] = useState(false);

  const telefoneDigits = telefone.replace(/\D/g, "");
  const parsed = contactSchema.safeParse({ nome, telefone: telefoneDigits });
  const nomeOk = nome.trim().length <= 100;
  const telefoneOk = /^\d{10,11}$/.test(telefoneDigits);
  const valid = parsed.success;

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    setTouched(true);
    if (!valid || isSubmitting) return;
    onSubmit({
      nome: nome.trim() || "Cliente Godoy Prime",
      telefone: telefoneDigits,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-[250ms]">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="h-auto px-0 py-1 text-xs text-[#0C2340]/60 hover:text-[#0C2340]"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Button>

      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#C9A84C] font-semibold">
          <TrendingUp className="h-3.5 w-3.5" /> Estimativa preliminar
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0C2340]">{fmt(e.med)}</h2>
        <p className="text-xs text-muted-foreground">
          Baseado em {itbiData.transaction_count} transações reais realizadas na região nos últimos 12 meses
        </p>
      </div>

      <div className="rounded-xl border border-[#0C2340]/10 bg-white p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Mínimo</div>
            <div className="text-base sm:text-lg font-bold text-[#0C2340]">{fmt(e.min)}</div>
          </div>
          <div className="border-x border-[#0C2340]/10">
            <div className="text-[10px] uppercase tracking-wider text-[#C9A84C]">Médio</div>
            <div className="text-base sm:text-lg font-bold text-[#C9A84C]">{fmt(e.med)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Máximo</div>
            <div className="text-base sm:text-lg font-bold text-[#0C2340]">{fmt(e.max)}</div>
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[#0C2340]/5 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-[#0C2340]/30 via-[#C9A84C] to-[#0C2340]/30" />
        </div>
        <p className="text-[11px] text-center text-muted-foreground mt-2">
          R$/m²: {fmt(itbiData.min_m2)} – {fmt(itbiData.med_m2)} – {fmt(itbiData.max_m2)}
        </p>
      </div>

      <div className="rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4 flex gap-3">
        <ShieldCheck className="h-5 w-5 text-[#C9A84C] shrink-0 mt-0.5" />
        <p className="text-sm text-[#0C2340] leading-relaxed">
          Esta é uma <strong>estimativa algorítmica</strong> baseada em transações reais
          realizadas na região do imóvel avaliado nos últimos 12 meses. Para imóveis
          exclusivos, a variação pode chegar a 15%.{" "}
          <span className="font-semibold">Deseja uma validação manual do nosso especialista?</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px] items-stretch">
       <aside className="md:order-2 rounded-[2px] border border-[#0C2340]/15 bg-[#F3EBE0] p-3 flex md:flex-col items-center gap-3 text-left md:text-center">
        <img src={marcusGodoyImg} alt="Marcus Godoy" className="h-16 w-14 md:h-24 md:w-20 object-cover object-top grayscale rounded-[2px] shrink-0" />
        <div>
          <h3 className="font-serif text-base md:text-lg font-bold text-[#0C2340]">Marcus Godoy</h3>
          <p className="font-mono text-[9px] uppercase tracking-[0.08em] leading-relaxed text-[#4A443C]">Perito Avaliador credenciado TJRJ, CRECI PF 80.199</p>
        </div>
       </aside>
       <form onSubmit={handleSubmit} className="md:order-1 rounded-[2px] border border-[#0C2340]/15 bg-white p-4 sm:p-5 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#C9A84C] font-semibold mb-1">
            Próximo passo
          </div>
          <h3 className="font-bold text-[#0C2340]">Receba sua análise preliminar completa</h3>
          <p className="text-xs text-[#0C2340]/70 mt-1">
             Informe seu WhatsApp para ver a análise completa e continuar com o especialista.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#0C2340]/70 mb-1">WhatsApp</label>
            <input
              type="tel"
              value={telefone}
              onChange={(ev) => setTelefone(maskPhone(ev.target.value))}
              placeholder="(21) 99999-9999"
              autoComplete="tel"
              inputMode="tel"
              className="w-full h-11 px-3 rounded-[2px] border border-[#0C2340]/20 bg-white text-[#0C2340] placeholder:text-[#0C2340]/40 focus:outline-none focus:border-[#C9A84C] font-mono text-sm"
            />
            {touched && !telefoneOk && (
              <p className="mt-1 text-[11px] text-[#6B5B3E]">Informe um WhatsApp com DDD.</p>
            )}
          </div>

          <div>
             <label className="block text-[11px] uppercase tracking-wider text-[#0C2340]/70 mb-1">Nome <span className="normal-case tracking-normal">(opcional)</span></label>
            <input
              type="text"
              value={nome}
              onChange={(ev) => setNome(ev.target.value)}
              placeholder="Seu nome completo"
              autoComplete="name"
              className="w-full h-11 px-3 rounded-[2px] border border-[#0C2340]/20 bg-white text-[#0C2340] placeholder:text-[#0C2340]/40 focus:outline-none focus:border-[#C9A84C]"
            />
             {touched && !nomeOk && (
               <p className="mt-1 text-[11px] text-[#6B5B3E]">Use no máximo 100 caracteres.</p>
            )}
          </div>
        </div>

         <Button
          type="submit"
          disabled={isSubmitting || (touched && !valid)}
           className="w-full h-12"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
            </>
          ) : (
            "Ver minha análise preliminar"
          )}
         </Button>
        <p className="text-[11px] text-center text-muted-foreground">
           Seus dados ficam seguros e não são compartilhados. Você recebe a análise e nada mais sem o seu ok.
        </p>
       </form>
      </div>
    </div>
  );
}