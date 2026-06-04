import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendLeadToCrm } from "@/lib/crmWebhook";
import {
  trackLead,
  trackEvent,
  trackWizardStep,
  trackWizardEstimateShown,
  trackWizardLeadCaptured,
} from "@/lib/metaPixel";
import { StepAddress } from "./StepAddress";
import { StepProperty } from "./StepProperty";
import { StepDetails, DetailsState } from "./StepDetails";
import { StepResultCapture, EstimativaState } from "./StepResultCapture";
import { AnalyzingLoader } from "./AnalyzingLoader";
import { LimitExceededScreen } from "../LimitExceededScreen";
import type { QuickValuationData } from "../QuickValuationForm";

const QuickValuationResult = lazy(() =>
  import("../QuickValuationResult").then((m) => ({ default: m.QuickValuationResult })),
);

const MAX_FREE_EVALUATIONS = 2;
const STORAGE_KEY = "wizard_state_v1";
const BAIRRO = "BARRA DA TIJUCA";

type WizardStep = "address" | "property" | "details" | "analyzing" | "result" | "thanks";

interface FormData {
  tipologia: string;
  logradouro: string;
  numero: string;
  area: string;
  quartos: number;
  details: DetailsState;
}

const initialForm: FormData = {
  tipologia: "Apartamento",
  logradouro: "",
  numero: "",
  area: "",
  quartos: 2,
  details: {
    banheiros: 1,
    suites: 0,
    vagas: 1,
    andar: 0,
    vistaMar: false,
    reformado: false,
    varandaGourmet: false,
  },
};

interface Props {
  origem?: string;
}

