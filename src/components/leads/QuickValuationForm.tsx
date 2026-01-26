import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, MapPin, Maximize2, Home, ArrowRight, Loader2, Building2, Search, BedDouble, Bath, Sparkles, Car, Star, User, Mail, Phone, Shield, ChevronDown, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useStreetSuggestions } from "@/hooks/useStreetSuggestions";
import { useAllBairros } from "@/hooks/useBairroSuggestions";
import { toast } from "sonner";
import { LimitExceededScreen } from "./LimitExceededScreen";
import { trackQuickValuation } from "@/utils/metaPixel";

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
  // Lead data
  leadName: string;
  leadEmail: string;
  leadPhone: string;
}

interface QuickValuationFormProps {
  onComplete: (data: QuickValuationData) => void;
  onBairroChange?: (bairro: string) => void;
  onLogradouroChange?: (logradouro: string) => void;
}

const MAX_FREE_EVALUATIONS = 5;

// Lista de bairros agora vem do banco de dados via useAllBairros hook

const TIPOLOGIAS = [
  { value: "Apartamento", label: "Apartamento" },
  { value: "Casa", label: "Casa" },
];

export function QuickValuationForm({ onComplete, onBairroChange, onLogradouroChange }: QuickValuationFormProps) {
  // Lead fields
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  
  // Property fields
  const [bairro, setBairro] = useState("BARRA DA TIJUCA");
  const [logradouro, setLogradouro] = useState("");
  const [area, setArea] = useState("");
  const [tipologia, setTipologia] = useState("Apartamento");
  const [quartos, setQuartos] = useState("");
  const [banheiros, setBanheiros] = useState("");
  const [suites, setSuites] = useState("");
  const [vagas, setVagas] = useState("");
  const [diferenciais, setDiferenciais] = useState("");
  
  // Honeypot field for bot detection (hidden from users)
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

  const { data: suggestions, isLoading: suggestionsLoading } = useStreetSuggestions(logradouro, bairro);
  const { data: bairros, isLoading: bairrosLoading, isError: bairrosError, refetch: refetchBairros } = useAllBairros();

  // Notify parent when bairro changes
  useEffect(() => {
    onBairroChange?.(bairro);
  }, [bairro, onBairroChange]);

  // Notify parent when logradouro changes (debounced)
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for address selection from map
  useEffect(() => {
    const handleMapSelect = (e: CustomEvent<{ logradouro: string; bairro: string }>) => {
      const { logradouro: selectedLogradouro, bairro: selectedBairro } = e.detail;
      if (selectedLogradouro) {
        setLogradouro(selectedLogradouro);
      }
      if (selectedBairro) {
        setBairro(selectedBairro);
      }
      // Scroll form into view on mobile
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
    if (digits.length <= 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Bot detection: if honeypot field is filled, silently reject
    if (honeypot) {
      console.log("Bot detected via honeypot");
      // Pretend success to avoid alerting bots
      return;
    }
    
    // Validate lead fields
    if (!nome.trim() || nome.trim().length < 3) {
      setError("Nome deve ter pelo menos 3 caracteres");
      return;
    }
    
    if (!validateEmail(email)) {
      setError("Email inválido");
      return;
    }
    
    if (!validatePhone(telefone)) {
      setError("Telefone deve ter 10 ou 11 dígitos");
      return;
    }
    
    // Validate property fields
    const areaNum = parseFloat(area);
    if (!bairro || !areaNum || areaNum <= 0) {
      setError("Preencha todos os campos obrigatórios do imóvel");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const phoneDigits = telefone.replace(/\D/g, "");
      
      // Step 1: Check evaluation limit BEFORE showing results
      const { data: leadCheck } = await supabase.rpc('check_lead_exists', {
        lead_email: normalizedEmail
      });
      
      const existingLead = leadCheck && leadCheck.length > 0 && leadCheck[0].exists_flag;
      const evaluationCount = existingLead ? leadCheck[0].current_count : 0;
      
      // If limit exceeded, show limit screen
      if (evaluationCount >= MAX_FREE_EVALUATIONS) {
        setCurrentEvaluationCount(evaluationCount);
        setLimitExceeded(true);
        setIsLoading(false);
        return;
      }
      
      // Step 2: Register or update lead
      if (existingLead) {
        // Update existing lead and increment evaluation count
        await supabase.rpc('update_lead_by_email', {
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
        });
        
        // Increment evaluation count
        await supabase.rpc('increment_lead_evaluation', {
          lead_email: normalizedEmail
        });
      } else {
        // Create new lead
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
          interesse: "compra",
          origem: "avaliacao_publica",
          evaluation_count: 1,
        });
        
        if (insertError) throw insertError;
      }
      
      // Step 3: Fetch ITBI data FIRST (before sending notification)
      let query = supabase
        .from("itbi_transactions")
        .select("valor_m2, total_transacoes")
        .eq("bairro", bairro)
        .eq("uso", "Residencial")
        .gte("percentual_transferido", 90)
        .not("valor_m2", "is", null)
        .gte("data_transacao", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

      if (logradouro.trim()) {
        query = query.ilike("logradouro", `%${logradouro.trim()}%`);
      }

      if (tipologia && tipologia !== "Todos") {
        query = query.ilike("tipologia", `%${tipologia}%`);
      }

      const { data, error: dbError } = await query;

      if (dbError) throw dbError;

      let itbiData = null;
      let estimativa = null;

      if (data && data.length > 0) {
        const valores = data.map((d) => d.valor_m2 as number).sort((a, b) => a - b);
        const totalTransacoes = data.reduce((sum, d) => sum + (d.total_transacoes || 1), 0);

        const min_m2 = valores[Math.floor(valores.length * 0.1)] || valores[0];
        const max_m2 = valores[Math.floor(valores.length * 0.9)] || valores[valores.length - 1];
        const med_m2 = valores.reduce((a, b) => a + b, 0) / valores.length;

        itbiData = {
          min_m2: Math.round(min_m2),
          med_m2: Math.round(med_m2),
          max_m2: Math.round(max_m2),
          transaction_count: totalTransacoes,
        };

        estimativa = {
          min: Math.round(min_m2 * areaNum),
          med: Math.round(med_m2 * areaNum),
          max: Math.round(max_m2 * areaNum),
        };
      }

      // Step 4: Send notification with valuation results
      try {
        await supabase.functions.invoke('send-lead-notification', {
          body: {
            type: existingLead ? 'returning' : 'initial',
            leadId: '',
            leadName: nome.trim(),
            leadEmail: normalizedEmail,
            leadPhone: phoneDigits,
            interesse: 'compra',
            bairro,
            area: areaNum,
            tipologia,
            quartos: quartos ? parseInt(quartos) : undefined,
            banheiros: banheiros ? parseInt(banheiros) : undefined,
            suites: suites ? parseInt(suites) : undefined,
            vagas: vagas ? parseInt(vagas) : undefined,
            evaluationNumber: existingLead ? evaluationCount + 1 : 1,
            // Include valuation results in notification
            estimativaMin: estimativa?.min,
            estimativaMed: estimativa?.med,
            estimativaMax: estimativa?.max,
            enderecoImovelAnalise: logradouro.trim() || undefined,
          }
        });
        console.log(`Lead notification sent (${existingLead ? 'returning' : 'initial'}) with valuation data`);
      } catch (notificationError) {
        console.error('Error sending lead notification:', notificationError);
      }

      // Track Meta Pixel event
      trackQuickValuation({
        bairro,
        tipologia,
        area_m2: areaNum,
        valor_estimado: estimativa?.med,
      });

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

  // Show limit exceeded screen
  if (limitExceeded) {
    return (
      <LimitExceededScreen 
        evaluationCount={currentEvaluationCount} 
        email={email}
        onRetry={() => setLimitExceeded(false)}
      />
    );
  }

  return (
    <Card className="border-accent/30 shadow-xl bg-card/80 backdrop-blur">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-4 shadow-lg">
          <Calculator className="h-8 w-8 text-accent" />
        </div>
        <CardTitle className="text-2xl font-bold">Sua Análise Preliminar de Valor Imobiliário Gratuita</CardTitle>
        <CardDescription className="text-base">
          Informe seus dados e os dados do imóvel para receber uma estimativa de valor de mercado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Privacy Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
            <p className="text-xs text-green-700">
              <strong>Privacidade:</strong> Seus dados são criptografados e utilizados exclusivamente para sua análise.
            </p>
          </div>
          
          {/* Honeypot field - hidden from real users, bots will fill it */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
            <label htmlFor="website_url">Website</label>
            <input 
              type="text" 
              id="website_url" 
              name="website_url" 
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          
          {/* Lead Fields Section */}
          <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
              <User className="h-4 w-4" />
              Seus Dados
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-accent" />
                Nome Completo *
              </Label>
              <Input
                id="nome"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="border-primary/20 focus-visible:ring-accent/30"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4 text-accent" />
                  E-mail *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-primary/20 focus-visible:ring-accent/30"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-4 w-4 text-accent" />
                  WhatsApp *
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(21) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  className="border-primary/20 focus-visible:ring-accent/30"
                />
              </div>
            </div>
          </div>

          {/* Property Fields Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dados do Imóvel
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="bairro" className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-accent" />
                Bairro *
              </Label>
              <Popover open={bairroPopoverOpen} onOpenChange={setBairroPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={bairroPopoverOpen}
                    className="w-full justify-between border-primary/20 focus:ring-accent/30 bg-background"
                    disabled={bairrosLoading}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">
                        {bairrosLoading ? "Carregando..." : bairro || "Selecione o bairro"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <div className="p-2 border-b bg-background">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar bairro..."
                        value={bairroSearchFilter}
                        onChange={(e) => setBairroSearchFilter(e.target.value)}
                        className="pl-8 h-9"
                        autoFocus
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[250px]">
                    {bairrosError ? (
                      <div className="p-4 text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 text-destructive">
                          <AlertCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">Erro ao carregar bairros</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Não foi possível carregar a lista de bairros. Verifique sua conexão.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetchBairros()}
                          className="gap-2"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Tentar novamente
                        </Button>
                      </div>
                    ) : bairrosLoading || !bairros || bairros.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                        Carregando bairros...
                      </div>
                    ) : (() => {
                      const filteredBairros = bairros
                        .filter((b) => b.bairro.toLowerCase().includes(bairroSearchFilter.toLowerCase()))
                        .sort((a, b) => a.bairro.localeCompare(b.bairro, 'pt-BR'))
                        .slice(0, 50);
                      
                      if (filteredBairros.length === 0) {
                        return (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Nenhum bairro encontrado para "{bairroSearchFilter}"
                          </div>
                        );
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
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                                bairro === b
                                  ? "bg-accent/10 text-foreground font-medium"
                                  : "hover:bg-muted"
                              }`}
                            >
                              <span className="truncate">{b}</span>
                              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                ({total_transacoes.toLocaleString("pt-BR")})
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    {bairros && bairros.filter((b) => 
                      b.bairro.toLowerCase().includes(bairroSearchFilter.toLowerCase())
                    ).length > 50 && (
                      <div className="py-2 px-2 text-xs text-muted-foreground text-center border-t">
                        Digite para filtrar mais bairros...
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 relative">
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
                  onChange={(e) => {
                    setLogradouro(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="border-primary/20 focus-visible:ring-accent/30 pr-10"
                  autoComplete="off"
                />
                {suggestionsLoading && logradouro.length >= 2 && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!suggestionsLoading && logradouro.length >= 2 && (
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Skeleton Loading State */}
              {showSuggestions && logradouro.length >= 2 && suggestionsLoading && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-fade-in"
                >
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

              {/* Results */}
              {showSuggestions && suggestions && suggestions.length > 0 && logradouro.length >= 2 && !suggestionsLoading && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto animate-fade-in"
                >
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
                              <p className="font-medium text-sm truncate text-foreground">
                                {suggestion.nome_condominio}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {suggestion.logradouro}
                              </p>
                            </>
                          ) : (
                            <p className="font-medium text-sm truncate text-foreground">
                              {suggestion.logradouro}
                            </p>
                          )}
                          {suggestion.microbairro && (
                            <p className="text-xs text-accent mt-0.5">
                              {suggestion.microbairro}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="shrink-0 text-xs bg-primary/10 text-primary"
                        >
                          {suggestion.total_transacoes} trans.
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {showSuggestions && logradouro.length >= 2 && suggestions?.length === 0 && !suggestionsLoading && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl p-4 text-center animate-fade-in">
                  <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum resultado encontrado para "<span className="font-medium">{logradouro}</span>"
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Tente outro termo ou digite apenas o nome da rua
                  </p>
                </div>
              )}
            </div>

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
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area" className="flex items-center gap-2 text-sm font-medium">
                  <Maximize2 className="h-4 w-4 text-accent" />
                  Área (m²) *
                </Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="Ex: 120"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  min="20"
                  max="2000"
                  className="border-primary/20 focus-visible:ring-accent/30"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Características (opcional)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="quartos" className="flex items-center gap-1.5 text-xs">
                    <BedDouble className="h-3.5 w-3.5 text-accent" />
                    Quartos
                  </Label>
                  <Input
                    id="quartos"
                    type="number"
                    placeholder="0"
                    value={quartos}
                    onChange={(e) => setQuartos(e.target.value)}
                    min="0"
                    max="10"
                    className="border-primary/20 focus-visible:ring-accent/30 h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="banheiros" className="flex items-center gap-1.5 text-xs">
                    <Bath className="h-3.5 w-3.5 text-accent" />
                    Banheiros
                  </Label>
                  <Input
                    id="banheiros"
                    type="number"
                    placeholder="0"
                    value={banheiros}
                    onChange={(e) => setBanheiros(e.target.value)}
                    min="0"
                    max="10"
                    className="border-primary/20 focus-visible:ring-accent/30 h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="suites" className="flex items-center gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    Suítes
                  </Label>
                  <Input
                    id="suites"
                    type="number"
                    placeholder="0"
                    value={suites}
                    onChange={(e) => setSuites(e.target.value)}
                    min="0"
                    max="10"
                    className="border-primary/20 focus-visible:ring-accent/30 h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vagas" className="flex items-center gap-1.5 text-xs">
                    <Car className="h-3.5 w-3.5 text-accent" />
                    Vagas
                  </Label>
                  <Input
                    id="vagas"
                    type="number"
                    placeholder="0"
                    value={vagas}
                    onChange={(e) => setVagas(e.target.value)}
                    min="0"
                    max="10"
                    className="border-primary/20 focus-visible:ring-accent/30 h-9"
                  />
                </div>
              </div>
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

          {error && (
            <p className="text-sm text-destructive text-center bg-destructive/10 py-2 rounded-lg">{error}</p>
          )}

          <Button 
            type="submit" 
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg" 
            size="lg" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Ver Análise Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center pt-2">
            ⚡ Resultado instantâneo baseado em transações oficiais registradas.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
