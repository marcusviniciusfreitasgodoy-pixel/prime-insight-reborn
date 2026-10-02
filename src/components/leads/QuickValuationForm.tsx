import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Calculator, MapPin, Maximize2, Home, ArrowRight, ArrowLeft, Loader2, Building2, Search, BedDouble, Bath, Sparkles, Car, Star, User, Mail, Phone, Shield, ChevronDown, AlertCircle, RefreshCw, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/ui/currency-input";
import { supabase } from "@/integrations/supabase/client";
import { useStreetSuggestions } from "@/hooks/useStreetSuggestions";
import { useAllBairros } from "@/hooks/useBairroSuggestions";
import { toast } from "sonner";
import { LimitExceededScreen } from "./LimitExceededScreen";
import { sendLeadToCrm } from "@/lib/crmWebhook";
import { trackLead, trackEvent } from "@/lib/metaPixel";

export interface QuickValuationData {
  bairro: string;
  logradouro: string;
  area_m2: number;
  tipologia: string;
  quartos?: number;
  banheiros?: number;
  suites?: number;
  vagas?: number;
  diferenciais?: string;
  valorPedidoVendedor?: number;
  itbiData: {
    min_m2: number;
    med_m2: number;
    max_m2: number;
    transaction_count: number;
  } | null;
  estimativa: {
    min: number;
    med: number;
    max: number;
  } | null;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
}

interface QuickValuationFormProps {
  onComplete: (data: QuickValuationData) => void;
  onBairroChange?: (bairro: string) => void;
  onLogradouroChange?: (logradouro: string) => void;
  origem?: string;
}

const MAX_FREE_EVALUATIONS = Number.POSITIVE_INFINITY;

const TIPOLOGIAS = [
  { value: "Apartamento", label: "Apartamento" },
  { value: "Casa", label: "Casa" },
];

type FormStep = 1 | 2 | 3 | 4;

const STEP_LABELS = [
  { step: 1, label: "Localização", icon: MapPin },
  { step: 2, label: "Imóvel", icon: Home },
  { step: 3, label: "Valor", icon: DollarSign },
  { step: 4, label: "Seus Dados", icon: User },
];

