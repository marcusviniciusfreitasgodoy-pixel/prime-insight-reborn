import { useState, FormEvent } from "react";
import { ShieldCheck, TrendingUp, ArrowLeft, MessageCircle, Loader2, Mail, Smartphone, Monitor } from "lucide-react";
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

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function StepResultCapture({
  estimativa,
  intention,
  prefilledEmail,
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
  const [email, setEmail] = useState(prefilledEmail ?? "");
  const [telefone, setTelefone] = useState("");
  const [touched, setTouched] = useState(false);

  const telefoneDigits = telefone.replace(/\D/g, "");
  const nomeOk = nome.trim().length >= 2;
  const emailOk = isEmail(email);
  const telefoneOk = telefoneDigits.length >= 10;
  const valid = nomeOk && emailOk && telefoneOk;

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    setTouched(true);
    if (!valid || isSubmitting) return;
    onSubmit({
      email: email.trim().toLowerCase(),
      nome: nome.trim(),
      telefone: telefoneDigits,
      googleVerified: false,
    });
  };

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

      {/* Formulário principal: receber o laudo completo na tela, e-mail e WhatsApp */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[2px] border border-[#0C2340]/15 bg-white p-4 sm:p-5 space-y-4"
      >
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#C9A84C] font-semibold mb-1">
            Próximo passo
          </div>
          <h3 className="font-bold text-[#0C2340]">Receba seu laudo completo agora</h3>
          <p className="text-xs text-[#0C2340]/70 mt-1">
            Você verá o laudo completo na tela e a mesma análise chega no seu e-mail e WhatsApp.
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-[#0C2340]/70">
            <span className="inline-flex items-center gap-1"><Monitor className="h-3.5 w-3.5 text-[#C9A84C]" /> Tela</span>
            <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-[#C9A84C]" /> E-mail</span>
            <span className="inline-flex items-center gap-1"><Smartphone className="h-3.5 w-3.5 text-[#C9A84C]" /> WhatsApp</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#0C2340]/70 mb-1">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(ev) => setNome(ev.target.value)}
              placeholder="Seu nome completo"
              autoComplete="name"
              className="w-full h-11 px-3 rounded-[2px] border border-[#0C2340]/20 bg-white text-[#0C2340] placeholder:text-[#0C2340]/40 focus:outline-none focus:border-[#C9A84C]"
            />
            {touched && !nomeOk && (
              <p className="mt-1 text-[11px] text-[#6B5B3E]">Informe seu nome completo.</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#0C2340]/70 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              inputMode="email"
              className="w-full h-11 px-3 rounded-[2px] border border-[#0C2340]/20 bg-white text-[#0C2340] placeholder:text-[#0C2340]/40 focus:outline-none focus:border-[#C9A84C] font-mono text-sm"
            />
            {touched && !emailOk && (
              <p className="mt-1 text-[11px] text-[#6B5B3E]">Informe um e-mail válido.</p>
            )}
          </div>

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
        </div>

        <button
          type="submit"
          disabled={isSubmitting || (touched && !valid)}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-[2px] bg-[#0C2340] hover:bg-[#0C2340]/90 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
            </>
          ) : (
            "Receber laudo completo"
          )}
        </button>
        <p className="text-[11px] text-center text-muted-foreground">
          Seus dados ficam protegidos. Usamos apenas para enviar o laudo e, se preferir, falar com você.
        </p>
      </form>

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-[#0C2340]/40">
        <div className="flex-1 h-px bg-[#0C2340]/10" />
        ou
        <div className="flex-1 h-px bg-[#0C2340]/10" />
      </div>

      <div className="rounded-[2px] border border-[#0C2340]/15 bg-white p-4 sm:p-5 space-y-3">
        <div className="text-center">
          <h3 className="font-bold text-[#0C2340]">Fale com o especialista pelo WhatsApp</h3>
          <p className="text-xs text-[#0C2340]/70 mt-1">
            Prefere conversar? Tire dúvidas direto com Marcus Godoy, sem formulário.
          </p>
        </div>
        <a
          href={whatsappLaudoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-11 rounded-[2px] border border-[#0C2340]/20 bg-white hover:bg-[#0C2340]/5 text-[#0C2340] font-semibold transition-colors"
        >
          <MessageCircle className="h-5 w-5 text-[#25D366]" />
          Abrir conversa no WhatsApp
        </a>
        <p className="text-[11px] text-center text-muted-foreground">
          Conversa direta com Marcus Godoy (CRECI-RJ 11841).
        </p>
      </div>
    </div>
  );
}