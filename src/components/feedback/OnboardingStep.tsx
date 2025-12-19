import { Button } from "@/components/ui/button";
import { Share2, Home, TrendingUp, ClipboardCheck, ArrowRight, Copy, Check, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStepProps {
  onStart: () => void;
}

export const OnboardingStep = ({ onStart }: OnboardingStepProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;
  
  const shareText = `🏠 Oi tudo bem?\n\nEstou testando para um amigo uma plataforma que pode melhorar muito a forma como avaliamos imóveis no Rio de Janeiro e por isso lembrei de você. Sua opinião como potencial comprador ou vendedor é muito importante!\n\n👉 Teste aqui: ${shareUrl}\n\nLeva só 3 minutos!`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Teste de Avaliação Imobiliária - Godoy Prime Realty",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error - fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({
        title: "Mensagem copiada!",
        description: "Cole no WhatsApp, email ou rede social de sua preferência.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="container max-w-2xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <ClipboardCheck className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Você foi convidado para um teste especial!
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Estamos criando uma ferramenta inovadora de avaliação imobiliária e sua opinião é fundamental.
        </p>
      </div>


      {/* Context Card */}
      <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm space-y-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Home className="w-5 h-5 text-primary" />
          Antes de começar, imagine-se assim:
        </h2>
        
        <div className="space-y-4 text-muted-foreground">
          <p className="text-base leading-relaxed">
            <strong className="text-foreground">Você é um potencial cliente</strong> que está pensando em 
            comprar ou vender um imóvel em qualquer bairro do Rio de Janeiro — seja na Barra da Tijuca, 
            Leblon, Ipanema, Copacabana, Tijuca, Botafogo, ou qualquer outro.
          </p>
          
          <div className="bg-muted/50 p-4 rounded-xl space-y-3">
            <p className="font-medium text-foreground text-sm">Ao testar a ferramenta, pergunte-se:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Se eu estivesse vendendo meu imóvel, essa avaliação me ajudaria a definir o preço?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Se eu estivesse comprando, confiaria nessa análise para negociar?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>As informações são claras e fáceis de entender?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Eu indicaria essa ferramenta para um amigo?</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm space-y-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Como funciona o teste
        </h2>
        
        <div className="grid gap-4">
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">1</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Acesse a ferramenta</p>
              <p className="text-sm text-muted-foreground">
                Na página inicial, faça uma avaliação simulada de um imóvel (pode ser o seu ou inventado)
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">2</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Explore as funcionalidades</p>
              <p className="text-sm text-muted-foreground">
                Navegue pela plataforma, veja os resultados, gráficos e informações disponíveis
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-sm">3</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Responda a pesquisa</p>
              <p className="text-sm text-muted-foreground">
                Volte aqui e compartilhe sua opinião honesta (leva apenas 3 minutos)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 md:p-8 rounded-2xl border border-primary/20 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          Conhece alguém que pode ajudar?
        </h3>
        <p className="text-sm text-muted-foreground">
          Quanto mais pessoas testarem, melhor será a ferramenta! Compartilhe com amigos, familiares ou 
          colegas que possam ter interesse em imóveis no Rio.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar mensagem
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-4">
        <Button 
          onClick={onStart} 
          size="lg" 
          className="w-full py-6 text-lg"
        >
          Começar Pesquisa
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ⏱️ Leva apenas 3 minutos para completar
        </p>
      </div>
    </div>
  );
};
