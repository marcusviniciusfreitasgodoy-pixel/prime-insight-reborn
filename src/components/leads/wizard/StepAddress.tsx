import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Home, Building2, ArrowRight, MapPin, Loader2 } from "lucide-react";
import { useStreetSuggestions } from "@/hooks/useStreetSuggestions";
import { BAIRROS_RIO, isBairroCoberturaForte, normalizeBairro } from "@/utils/bairrosRio";

const TIPOLOGIAS = [
  { value: "Apartamento", label: "Apartamento", icon: Building2 },
  { value: "Casa", label: "Casa", icon: Home },
  { value: "Cobertura", label: "Cobertura", icon: Building2 },
] as const;

interface Props {
  tipologia: string;
  bairro: string;
  logradouro: string;
  numero: string;
  onChange: (patch: { tipologia?: string; bairro?: string; logradouro?: string; numero?: string }) => void;
  onNext: () => void;
}

export function StepAddress({ tipologia, bairro, logradouro, numero, onChange, onNext }: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [streetSelected, setStreetSelected] = useState(!!logradouro);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bairroNormalized = normalizeBairro(bairro);
  const { data: suggestions, isLoading } = useStreetSuggestions(
    logradouro,
    bairroNormalized || "BARRA DA TIJUCA",
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const canAdvance =
    !!tipologia &&
    bairroNormalized.length >= 3 &&
    logradouro.trim().length >= 3;

  const showCoberturaNote =
    bairroNormalized.length >= 3 && !isBairroCoberturaForte(bairroNormalized);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-[250ms]">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0C2340] mb-1">Vamos começar pelo endereço</h2>
        <p className="text-sm text-muted-foreground">Quanto mais preciso, melhor a estimativa.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#0C2340]">Tipo de imóvel</Label>
        <div className="grid grid-cols-3 gap-2">
          {TIPOLOGIAS.map(({ value, label, icon: Icon }) => {
            const active = tipologia === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ tipologia: value })}
                className={`min-h-[88px] rounded-xl border-2 p-3 flex flex-col items-center justify-center gap-1.5 transition-all duration-[250ms] ${
                  active
                    ? "border-[#C9A84C] bg-[#C9A84C]/5 text-[#0C2340]"
                    : "border-[#0C2340]/15 text-[#0C2340]/70 hover:border-[#0C2340]/40"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-[#C9A84C]" : ""}`} />
                <span className="text-xs sm:text-sm font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2" ref={wrapperRef}>
        <Label htmlFor="bairro" className="text-sm font-medium text-[#0C2340]">
          Bairro
        </Label>
        <Input
          id="bairro"
          list="bairros-rio-list"
          value={bairro}
          onChange={(e) => onChange({ bairro: e.target.value })}
          placeholder="Ex: Barra da Tijuca, Ipanema, Tijuca..."
          className="h-12 rounded-[2px]"
          autoComplete="off"
          maxLength={80}
        />
        <datalist id="bairros-rio-list">
          {BAIRROS_RIO.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
        {showCoberturaNote && (
          <p className="text-xs text-[#6B6359] leading-relaxed pt-1">
            Estimativa indicativa. Nossa base é mais densa na Zona Oeste do Rio.
            Para outros bairros, recomendamos um Parecer Técnico para precisão.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="logradouro" className="text-sm font-medium text-[#0C2340]">
          Rua / Avenida
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C2340]/40" />
          <Input
            id="logradouro"
            value={logradouro}
            onChange={(e) => {
              onChange({ logradouro: e.target.value });
              setShowSuggestions(true);
              setStreetSelected(false);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={
              bairroNormalized
                ? "Digite o nome da rua..."
                : "Preencha o bairro primeiro"
            }
            className="pl-9 h-12 rounded-[2px]"
            autoComplete="off"
            disabled={bairroNormalized.length < 3}
          />
          {showSuggestions && logradouro.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#0C2340]/15 rounded-lg shadow-lg max-h-64 overflow-y-auto z-[100]">
              {isLoading && (
                <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
                </div>
              )}
              {!isLoading && suggestions && suggestions.length === 0 && (
                <div className="px-3 py-3 text-sm text-muted-foreground">
                  Nenhum resultado. Você pode continuar mesmo assim.
                </div>
              )}
              {!isLoading &&
                suggestions?.map((s, i) => (
                  <button
                    key={`${s.logradouro}-${i}`}
                    type="button"
                    onClick={() => {
                      onChange({ logradouro: s.nome_condominio || s.logradouro });
                      setShowSuggestions(false);
                      setStreetSelected(true);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#C9A84C]/10 text-sm border-b border-[#0C2340]/5 last:border-0"
                  >
                    <div className="font-medium text-[#0C2340]">{s.nome_condominio || s.logradouro}</div>
                    {s.nome_condominio && (
                      <div className="text-xs text-muted-foreground">{s.logradouro}</div>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {(streetSelected || logradouro.trim().length >= 3) && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-[250ms]">
          <Label htmlFor="numero" className="text-sm font-medium text-[#0C2340]">
            Número <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Input
            id="numero"
            value={numero}
            onChange={(e) => onChange({ numero: e.target.value })}
            placeholder="Ex: 1500"
            className="h-12"
            inputMode="numeric"
          />
        </div>
      )}

      <Button
        type="button"
        onClick={onNext}
        disabled={!canAdvance}
        className="w-full h-12 bg-[#0C2340] hover:bg-[#0C2340]/90 text-white font-semibold"
      >
        Continuar <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}