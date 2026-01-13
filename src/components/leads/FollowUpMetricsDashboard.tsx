import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { useFollowUpMetrics } from "@/hooks/useFollowUpMetrics";
import {
  Mail,
  MailCheck,
  Clock,
  UserCheck,
  TrendingUp,
  Target,
  Send,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--primary))",
];

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, badge, badgeVariant = "secondary" }: MetricCardProps) {
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground";
  
  return (
    <Card className="hover:shadow-lg transition-shadow border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {title}
              </p>
              {badge && (
                <Badge variant={badgeVariant} className="text-[10px] px-1.5 py-0">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className={`text-xs mt-1 ${trendColor}`}>
                {trend === "up" && "↑ "}{trend === "down" && "↓ "}{subtitle}
              </p>
            )}
          </div>
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FollowUpMetricsDashboard() {
  const [periodo, setPeriodo] = useState<string>("30");
  const { data: metrics, isLoading } = useFollowUpMetrics(parseInt(periodo));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const funnelData = [
    { name: "Leads Elegíveis", value: metrics.leadsElegiveis, fill: "hsl(var(--muted-foreground))" },
    { name: "Follow-ups Enviados", value: metrics.followupEnviados, fill: "hsl(var(--accent))" },
    { name: "Parecer Solicitado", value: metrics.parecerSolicitado, fill: "hsl(var(--success))" },
  ];

  const statusData = [
    { name: "Pendentes", value: metrics.leadsPendentes, fill: "hsl(var(--warning))" },
    { name: "Follow-up Enviado", value: metrics.followupEnviados, fill: "hsl(var(--accent))" },
    { name: "Parecer Solicitado", value: metrics.parecerSolicitado, fill: "hsl(var(--success))" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-5 w-5 text-accent" />
            Métricas de Follow-up
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhe os e-mails automáticos e conversões
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={periodo}
          onValueChange={(v) => v && setPeriodo(v)}
          className="bg-muted rounded-lg p-1"
        >
          <ToggleGroupItem value="7" className="text-xs px-3">7 dias</ToggleGroupItem>
          <ToggleGroupItem value="30" className="text-xs px-3">30 dias</ToggleGroupItem>
          <ToggleGroupItem value="90" className="text-xs px-3">90 dias</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* KPI Cards - Follow-up específicos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Follow-ups Enviados"
          value={metrics.followupEnviados}
          subtitle={`${metrics.followupUltimaSemana} esta semana`}
          icon={Send}
          trend={metrics.followupUltimaSemana > 0 ? "up" : "neutral"}
        />
        <MetricCard
          title="Leads Pendentes"
          value={metrics.leadsPendentes}
          subtitle="aguardando 48h"
          icon={Clock}
          badge="Próximos"
          badgeVariant="outline"
        />
        <MetricCard
          title="Parecer Solicitado"
          value={metrics.parecerSolicitado}
          subtitle={`${metrics.taxaConversaoParecer.toFixed(1)}% conversão`}
          icon={CheckCircle}
          trend={metrics.taxaConversaoParecer > 10 ? "up" : "neutral"}
        />
        <MetricCard
          title="Conversão Pós Follow-up"
          value={`${metrics.taxaConversaoFollowup.toFixed(1)}%`}
          subtitle={`${metrics.convertidosPosFollowup} convertidos`}
          icon={Target}
          trend={metrics.taxaConversaoFollowup > 5 ? "up" : "neutral"}
        />
      </div>

      {/* Segunda linha de KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Leads"
          value={metrics.totalLeads}
          icon={Mail}
        />
        <MetricCard
          title="Leads Elegíveis"
          value={metrics.leadsElegiveis}
          subtitle="sem parecer após 48h"
          icon={MailCheck}
        />
        <MetricCard
          title="Taxa de Envio"
          value={`${metrics.taxaEnvioFollowup.toFixed(1)}%`}
          subtitle="follow-ups / elegíveis"
          icon={TrendingUp}
        />
        <MetricCard
          title="Aceita Marketing"
          value={metrics.aceitaMarketing}
          subtitle={`${((metrics.aceitaMarketing / Math.max(metrics.totalLeads, 1)) * 100).toFixed(0)}% do total`}
          icon={UserCheck}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evolução temporal de follow-ups */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Evolução de Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.evolucaoDiaria}>
                  <defs>
                    <linearGradient id="colorFollowup" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorParecer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="dia"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelFormatter={formatDate}
                  />
                  <Area
                    type="monotone"
                    dataKey="followups"
                    name="Follow-ups Enviados"
                    stroke="hsl(var(--accent))"
                    fill="url(#colorFollowup)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="pareceres"
                    name="Pareceres Solicitados"
                    stroke="hsl(var(--success))"
                    fill="url(#colorParecer)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Funil de conversão follow-up */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              Funil de Follow-up
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 py-4">
              {funnelData.map((item) => {
                const maxValue = Math.max(...funnelData.map(d => d.value), 1);
                const width = (item.value / maxValue) * 100;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ 
                          width: `${Math.max(width, 5)}%`,
                          backgroundColor: item.fill 
                        }}
                      >
                        {width > 15 && (
                          <span className="text-xs font-medium text-white">
                            {width.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Taxa de Conversão do Follow-up:</span>
                  <span className="font-semibold text-green-600">
                    {metrics.followupEnviados > 0 
                      ? ((metrics.parecerSolicitado / metrics.followupEnviados) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status dos Leads */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status dos Leads</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    label={({ name, percent }) => 
                      percent > 0.1 ? `${(percent * 100).toFixed(0)}%` : ""
                    }
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend 
                    wrapperStyle={{ fontSize: "10px" }}
                    formatter={(value) => (
                      <span className="text-muted-foreground">{value}</span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} leads`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Timeline de próximos follow-ups */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              Próximos Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {metrics.proximosFollowups.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum follow-up pendente</p>
                </div>
              </div>
            ) : (
              <div className="h-56 overflow-y-auto space-y-2 py-2">
                {metrics.proximosFollowups.slice(0, 8).map((lead, index) => (
                  <div 
                    key={lead.id} 
                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-warning/20 text-warning text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lead.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Elegível em {lead.horasRestantes}h
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {lead.bairro || "N/A"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
