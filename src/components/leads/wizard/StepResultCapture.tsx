import { ShieldCheck, TrendingUp, ArrowLeft, MessageCircle } from "lucide-react";
import { whatsappUrl, WHATSAPP_MESSAGES } from "@/config/contact";

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
  prefilledEmail?: string;
  prefilledName?: string;
  googleVerified: boolean;
  isSubmitting: boolean;
  onSubmit: (data: { email: string; nome: string; telefone: string; googleVerified: boolean }) => void;
  onBeforeGoogleRedirect: () => void;
  onBack: () => void;
  bairro?: string;
  tipologia?: string;
  area?: number;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function StepResultCapture({
  estimativa,
  intention,
  prefilledEmail,
  prefilledName,
  googleVerified,
  isSubmitting,
  onSubmit,
  onBeforeGoogleRedirect,
  onBack,
  bairro,
  tipologia,
  area,
}: Props) {
  const { itbiData, estimativa: e } = estimativa;

  const whatsappLaudoUrl = whatsappUrl(
    WHATSAPP_MESSAGES.laudoCompletoDireto({
      bairro,
      tipologia,
      area,
      estimativaMed: e.med,
    }),
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-[250ms]">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center text-sm text-[#0C2340]/60 hover:text-[#0C2340]"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </button>

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

      {/* Único caminho: contato direto com o especialista pelo WhatsApp */}
      <div className="rounded-[2px] border border-[#0C2340]/15 bg-white p-4 sm:p-5 space-y-3">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#C9A84C] font-semibold mb-1">
            Próximo passo
          </div>
          <h3 className="font-bold text-[#0C2340]">Fale com o especialista pelo WhatsApp</h3>
          <p className="text-xs text-[#0C2340]/70 mt-1">
            Receba a análise detalhada direto na conversa, sem preencher formulário.
          </p>
        </div>
        <a
          href={whatsappLaudoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-11 rounded-[2px] bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          Abrir conversa no WhatsApp
        </a>
        <p className="text-[11px] text-center text-muted-foreground">
          Conversa direta com Marcus Godoy (CRECI-RJ 11841). Análise feita manualmente no chat.
        </p>
      </div>
    </div>
  );
}