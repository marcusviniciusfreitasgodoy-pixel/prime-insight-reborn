import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { MessageSquareHeart, Star, Send, ArrowLeft, CheckCircle, Sparkles, Gift, Phone } from "lucide-react";
import godoyLogo from "@/assets/godoy-logo-pdf.png";
import { Footer } from "@/components/Footer";
import { QuestionCard } from "@/components/feedback/QuestionCard";
import { SurveyProgress } from "@/components/feedback/SurveyProgress";
import { surveyQuestions } from "@/components/feedback/surveyQuestions";
import { OnboardingStep } from "@/components/feedback/OnboardingStep";

const Feedback = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<"onboarding" | "survey">("onboarding");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [avaliacao, setAvaliacao] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});

  const handleSelectAnswer = (questionId: string, value: string) => {
    setRespostas((prev) => ({ ...prev, [questionId]: value }));
  };

  const answeredCount = Object.keys(respostas).length;
  const totalQuestions = surveyQuestions.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (answeredCount < 3) {
      toast({
        title: "Responda mais perguntas",
        description: "Por favor, responda pelo menos 3 perguntas da pesquisa.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("feedbacks").insert({
        nome: nome.trim() || null,
        email: email.trim() || null,
        tipo_feedback: "pesquisa_validacao",
        avaliacao: avaliacao || null,
        mensagem: mensagem.trim() || "Apenas respondeu o questionário",
        pagina_origem: window.location.pathname,
        respostas_questionario: respostas,
      });

      if (error) throw error;

      // Send email notification with survey responses
      supabase.functions.invoke("notify-feedback", {
        body: {
          nome: nome.trim() || null,
          email: email.trim() || null,
          tipo_feedback: "pesquisa_validacao",
          avaliacao: avaliacao || null,
          mensagem: mensagem.trim() || "Apenas respondeu o questionário",
          respostas_questionario: respostas,
        },
      }).catch(console.error);

      setIsSubmitted(true);
      toast({
        title: "Pesquisa enviada!",
        description: "Muito obrigado pela sua contribuição.",
      });
    } catch (error: any) {
      console.error("Erro ao enviar pesquisa:", error);
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="container flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={godoyLogo} alt="Godoy Prime Realty" className="h-10" />
            </Link>
            <Button asChild variant="default" size="sm">
              <Link to="/">Avaliar Imóvel</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-lg">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Muito obrigado!</h1>
            <p className="text-muted-foreground text-lg">
              Sua opinião foi recebida com sucesso e é muito valiosa para nós.
            </p>

            {/* Reward Card */}
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 p-6 rounded-2xl border border-amber-500/30 text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Sua recompensa está garantida!</p>
                  <p className="text-sm text-muted-foreground">Consultoria gratuita com Marcus Godoy</p>
                </div>
              </div>
              
              <div className="bg-background/50 p-4 rounded-xl space-y-2">
                <p className="text-sm font-medium text-foreground">O que você ganha:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>15 minutos</strong> de consultoria personalizada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Análise do seu imóvel ou dúvidas sobre o mercado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Orientação profissional sem compromisso</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-3">
                  {email ? (
                    <>Entraremos em contato pelo email <strong className="text-foreground">{email}</strong> para agendar.</>
                  ) : (
                    <>Entre em contato pelo WhatsApp para agendar sua consultoria:</>
                  )}
                </p>
                <Button 
                  asChild 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <a 
                    href="https://wa.me/5521999880101?text=Olá! Completei a pesquisa de validação e gostaria de agendar minha consultoria gratuita de 15 minutos." 
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Agendar pelo WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            <Button asChild variant="outline" size="lg">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao início
              </Link>
            </Button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={godoyLogo} alt="Godoy Prime Realty" className="h-10" />
          </Link>
          <Button asChild variant="default" size="sm">
            <Link to="/">Avaliar Imóvel</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 py-8 md:py-12 px-4">
        {step === "onboarding" ? (
          <OnboardingStep onStart={() => setStep("survey")} />
        ) : (
        <div className="container max-w-2xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Pesquisa de Validação
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Sua opinião conta muito. Responda algumas perguntas rápidas para nos ajudar a melhorar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Progress Bar */}
            <div className="bg-card p-4 rounded-xl border border-border">
              <SurveyProgress answered={answeredCount} total={totalQuestions} />
            </div>

            {/* Survey Questions */}
            <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm space-y-8">
              <div className="flex items-center gap-2 text-primary">
                <MessageSquareHeart className="w-5 h-5" />
                <h2 className="font-semibold">Pesquisa Rápida</h2>
              </div>

              {surveyQuestions.map((q, index) => (
                <QuestionCard
                  key={q.id}
                  question={q.question}
                  options={q.options}
                  selectedValue={respostas[q.id] || null}
                  onSelect={(value) => handleSelectAnswer(q.id, value)}
                  questionNumber={index + 1}
                />
              ))}
            </div>

            {/* Star Rating */}
            <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm space-y-4">
              <Label className="text-lg font-medium">Avaliação geral da experiência</Label>
              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setAvaliacao(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hoveredStar || avaliacao)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {avaliacao > 0 && (
                <p className="text-center text-muted-foreground">
                  {avaliacao === 1 && "Muito ruim"}
                  {avaliacao === 2 && "Ruim"}
                  {avaliacao === 3 && "Regular"}
                  {avaliacao === 4 && "Bom"}
                  {avaliacao === 5 && "Excelente!"}
                </p>
              )}
            </div>

            {/* Additional Comments */}
            <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm space-y-4">
              <Label htmlFor="mensagem" className="text-lg font-medium">
                Comentários adicionais (opcional)
              </Label>
              <Textarea
                id="mensagem"
                placeholder="Quer compartilhar algo mais? Sugestões, críticas, ideias..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={4}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {mensagem.length}/2000 caracteres
              </p>
            </div>

            {/* Contact Info */}
            <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm space-y-4">
              <Label className="text-lg font-medium">Identificação (opcional)</Label>
              <p className="text-sm text-muted-foreground">
                Se quiser receber novidades ou conversar sobre suas ideias, deixe seu contato.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full py-6 text-lg"
              disabled={isSubmitting || answeredCount < 3}
            >
              {isSubmitting ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Enviar Pesquisa
                </>
              )}
            </Button>
            {answeredCount < 3 && (
              <p className="text-center text-sm text-muted-foreground">
                Responda pelo menos 3 perguntas para enviar
              </p>
            )}
          </form>

          {/* Back Link */}
          <div className="text-center flex gap-4 justify-center">
            <Button variant="ghost" onClick={() => setStep("onboarding")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar às instruções
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao início
              </Link>
            </Button>
          </div>
        </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Feedback;