export function QuickValuationForm({ onComplete, onBairroChange, onLogradouroChange, origem = "avaliacao_publica" }: QuickValuationFormProps) {
  // Step state
  const [currentStep, setCurrentStep] = useState<FormStep>(1);

  // Lead fields
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  // Property fields
  const [bairro, setBairro] = useState("BARRA DA TIJUCA");
  const [logradouro, setLogradouro] = useState("");
  const [nomeCondominio, setNomeCondominio] = useState("");
  const [area, setArea] = useState("");
  const [tipologia, setTipologia] = useState("Apartamento");
  const [quartos, setQuartos] = useState("");
  const [banheiros, setBanheiros] = useState("");
  const [suites, setSuites] = useState("");
  const [vagas, setVagas] = useState("");
  const [diferenciais, setDiferenciais] = useState("");
  const [valorPedido, setValorPedido] = useState("");

  // Honeypot
  const [honeypot, setHoneypot] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [currentEvaluationCount, setCurrentEvaluationCount] = useState(0);
  const [bairroPopoverOpen, setBairroPopoverOpen] = useState(false);
  const [bairroSearchFilter, setBairroSearchFilter] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading: suggestionsLoading } = useStreetSuggestions(logradouro, bairro);
  const { data: bairros, isLoading: bairrosLoading, isError: bairrosError, refetch: refetchBairros } = useAllBairros();

  useEffect(() => {
    onBairroChange?.(bairro);
  }, [bairro, onBairroChange]);

  useEffect(() => {
    if (logradouro.length >= 3) {
      const timer = setTimeout(() => {
        onLogradouroChange?.(logradouro);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      onLogradouroChange?.("");
    }
  }, [logradouro, onLogradouroChange]);

  useEffect(() => {
    const handleMapSelect = (e: CustomEvent<{ logradouro: string; bairro: string }>) => {
      const { logradouro: selectedLogradouro, bairro: selectedBairro } = e.detail;
      if (selectedLogradouro) setLogradouro(selectedLogradouro);
      if (selectedBairro) setBairro(selectedBairro);
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener("map-select-address", handleMapSelect as EventListener);
    return () => window.removeEventListener("map-select-address", handleMapSelect as EventListener);
  }, []);

  const handleSelectSuggestion = (suggestion: { logradouro: string; nome_condominio?: string }) => {
    setLogradouro(suggestion.nome_condominio || suggestion.logradouro);
    setShowSuggestions(false);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 11;
  };

  const canAdvanceStep = (step: FormStep): boolean => {
    switch (step) {
      case 1:
        return !!bairro;
      case 2: {
        const areaNum = parseFloat(area);
        return !!tipologia && !!areaNum && areaNum > 0;
      }
      case 3:
        return true; // all optional
      case 4:
        return nome.trim().length >= 3 && validateEmail(email) && validatePhone(telefone);
      default:
        return false;
    }
  };

  const getStepError = (step: FormStep): string => {
    switch (step) {
      case 1:
        if (!bairro) return "Selecione o bairro";
        return "";
      case 2: {
        const areaNum = parseFloat(area);
        if (!areaNum || areaNum <= 0) return "Informe a área do imóvel";
        return "";
      }
      case 4:
        if (!nome.trim() || nome.trim().length < 3) return "Nome deve ter pelo menos 3 caracteres";
        if (!validateEmail(email)) return "Email inválido";
        if (!validatePhone(telefone)) return "Telefone deve ter 10 ou 11 dígitos";
        return "";
      default:
        return "";
    }
  };

  const handleNext = () => {
    setError("");
    const stepError = getStepError(currentStep);
    if (stepError) {
      setError(stepError);
      return;
    }
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as FormStep);
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleBack = () => {
    setError("");
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FormStep);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (honeypot) return;

    const stepError = getStepError(4);
    if (stepError) {
      setError(stepError);
      return;
    }

    const areaNum = parseFloat(area);
    if (!bairro || !areaNum || areaNum <= 0) {
      setError("Preencha todos os campos obrigatórios do imóvel");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const phoneDigits = telefone.replace(/\D/g, "");
      const valorPedidoNum = valorPedido ? parseInt(valorPedido) : undefined;

      // Check evaluation limit
      const { data: leadCheck } = await supabase.rpc("check_lead_exists", { lead_email: normalizedEmail });
      const existingLead = leadCheck && leadCheck.length > 0 && leadCheck[0].exists_flag;
      const evaluationCount = existingLead ? leadCheck[0].current_count : 0;

      if (evaluationCount >= MAX_FREE_EVALUATIONS) {
        setCurrentEvaluationCount(evaluationCount);
        setLimitExceeded(true);
        setIsLoading(false);
        return;
      }

      // Register or update lead
      if (existingLead) {
        await supabase.rpc("update_lead_by_email", {
          p_email: normalizedEmail,
          p_nome: nome.trim(),
          p_telefone: phoneDigits,
          p_bairro_interesse: bairro,
          p_area_interesse: areaNum,
          p_quartos: quartos ? parseInt(quartos) : null,
          p_banheiros: banheiros ? parseInt(banheiros) : null,
          p_suites: suites ? parseInt(suites) : null,
          p_vagas: vagas ? parseInt(vagas) : null,
          p_diferenciais_imovel: diferenciais.trim() || null,
          p_valor_pedido_vendedor: valorPedidoNum || null,
        });
        await supabase.rpc("increment_lead_evaluation", { lead_email: normalizedEmail });
      } else {
        const { error: insertError } = await supabase.from("leads").insert({
          nome: nome.trim(),
          email: normalizedEmail,
          telefone: phoneDigits,
          bairro_interesse: bairro,
          area_interesse: areaNum,
          quartos: quartos ? parseInt(quartos) : null,
          banheiros: banheiros ? parseInt(banheiros) : null,
          suites: suites ? parseInt(suites) : null,
          vagas: vagas ? parseInt(vagas) : null,
          diferenciais_imovel: diferenciais.trim() || null,
          valor_pedido_vendedor: valorPedidoNum || null,
          interesse: "compra",
          origem,
          evaluation_count: 1,
        });
        if (insertError) throw insertError;
      }

      // Fetch ITBI data
      const { data: statsData, error: dbError } = await supabase.rpc("get_itbi_stats_filtered", {
        p_bairro: bairro,
        p_logradouro: logradouro.trim() || null,
        p_uso: "Residencial",
      });
      if (dbError) throw dbError;

      let itbiData = null;
      let estimativa = null;

      if (statsData && statsData.length > 0 && statsData[0].med_m2 > 0) {
        const row = statsData[0];
        itbiData = {
          min_m2: Math.round(row.min_m2),
          med_m2: Math.round(row.med_m2),
          max_m2: Math.round(row.max_m2),
          transaction_count: Number(row.transaction_count),
        };
        estimativa = {
          min: Math.round(row.min_m2 * areaNum),
          med: Math.round(row.med_m2 * areaNum),
          max: Math.round(row.max_m2 * areaNum),
        };
      }

      // Save public valuation
      if (itbiData && estimativa) {
        const spreadPct = itbiData.med_m2 > 0 ? ((itbiData.max_m2 - itbiData.min_m2) / itbiData.med_m2) * 100 : 0;
        try {
          await supabase.from("valuations").insert({
            user_id: null,
            origin: "public",
            logradouro: logradouro.trim() || bairro,
            bairro,
            property_area_m2: areaNum,
            property_type: tipologia.toLowerCase(),
            itbi_min_m2: itbiData.min_m2,
            itbi_med_m2: itbiData.med_m2,
            itbi_max_m2: itbiData.max_m2,
            itbi_transaction_count: itbiData.transaction_count,
            combined_min_m2: itbiData.min_m2,
            combined_med_m2: itbiData.med_m2,
            combined_max_m2: itbiData.max_m2,
            final_value_min: estimativa.min,
            final_value_med: estimativa.med,
            final_value_max: estimativa.max,
            confidence_level: itbiData.transaction_count >= 10 ? "green" : itbiData.transaction_count >= 5 ? "yellow_high" : "yellow",
            confidence_score: Math.min(100, itbiData.transaction_count * 5),
            documentation_status: "ok",
            documentation_factor: 1.0,
            total_adjustment: 0,
            spread_percentage: spreadPct,
          });
        } catch (saveErr) {
          console.error("Erro ao salvar avaliação pública:", saveErr);
        }
      }

      // Send notification
      try {
        await supabase.functions.invoke("send-lead-notification", {
          body: {
            type: existingLead ? "returning" : "initial",
            leadId: "",
            leadName: nome.trim(),
            leadEmail: normalizedEmail,
            leadPhone: phoneDigits,
            interesse: "compra",
            bairro,
            area: areaNum,
            tipologia,
            quartos: quartos ? parseInt(quartos) : undefined,
            banheiros: banheiros ? parseInt(banheiros) : undefined,
            suites: suites ? parseInt(suites) : undefined,
            vagas: vagas ? parseInt(vagas) : undefined,
            evaluationNumber: existingLead ? evaluationCount + 1 : 1,
            estimativaMin: estimativa?.min,
            estimativaMed: estimativa?.med,
            estimativaMax: estimativa?.max,
            enderecoImovelAnalise: logradouro.trim() || undefined,
          },
        });
      } catch (notificationError) {
        console.error("Error sending lead notification:", notificationError);
      }

      // Forward lead to external CRM (fire-and-forget)
      sendLeadToCrm("quick_valuation_form", {
        nome: nome.trim(),
        email: normalizedEmail,
        telefone: phoneDigits,
        bairro,
        logradouro: logradouro.trim() || null,
        area_m2: areaNum,
        tipologia,
        quartos: quartos ? parseInt(quartos) : null,
        banheiros: banheiros ? parseInt(banheiros) : null,
        suites: suites ? parseInt(suites) : null,
        vagas: vagas ? parseInt(vagas) : null,
        diferenciais: diferenciais.trim() || null,
        valor_pedido_vendedor: valorPedidoNum || null,
        interesse: "compra",
        origem,
        is_returning_lead: !!existingLead,
        evaluation_number: existingLead ? evaluationCount + 1 : 1,
        estimativa_min: estimativa?.min ?? null,
        estimativa_med: estimativa?.med ?? null,
        estimativa_max: estimativa?.max ?? null,
      });

      // Meta Pixel: 'Lead' SOMENTE no primeiro cadastro elegível.
      // Recorrentes disparam evento custom para não inflar a métrica oficial.
      if (existingLead) {
        trackEvent("ReturningLeadEvaluation", {
          content_name: "quick_valuation_form",
          evaluation_number: evaluationCount + 1,
          value: estimativa?.med ?? 0,
          currency: "BRL",
        });
      } else {
        trackLead({
          content_name: "quick_valuation_form",
          content_category: "new_lead",
          value: estimativa?.med ?? 0,
          currency: "BRL",
        });
      }

      onComplete({
        bairro,
        logradouro: logradouro.trim(),
        area_m2: areaNum,
        tipologia,
        quartos: quartos ? parseInt(quartos) : undefined,
        banheiros: banheiros ? parseInt(banheiros) : undefined,
        suites: suites ? parseInt(suites) : undefined,
        vagas: vagas ? parseInt(vagas) : undefined,
        diferenciais: diferenciais.trim() || undefined,
        valorPedidoVendedor: valorPedidoNum,
        itbiData,
        estimativa,
        leadName: nome.trim(),
        leadEmail: normalizedEmail,
        leadPhone: phoneDigits,
      });
    } catch (err) {
      console.error("Erro ao processar:", err);
      setError("Erro ao processar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (limitExceeded) {
    return <LimitExceededScreen evaluationCount={currentEvaluationCount} email={email} onRetry={() => setLimitExceeded(false)} />;
  }

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <Card className="border-accent/30 shadow-xl bg-card/80 backdrop-blur" ref={formTopRef}>
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-3 shadow-lg">
          <Calculator className="h-7 w-7 text-accent" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold">Análise Preliminar de Valor</CardTitle>
        <CardDescription className="text-sm">
          Preencha os dados e receba uma estimativa baseada em transações reais.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6 space-y-3">
          <Progress value={progressPercentage} className="h-2 [&>div]:bg-[#D4AF37]" />
          <div className="flex justify-between px-1 sm:px-0">
            {STEP_LABELS.map(({ step, label, icon: Icon }) => (
              <button
                key={step}
                type="button"
                onClick={() => {
                  if (step < currentStep) setCurrentStep(step as FormStep);
                }}
                className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs transition-colors min-w-0 ${
                  step === currentStep
                    ? "text-[#D4AF37] font-semibold"
                    : step < currentStep
                    ? "text-primary cursor-pointer hover:text-[#D4AF37]"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-110 ${
                    step === currentStep
                      ? "bg-[#D4AF37]/20 border-2 border-[#D4AF37] ring-2 ring-[#D4AF37]/30 animate-glow-pulse"
                      : step < currentStep
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted border border-muted-foreground/20"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="truncate max-w-[60px] sm:max-w-none text-[9px] sm:text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Honeypot */}
          <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
            <label htmlFor="website_url">Website</label>
            <input type="text" id="website_url" name="website_url" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
          </div>

          {/* ===== STEP 1: Localização ===== */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Onde fica o imóvel?
              </h3>

              <div className="space-y-2">
                <Label htmlFor="bairro" className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-accent" />
                  Bairro *
                </Label>
                <Popover open={bairroPopoverOpen} onOpenChange={setBairroPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={bairroPopoverOpen} className="w-full justify-between border-primary/20 focus:ring-accent/30 bg-background" disabled={bairrosLoading}>
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{bairrosLoading ? "Carregando..." : bairro || "Selecione o bairro"}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[100]" align="start" sideOffset={4} avoidCollisions={true}>
                    <div className="p-2 border-b bg-background">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar bairro..." value={bairroSearchFilter} onChange={(e) => setBairroSearchFilter(e.target.value)} className="pl-8 h-9" autoFocus />
                      </div>
                    </div>
                    <ScrollArea className="h-[250px]">
                      {bairrosError ? (
                        <div className="p-4 text-center space-y-3">
                          <div className="flex items-center justify-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">Erro ao carregar bairros</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => refetchBairros()} className="gap-2">
                            <RefreshCw className="h-3.5 w-3.5" />
                            Tentar novamente
                          </Button>
                        </div>
                      ) : bairrosLoading || !bairros || bairros.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                          Carregando bairros...
                        </div>
                      ) : (
                        (() => {
                          const filteredBairros = bairros.filter((b) => b.bairro.toLowerCase().includes(bairroSearchFilter.toLowerCase())).sort((a, b) => a.bairro.localeCompare(b.bairro, "pt-BR")).slice(0, 50);
                          if (filteredBairros.length === 0) {
                            return <div className="p-4 text-center text-sm text-muted-foreground">Nenhum bairro encontrado para "{bairroSearchFilter}"</div>;
                          }
                          return (
                            <div className="p-1">
                              {filteredBairros.map(({ bairro: b, total_transacoes }, index) => (
                                <button
                                  key={`${b}-${index}`}
                                  onClick={() => {
                                    setBairro(b);
                                    setBairroPopoverOpen(false);
                                    setBairroSearchFilter("");
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${bairro === b ? "bg-accent/10 text-foreground font-medium" : "hover:bg-muted"}`}
                                >
                                  <span className="truncate">{b}</span>
                                  <span className="text-xs text-muted-foreground shrink-0 ml-2">({total_transacoes.toLocaleString("pt-BR")})</span>
                                </button>
                              ))}
                            </div>
                          );
                        })()
                      )}
                      {bairros && bairros.filter((b) => b.bairro.toLowerCase().includes(bairroSearchFilter.toLowerCase())).length > 50 && (
                        <div className="py-2 px-2 text-xs text-muted-foreground text-center border-t">Digite para filtrar mais bairros...</div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logradouro" className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-accent" />
                  Endereço
                </Label>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    id="logradouro"
                    placeholder="Somente nome da Rua ou Avenida sem número"
                    value={logradouro}
                    onChange={(e) => { setLogradouro(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="border-primary/20 focus-visible:ring-accent/30 pr-10"
                    autoComplete="off"
                  />
                  {suggestionsLoading && logradouro.length >= 2 && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                  {!suggestionsLoading && logradouro.length >= 2 && <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="relative">
                  {showSuggestions && logradouro.length >= 2 && suggestionsLoading && (
                    <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-fade-in">
                      <div className="p-3 border-b border-border/50 flex items-center gap-2 bg-muted/30">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Buscando endereços...</span>
                      </div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="px-4 py-3 border-b border-border/50 last:border-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                              <div className="h-3 bg-muted/70 rounded animate-pulse w-1/2" />
                            </div>
                            <div className="h-5 w-16 bg-muted rounded animate-pulse shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showSuggestions && suggestions && suggestions.length > 0 && logradouro.length >= 2 && !suggestionsLoading && (
                    <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto animate-fade-in">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.logradouro}-${index}`}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-accent/10 border-b border-border/50 last:border-0 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {suggestion.nome_condominio ? (
                                <>
                                  <p className="font-medium text-sm truncate text-foreground">{suggestion.nome_condominio}</p>
                                  <p className="text-xs text-muted-foreground truncate">{suggestion.logradouro}</p>
                                </>
                              ) : (
                                <p className="font-medium text-sm truncate text-foreground">{suggestion.logradouro}</p>
                              )}
                              {suggestion.microbairro && <p className="text-xs text-accent mt-0.5">{suggestion.microbairro}</p>}
                            </div>
                            <Badge variant="secondary" className="shrink-0 text-xs bg-primary/10 text-primary">
                              {suggestion.total_transacoes} trans.
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showSuggestions && logradouro.length >= 2 && suggestions?.length === 0 && !suggestionsLoading && (
                    <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl p-4 text-center animate-fade-in">
                      <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum resultado para "<span className="font-medium">{logradouro}</span>"</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Tente outro termo ou digite apenas o nome da rua</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeCondominio" className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-accent" />
                  Nome do Condomínio
                  <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <Input
                  onFocus={() => setShowSuggestions(false)}
                  id="nomeCondominio"
                  placeholder="Ex: Condomínio Atlântico Sul"
                  value={nomeCondominio}
                  onChange={(e) => setNomeCondominio(e.target.value)}
                  className="border-primary/20 focus-visible:ring-accent/30"
                />
              </div>
            </div>
          )}

          {/* ===== STEP 2: Dados do Imóvel ===== */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dados do Imóvel
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipologia" className="flex items-center gap-2 text-sm font-medium">
                    <Home className="h-4 w-4 text-accent" />
                    Tipo *
                  </Label>
                  <Select value={tipologia} onValueChange={setTipologia}>
                    <SelectTrigger className="border-primary/20 focus:ring-accent/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOLOGIAS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area" className="flex items-center gap-2 text-sm font-medium">
                    <Maximize2 className="h-4 w-4 text-accent" />
                    Área (m²) *
                  </Label>
                  <Input id="area" type="number" placeholder="Ex: 120" value={area} onChange={(e) => setArea(e.target.value)} min="20" max="2000" className="border-primary/20 focus-visible:ring-accent/30" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">Características (opcional)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="quartos" className="flex items-center gap-1.5 text-xs"><BedDouble className="h-3.5 w-3.5 text-accent" />Quartos</Label>
                    <Input id="quartos" type="number" placeholder="0" value={quartos} onChange={(e) => setQuartos(e.target.value)} min="0" max="10" className="border-primary/20 focus-visible:ring-accent/30 h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="banheiros" className="flex items-center gap-1.5 text-xs"><Bath className="h-3.5 w-3.5 text-accent" />Banheiros</Label>
                    <Input id="banheiros" type="number" placeholder="0" value={banheiros} onChange={(e) => setBanheiros(e.target.value)} min="0" max="10" className="border-primary/20 focus-visible:ring-accent/30 h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="suites" className="flex items-center gap-1.5 text-xs"><Sparkles className="h-3.5 w-3.5 text-accent" />Suítes</Label>
                    <Input id="suites" type="number" placeholder="0" value={suites} onChange={(e) => setSuites(e.target.value)} min="0" max="10" className="border-primary/20 focus-visible:ring-accent/30 h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vagas" className="flex items-center gap-1.5 text-xs"><Car className="h-3.5 w-3.5 text-accent" />Vagas</Label>
                    <Input id="vagas" type="number" placeholder="0" value={vagas} onChange={(e) => setVagas(e.target.value)} min="0" max="10" className="border-primary/20 focus-visible:ring-accent/30 h-9" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Valor e Diferenciais ===== */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor e Diferenciais
              </h3>

              <div className="space-y-2">
                <Label htmlFor="valorPedido" className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4 text-accent" />
                  Valor pedido pelo vendedor
                  <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <CurrencyInput
                  id="valorPedido"
                  value={valorPedido}
                  onChange={setValorPedido}
                  placeholder="R$ 0"
                  className="border-primary/20 focus-visible:ring-accent/30"
                />
                <p className="text-xs text-muted-foreground">
                  Informe o preço anunciado para compararmos com o valor real de mercado.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diferenciais" className="flex items-center gap-2 text-sm font-medium">
                  <Star className="h-4 w-4 text-accent" />
                  Diferenciais (opcional)
                </Label>
                <Textarea
                  id="diferenciais"
                  placeholder="Ex: vista mar, acabamentos de luxo, automação, lazer completo..."
                  value={diferenciais}
                  onChange={(e) => setDiferenciais(e.target.value)}
                  className="border-primary/20 focus-visible:ring-accent/30 min-h-[60px] resize-none"
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {/* ===== STEP 4: Seus Dados ===== */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <Shield className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-xs text-green-700">
                  <strong>Privacidade:</strong> Seus dados são criptografados e utilizados exclusivamente para sua análise.
                </p>
              </div>

              <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                <User className="h-4 w-4" />
                Seus Dados
              </h3>

              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4 text-accent" />
                  Nome Completo *
                </Label>
                <Input id="nome" placeholder="Seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} className="border-primary/20 focus-visible:ring-accent/30" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-accent" />
                    E-mail *
                  </Label>
                  <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="border-primary/20 focus-visible:ring-accent/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4 text-accent" />
                    WhatsApp *
                  </Label>
                  <Input id="telefone" type="tel" placeholder="(21) 99999-9999" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} className="border-primary/20 focus-visible:ring-accent/30" />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-sm text-destructive text-center bg-destructive/10 py-2 rounded-lg">{error}</p>}

          {/* Navigation Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            )}

            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext} className="flex-1 bg-[#D4AF37] hover:bg-[#c9a432] text-[#0C2340] font-semibold" disabled={!canAdvanceStep(currentStep)}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" className="flex-1 min-w-0 px-3 sm:px-6 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg text-sm sm:text-base whitespace-nowrap" size="lg" disabled={isLoading || !canAdvanceStep(4)}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    Ver Análise Agora
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center pt-1">
            Etapa {currentStep} de 4 • ⚡ Resultado instantâneo baseado em transações reais
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
