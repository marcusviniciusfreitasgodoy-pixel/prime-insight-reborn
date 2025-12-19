import { Button } from "@/components/ui/button";
import { Share2, Home, TrendingUp, ClipboardCheck, ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStepProps {
  onStart: () => void;
}

export const OnboardingStep = ({ onStart }: OnboardingStepProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;
  
  const shareText = `🏠 Quer ajudar a criar uma ferramenta incrível para o mercado imobiliário do Rio?\n\nEstou testando uma plataforma que pode revolucionar como avaliamos imóveis. Sua opinião como potencial comprador ou vendedor é muito importante!\n\n👉 Teste aqui: ${shareUrl}\n\nLeva só 3 minutos!`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Teste de Avaliação Imobiliária - Godoy Prime Realty",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
        console.log("Share cancelled");
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

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank");
  };

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
            variant="outline" 
            onClick={handleWhatsAppShare}
            className="bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-700 dark:text-green-400"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp
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
