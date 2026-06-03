import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Phone, User } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

interface Props {
  prefilledEmail?: string;
  prefilledName?: string;
  googleVerified: boolean;
  isSubmitting: boolean;
  onSubmit: (data: { email: string; nome: string; telefone: string; googleVerified: boolean }) => void;
  onBeforeGoogleRedirect: () => void;
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const validPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.length >= 10 && d.length <= 11;
};

export function GoogleEmailCapture({
  prefilledEmail = "",
  prefilledName = "",
  googleVerified,
  isSubmitting,
  onSubmit,
  onBeforeGoogleRedirect,
}: Props) {
  const [email, setEmail] = useState(prefilledEmail);
  const [nome, setNome] = useState(prefilledName);
  const [telefone, setTelefone] = useState("");
  const [showManual, setShowManual] = useState(googleVerified || !!prefilledEmail);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setError("");
    setOauthLoading(true);
    try {
      onBeforeGoogleRedirect();
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/avaliacao-direta?from=google`,
      });
      if (result.error) {
        toast.error("Não foi possível continuar com o Google. Use seu e-mail.");
        setShowManual(true);
      }
    } catch {
      toast.error("Erro ao conectar com o Google. Use seu e-mail.");
      setShowManual(true);
    } finally {
      setOauthLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validEmail(email)) return setError("E-mail inválido");
    if (nome.trim().length < 3) return setError("Informe seu nome completo");
    if (!validPhone(telefone)) return setError("WhatsApp inválido (10 ou 11 dígitos)");
    onSubmit({
      email: email.trim().toLowerCase(),
      nome: nome.trim(),
      telefone: telefone.replace(/\D/g, ""),
      googleVerified,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!showManual && (
        <>
          <Button
            type="button"
            onClick={handleGoogle}
            disabled={oauthLoading}
            className="w-full h-12 bg-white hover:bg-gray-50 text-[#0C2340] border border-[#0C2340]/20 font-medium"
          >
            {oauthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar com Google
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="w-full text-center text-sm text-[#0C2340]/60 hover:text-[#0C2340] underline-offset-4 hover:underline"
          >
            ou usar outro e-mail
          </button>
        </>
      )}

      {showManual && (
        <div className="space-y-3 animate-in fade-in duration-[250ms]">
          <div>
            <Label htmlFor="cap-email" className="text-xs text-[#0C2340]/70">
              E-mail {googleVerified && <span className="text-[#C9A84C]">✓ verificado pelo Google</span>}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C2340]/40" />
              <Input
                id="cap-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={googleVerified}
                placeholder="seu@email.com"
                className="pl-9 h-12"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cap-nome" className="text-xs text-[#0C2340]/70">
              Nome completo
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C2340]/40" />
              <Input
                id="cap-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como podemos te chamar?"
                className="pl-9 h-12"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cap-tel" className="text-xs text-[#0C2340]/70">
              WhatsApp (obrigatório)
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C2340]/40" />
              <Input
                id="cap-tel"
                type="tel"
                inputMode="numeric"
                value={telefone}
                onChange={(e) => setTelefone(formatPhone(e.target.value))}
                placeholder="(21) 99999-9999"
                className="pl-9 h-12"
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-[#0C2340] font-semibold"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Quero o laudo completo do especialista"
            )}
          </Button>
        </div>
      )}
    </form>
  );
}