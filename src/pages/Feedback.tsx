import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { MessageSquareHeart, Star, Send, ArrowLeft, CheckCircle } from "lucide-react";
import godoyLogo from "@/assets/godoy-logo-pdf.png";
import { Footer } from "@/components/Footer";

const tiposFeedback = [
  { value: "sugestao", label: "💡 Sugestão" },
  { value: "bug", label: "🐛 Bug/Problema" },
  { value: "elogio", label: "👏 Elogio" },
  { value: "critica", label: "📝 Crítica construtiva" },
  { value: "outro", label: "📌 Outro" },
];

const Feedback = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tipoFeedback, setTipoFeedback] = useState("sugestao");
  const [avaliacao, setAvaliacao] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mensagem.trim().length < 10) {
      toast({
        title: "Mensagem muito curta",
        description: "Por favor, escreva pelo menos 10 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("feedbacks").insert({
        nome: nome.trim() || null,
        email: email.trim() || null,
        tipo_feedback: tipoFeedback,
        avaliacao: avaliacao || null,
        mensagem: mensagem.trim(),
        pagina_origem: window.location.pathname,
      });

      if (error) throw error;

      // Send email notification (fire and forget)
      supabase.functions.invoke("notify-feedback", {
        body: {
          nome: nome.trim() || null,
          email: email.trim() || null,
          tipo_feedback: tipoFeedback,
          avaliacao: avaliacao || null,
          mensagem: mensagem.trim(),
        },
      }).catch(console.error);

      setIsSubmitted(true);
      toast({
        title: "Feedback enviado!",
        description: "Muito obrigado pela sua contribuição.",
      });
    } catch (error: any) {
      console.error("Erro ao enviar feedback:", error);
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
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Obrigado!</h1>
            <p className="text-muted-foreground text-lg">
              Seu feedback foi recebido com sucesso. Sua opinião é muito importante para continuarmos melhorando nossa plataforma.
            </p>
            <Button asChild size="lg">
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

      <main className="flex-1 py-12 px-4">
        <div className="container max-w-2xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <MessageSquareHeart className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Sua opinião é importante!
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Ajude-nos a melhorar. Compartilhe sua experiência, sugestões ou reporte problemas.
            </p>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm">
            {/* Nome e Email */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome (opcional)</Label>
                <Input
                  id="nome"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Para receber resposta</p>
              </div>
            </div>

            {/* Tipo de Feedback */}
            <div className="space-y-2">
              <Label>Tipo de feedback</Label>
              <Select value={tipoFeedback} onValueChange={setTipoFeedback}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposFeedback.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Avaliação por Estrelas */}
            <div className="space-y-2">
              <Label>Como avalia sua experiência?</Label>
              <div className="flex gap-1">
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
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoveredStar || avaliacao)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {avaliacao > 0 && (
                <p className="text-sm text-muted-foreground">
                  {avaliacao === 1 && "Muito ruim"}
                  {avaliacao === 2 && "Ruim"}
                  {avaliacao === 3 && "Regular"}
                  {avaliacao === 4 && "Bom"}
                  {avaliacao === 5 && "Excelente!"}
                </p>
              )}
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="mensagem">
                Sua mensagem <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="mensagem"
                placeholder="Conte-nos sua experiência, sugestões ou problemas encontrados..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={5}
                maxLength={2000}
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {mensagem.length}/2000 caracteres (mínimo 10)
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting || mensagem.trim().length < 10}
            >
              {isSubmitting ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Feedback
                </>
              )}
            </Button>
          </form>

          {/* Back Link */}
          <div className="text-center">
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao início
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feedback;
