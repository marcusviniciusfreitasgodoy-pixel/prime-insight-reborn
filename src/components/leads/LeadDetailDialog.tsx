import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail, Phone, MapPin, Home, DollarSign, Calendar, BedDouble, Car,
  CheckCircle, Clock, User, Target, Zap, MessageSquare, FileText,
  Bath, Star,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  bairro_interesse: string | null;
  area_interesse: number | null;
  valor_interesse: number | null;
  quartos: number | null;
  banheiros: number | null;
  suites: number | null;
  vagas: number | null;
  interesse: string | null;
  origem: string | null;
  convertido: boolean | null;
  created_at: string;
  evaluation_count: number | null;
  objetivo: string | null;
  urgencia: string | null;
  preferencia_contato: string | null;
  aceita_marketing: boolean | null;
  diferenciais_imovel: string | null;
  endereco_imovel_analise: string | null;
  valor_pedido_vendedor: number | null;
  notas: string | null;
  followup_sent_at: string | null;
  parecer_solicitado: boolean | null;
  parecer_solicitado_at: string | null;
  updated_at: string;
}

interface LeadDetailDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatCurrency = (value: number | null) => {
  if (!value) return null;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
};

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
};

const formatDate = (date: string | null) => {
  if (!date) return null;
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const DetailRow = ({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: React.ReactNode; href?: string }) => {
  if (value === null || value === undefined || value === "") return null;
  const content = (
    <div className="flex items-start gap-3 py-1.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
  if (href) return <a href={href} className="block hover:bg-muted/50 rounded-md px-1 -mx-1 transition-colors">{content}</a>;
  return content;
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{children}</h3>
);

export function LeadDetailDialog({ lead, open, onOpenChange }: LeadDetailDialogProps) {
  if (!lead) return null;

  const urgenciaColors: Record<string, string> = {
    imediata: "bg-red-500/10 text-red-600",
    curto_prazo: "bg-orange-500/10 text-orange-600",
    medio_prazo: "bg-yellow-500/10 text-yellow-600",
    longo_prazo: "bg-green-500/10 text-green-600",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            {lead.nome}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge
              variant={lead.interesse === "compra" ? "default" : "secondary"}
              className={lead.interesse === "compra" ? "bg-accent text-accent-foreground" : "bg-green-500/10 text-green-600"}
            >
              {lead.interesse === "compra" ? "Compra" : lead.interesse === "venda" ? "Venda" : lead.interesse || "-"}
            </Badge>
            <Badge variant={lead.convertido ? "default" : "outline"} className={lead.convertido ? "bg-green-600" : ""}>
              {lead.convertido ? "Convertido" : "Pendente"}
            </Badge>
            {lead.origem && (
              <Badge variant="outline" className="text-xs">{lead.origem}</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Seção Contato */}
          <div>
            <SectionTitle>Contato</SectionTitle>
            <DetailRow icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} />
            <DetailRow icon={Phone} label="Telefone" value={formatPhone(lead.telefone)} href={`tel:${lead.telefone}`} />
            {lead.preferencia_contato && (
              <DetailRow icon={MessageSquare} label="Preferência de contato" value={lead.preferencia_contato} />
            )}
            {lead.aceita_marketing !== null && (
              <DetailRow icon={Mail} label="Aceita marketing" value={lead.aceita_marketing ? "Sim" : "Não"} />
            )}
          </div>

          <Separator />

          {/* Seção Interesse e Imóvel */}
          <div>
            <SectionTitle>Interesse e Imóvel</SectionTitle>
            {lead.objetivo && <DetailRow icon={Target} label="Objetivo" value={lead.objetivo} />}
            {lead.urgencia && (
              <div className="flex items-start gap-3 py-1.5">
                <Zap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Urgência</p>
                  <Badge variant="outline" className={urgenciaColors[lead.urgencia] || ""}>
                    {lead.urgencia.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            )}
            {lead.bairro_interesse && <DetailRow icon={MapPin} label="Bairro" value={lead.bairro_interesse} />}
            {lead.area_interesse && <DetailRow icon={Home} label="Área" value={`${lead.area_interesse} m²`} />}

            {(lead.quartos || lead.suites || lead.banheiros || lead.vagas) && (
              <div className="flex items-start gap-3 py-1.5">
                <BedDouble className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Características</p>
                  <div className="flex flex-wrap gap-3 text-sm font-medium mt-0.5">
                    {lead.quartos && <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-muted-foreground" />{lead.quartos} quartos</span>}
                    {lead.suites && <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-muted-foreground" />{lead.suites} suítes</span>}
                    {lead.banheiros && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-muted-foreground" />{lead.banheiros} ban.</span>}
                    {lead.vagas && <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5 text-muted-foreground" />{lead.vagas} vagas</span>}
                  </div>
                </div>
              </div>
            )}

            {lead.diferenciais_imovel && <DetailRow icon={Star} label="Diferenciais desejados" value={lead.diferenciais_imovel} />}
          </div>

          <Separator />

          {/* Seção Avaliação */}
          <div>
            <SectionTitle>Avaliação</SectionTitle>
            {lead.endereco_imovel_analise && <DetailRow icon={MapPin} label="Endereço analisado" value={lead.endereco_imovel_analise} />}
            {lead.valor_interesse && <DetailRow icon={DollarSign} label="Valor estimado" value={formatCurrency(lead.valor_interesse)} />}
            {lead.valor_pedido_vendedor && <DetailRow icon={DollarSign} label="Valor pedido pelo vendedor" value={formatCurrency(lead.valor_pedido_vendedor)} />}
            {lead.evaluation_count && lead.evaluation_count > 0 && (
              <DetailRow icon={FileText} label="Avaliações realizadas" value={lead.evaluation_count} />
            )}
            {!lead.endereco_imovel_analise && !lead.valor_interesse && !lead.valor_pedido_vendedor && !lead.evaluation_count && (
              <p className="text-sm text-muted-foreground italic">Nenhum dado de avaliação disponível</p>
            )}
          </div>

          <Separator />

          {/* Seção Status e Histórico */}
          <div>
            <SectionTitle>Status e Histórico</SectionTitle>
            <DetailRow icon={Calendar} label="Cadastrado em" value={formatDate(lead.created_at)} />
            {lead.updated_at && lead.updated_at !== lead.created_at && (
              <DetailRow icon={Calendar} label="Última atualização" value={formatDate(lead.updated_at)} />
            )}
            {lead.followup_sent_at && (
              <DetailRow icon={Mail} label="Follow-up enviado em" value={formatDate(lead.followup_sent_at)} />
            )}
            {lead.parecer_solicitado && (
              <DetailRow
                icon={FileText}
                label="Parecer solicitado"
                value={lead.parecer_solicitado_at ? formatDate(lead.parecer_solicitado_at) : "Sim"}
              />
            )}
            {lead.notas && (
              <DetailRow icon={MessageSquare} label="Notas internas" value={lead.notas} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