export function ValuationWizard({ origem = "avaliacao_direta" }: Props) {
  const [step, setStep] = useState<WizardStep>("address");
  const [form, setForm] = useState<FormData>(initialForm);
  const [estimativa, setEstimativa] = useState<EstimativaState | null>(null);
  const [googleData, setGoogleData] = useState<{ email: string; nome: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [evaluationCount, setEvaluationCount] = useState(0);
  const [finalData, setFinalData] = useState<QuickValuationData | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Restore from Google OAuth redirect
  useEffect(() => {
    const url = new URL(window.location.href);
    const fromGoogle = url.searchParams.get("from") === "google";
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (fromGoogle && stored) {
      try {
        const saved = JSON.parse(stored);
        setForm(saved.form);
        setEstimativa(saved.estimativa);
        setStep("result");
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            setGoogleData({
              email: data.user.email || "",
              nome: (data.user.user_metadata?.full_name as string) || "",
            });
          }
        });
        url.searchParams.delete("from");
        window.history.replaceState({}, "", url.toString());
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Tracking per step
  useEffect(() => {
    const map: Record<WizardStep, 1 | 2 | 3 | 4 | null> = {
      address: 1,
      property: 2,
      details: 3,
      analyzing: null,
      result: 4,
      thanks: null,
    };
    const n = map[step];
    if (n) trackWizardStep(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step]);

  const stepIndex: Record<WizardStep, number> = {
    address: 1,
    property: 2,
    details: 3,
    analyzing: 3,
    result: 4,
    thanks: 4,
  };
  const progress = (stepIndex[step] / 4) * 100;

  const runAnalysis = async () => {
    setStep("analyzing");
    const start = Date.now();
    const areaNum = parseFloat(form.area);
    try {
      const { data: statsData, error } = await supabase.rpc("get_itbi_stats_filtered", {
        p_bairro: BAIRRO,
        p_logradouro: form.logradouro.trim() || null,
        p_uso: "Residencial",
      });
      if (error) throw error;

      const elapsed = Date.now() - start;
      await new Promise((r) => setTimeout(r, Math.max(0, 1500 - elapsed)));

      if (statsData && statsData.length > 0 && statsData[0].med_m2 > 0) {
        const row = statsData[0];
        const itbiData = {
          min_m2: Math.round(Number(row.min_m2)),
          med_m2: Math.round(Number(row.med_m2)),
          max_m2: Math.round(Number(row.max_m2)),
          transaction_count: Number(row.transaction_count),
        };
        const est = {
          min: Math.round(itbiData.min_m2 * areaNum),
          med: Math.round(itbiData.med_m2 * areaNum),
          max: Math.round(itbiData.max_m2 * areaNum),
        };
        setEstimativa({ itbiData, estimativa: est });
        trackWizardEstimateShown(est.med);
        setStep("result");
      } else {
        toast.error("Sem dados suficientes para esta rua. Tente um endereço próximo.");
        setStep("details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao consultar dados. Tente novamente.");
      setStep("details");
    }
  };

  const persistForGoogle = () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ form, estimativa }),
    );
  };

  const handleCaptureSubmit = async (data: {
    email: string;
    nome: string;
    telefone: string;
    googleVerified: boolean;
  }) => {
    console.log("[WIZARD] handleCaptureSubmit start", { email: data.email, nome: data.nome, googleVerified: data.googleVerified });
    if (!estimativa) return;
    setIsSubmitting(true);
    const areaNum = parseFloat(form.area);
    const { itbiData, estimativa: est } = estimativa;
    const finalOrigem = data.googleVerified ? `${origem}_google` : origem;

    const diferenciais = [
      form.details.vistaMar && "Vista mar",
      form.details.reformado && "Reformado",
      form.details.varandaGourmet && "Varanda gourmet",
      form.details.andar > 0 && `Andar ${form.details.andar}`,
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      // Check limit
      const { data: leadCheck } = await supabase.rpc("check_lead_exists", {
        lead_email: data.email,
      });
      const existing = leadCheck && leadCheck.length > 0 && leadCheck[0].exists_flag;
      const count = existing ? leadCheck[0].current_count : 0;
      if (count >= MAX_FREE_EVALUATIONS) {
        console.warn("[WIZARD] limit exceeded", { count });
        setEvaluationCount(count);
        setLimitExceeded(true);
        setIsSubmitting(false);
        return;
      }

      const enderecoCompleto = [form.logradouro.trim(), form.numero.trim()]
        .filter(Boolean)
        .join(", ");

      if (existing) {
        console.log("[WIZARD] updating existing lead");
        await supabase.rpc("update_lead_by_email", {
          p_email: data.email,
          p_nome: data.nome,
          p_telefone: data.telefone,
          p_bairro_interesse: BAIRRO,
          p_area_interesse: areaNum,
          p_quartos: form.quartos || null,
          p_banheiros: form.details.banheiros || null,
          p_suites: form.details.suites || null,
          p_vagas: form.details.vagas || null,
          p_diferenciais_imovel: diferenciais || null,
          p_endereco_imovel_analise: enderecoCompleto || null,
        });
        await supabase.rpc("increment_lead_evaluation", { lead_email: data.email });
      } else {
        console.log("[WIZARD] inserting new lead");
        const { error: insErr } = await supabase.from("leads").insert({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          bairro_interesse: BAIRRO,
          area_interesse: areaNum,
          quartos: form.quartos || null,
          banheiros: form.details.banheiros || null,
          suites: form.details.suites || null,
          vagas: form.details.vagas || null,
          diferenciais_imovel: diferenciais || null,
          endereco_imovel_analise: enderecoCompleto || null,
          interesse: "compra",
          origem: finalOrigem,
          evaluation_count: 1,
        });
        if (insErr) {
          console.error("[WIZARD] insert lead error:", insErr);
          throw insErr;
        }
      }

      // Save public valuation
      try {
        const spreadPct =
          itbiData.med_m2 > 0
            ? ((itbiData.max_m2 - itbiData.min_m2) / itbiData.med_m2) * 100
            : 0;
        await supabase.from("valuations").insert({
          user_id: null,
          origin: "public",
          logradouro: form.logradouro.trim() || BAIRRO,
          bairro: BAIRRO,
          property_area_m2: areaNum,
          property_type: form.tipologia.toLowerCase(),
          itbi_min_m2: itbiData.min_m2,
          itbi_med_m2: itbiData.med_m2,
          itbi_max_m2: itbiData.max_m2,
          itbi_transaction_count: itbiData.transaction_count,
          combined_min_m2: itbiData.min_m2,
          combined_med_m2: itbiData.med_m2,
          combined_max_m2: itbiData.max_m2,
          final_value_min: est.min,
          final_value_med: est.med,
          final_value_max: est.max,
          confidence_level:
            itbiData.transaction_count >= 10
              ? "green"
              : itbiData.transaction_count >= 5
              ? "yellow_high"
              : "yellow",
          confidence_score: Math.min(100, itbiData.transaction_count * 5),
          documentation_status: "ok",
          documentation_factor: 1.0,
          total_adjustment: 0,
          spread_percentage: spreadPct,
        });
      } catch (e) {
        console.error("valuations insert:", e);
      }

      // Notification (fire-and-forget)
      console.log("[WIZARD] invoking send-lead-notification");
      supabase.functions
        .invoke("send-lead-notification", {
          body: {
            type: existing ? "returning" : "initial",
            leadId: "",
            leadName: data.nome,
            leadEmail: data.email,
            leadPhone: data.telefone,
            interesse: "compra",
            bairro: BAIRRO,
            area: areaNum,
            tipologia: form.tipologia,
            quartos: form.quartos,
            banheiros: form.details.banheiros,
            suites: form.details.suites,
            vagas: form.details.vagas,
            diferenciais: diferenciais || undefined,
            evaluationNumber: existing ? count + 1 : 1,
            estimativaMin: est.min,
            estimativaMed: est.med,
            estimativaMax: est.max,
            enderecoImovelAnalise: enderecoCompleto || undefined,
            itbiMinM2: itbiData.min_m2,
            itbiMedM2: itbiData.med_m2,
            itbiMaxM2: itbiData.max_m2,
            itbiTransactionCount: itbiData.transaction_count,
          },
        })
        .then((res) => {
          if (res?.error) {
            console.error("notification error:", res.error);
            toast.error("Cadastro feito, mas houve falha ao disparar e-mail/WhatsApp. Já avisamos a equipe.");
          } else {
            console.log("[WIZARD] notification ok:", res?.data);
          }
        })
        .catch((e) => {
          console.error("notification exception:", e);
          toast.error("Cadastro feito, mas falhou o disparo do laudo automático.");
        });

      sendLeadToCrm("avaliacao_direta_wizard", {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        bairro: BAIRRO,
        logradouro: form.logradouro.trim() || null,
        numero: form.numero || null,
        area_m2: areaNum,
        tipologia: form.tipologia,
        quartos: form.quartos,
        banheiros: form.details.banheiros,
        suites: form.details.suites,
        vagas: form.details.vagas,
        andar: form.details.andar,
        vista_mar: form.details.vistaMar,
        reformado: form.details.reformado,
        varanda_gourmet: form.details.varandaGourmet,
        google_verified: data.googleVerified,
        interesse: "compra",
        origem: finalOrigem,
        is_returning_lead: !!existing,
        evaluation_number: existing ? count + 1 : 1,
        estimativa_min: est.min,
        estimativa_med: est.med,
        estimativa_max: est.max,
      });

      // Meta Pixel
      trackWizardLeadCaptured(est.med, data.googleVerified ? "google" : "manual");
      if (existing) {
        trackEvent("ReturningLeadEvaluation", {
          content_name: "avaliacao_direta_wizard",
          evaluation_number: count + 1,
          value: est.med,
          currency: "BRL",
        });
      } else {
        trackLead({
          content_name: "avaliacao_direta_wizard",
          content_category: "new_lead",
          value: est.med,
          currency: "BRL",
        });
      }

      sessionStorage.removeItem(STORAGE_KEY);

      setFinalData({
        bairro: BAIRRO,
        logradouro: form.logradouro.trim(),
        area_m2: areaNum,
        tipologia: form.tipologia,
        quartos: form.quartos,
        banheiros: form.details.banheiros,
        suites: form.details.suites,
        vagas: form.details.vagas,
        diferenciais: diferenciais || undefined,
        valorPedidoVendedor: undefined,
        itbiData,
        estimativa: est,
        leadName: data.nome,
        leadEmail: data.email,
        leadPhone: data.telefone,
      });
      setStep("thanks");
    } catch (e) {
      console.error("[WIZARD] handleCaptureSubmit error:", e);
      toast.error("Erro ao registrar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
      console.log("[WIZARD] handleCaptureSubmit end");
    }
  };

  if (limitExceeded) {
    return (
      <LimitExceededScreen
        evaluationCount={evaluationCount}
        email={googleData?.email || ""}
        onRetry={() => setLimitExceeded(false)}
      />
    );
  }

  if (step === "thanks" && finalData) {
    return (
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
          </div>
        }
      >
        <QuickValuationResult
          data={finalData}
          onNewValuation={() => {
            setFinalData(null);
            setEstimativa(null);
            setGoogleData(null);
            setForm(initialForm);
            setStep("address");
          }}
        />
      </Suspense>
    );
  }

  return (
    <Card className="border-[#0C2340]/10 shadow-xl bg-white" ref={topRef}>
      <CardContent className="p-5 sm:p-7 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#0C2340]/60">
            <span>
              Passo {stepIndex[step]} de 4
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5 [&>div]:bg-[#C9A84C]" />
        </div>

        {step === "address" && (
          <StepAddress
            tipologia={form.tipologia}
            logradouro={form.logradouro}
            numero={form.numero}
            onChange={(p) => setForm((f) => ({ ...f, ...p }))}
            onNext={() => setStep("property")}
          />
        )}

        {step === "property" && (
          <StepProperty
            area={form.area}
            quartos={form.quartos}
            onChange={(p) => setForm((f) => ({ ...f, ...p }))}
            onNext={() => setStep("details")}
            onBack={() => setStep("address")}
          />
        )}

        {step === "details" && (
          <StepDetails
            details={form.details}
            onChange={(p) => setForm((f) => ({ ...f, details: { ...f.details, ...p } }))}
            onNext={runAnalysis}
            onBack={() => setStep("property")}
          />
        )}

        {step === "analyzing" && <AnalyzingLoader />}

        {step === "result" && estimativa && (
          <StepResultCapture
            estimativa={estimativa}
            prefilledEmail={googleData?.email}
            prefilledName={googleData?.nome}
            googleVerified={!!googleData}
            isSubmitting={isSubmitting}
            onSubmit={handleCaptureSubmit}
            onBeforeGoogleRedirect={persistForGoogle}
            onBack={() => setStep("details")}
            bairro={BAIRRO}
            tipologia={form.tipologia}
            area={parseFloat(form.area) || undefined}
          />
        )}
      </CardContent>
    </Card>
  );
}