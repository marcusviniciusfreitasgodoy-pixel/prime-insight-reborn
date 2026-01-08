import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLeadsMetrics } from "@/hooks/useLeadsMetrics";
import {
  Users,
  Target,
  TrendingUp,
  BarChart3,
  AlertTriangle,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--muted-foreground))",
];

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

function MetricKPICard({ title, value, subtitle, icon: Icon, trend, trendValue }: KPICardProps) {
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trendValue && (
              <p className={`text-xs font-medium ${trendColor} mt-1`}>
                {trend === "up" && "↑ "}{trend === "down" && "↓ "}{trendValue}
              </p>
            )}
          </div>
          <div className="bg-accent/15 p-2 rounded-lg border border-accent/20">
            <Icon className="h-5 w-5 text-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeadsMetricsDashboard() {
  const [periodo, setPeriodo] = useState<string>("30");
  const { data: metrics, isLoading } = useLeadsMetrics(parseInt(periodo));

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

  const funnelData = [
    { name: "Total de Leads", value: metrics.totalLeads, fill: "hsl(var(--accent))" },
    { name: "Atingiram Limite", value: metrics.leadsAtingiramLimite, fill: "hsl(var(--warning))" },
    { name: "Convertidos", value: metrics.leadsConvertidos, fill: "hsl(var(--success))" },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Métricas de Leads</h2>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricKPICard
          title="Total de Leads"
          value={metrics.totalLeads}
          subtitle={`${metrics.leadsUltimaSemana} esta semana`}
          icon={Users}
          trend={metrics.leadsUltimaSemana > 0 ? "up" : "neutral"}
        />
        <MetricKPICard
          title="Limite Atingido"
          value={`${metrics.taxaLimiteAtingido.toFixed(1)}%`}
          subtitle={`${metrics.leadsAtingiramLimite} leads`}
          icon={AlertTriangle}
          trend={metrics.taxaLimiteAtingido > 20 ? "up" : "neutral"}
        />
        <MetricKPICard
          title="Taxa de Conversão"
          value={`${metrics.taxaConversao.toFixed(1)}%`}
          subtitle={`${metrics.leadsConvertidos} convertidos`}
          icon={Target}
          trend={metrics.taxaConversao > 0 ? "up" : "neutral"}
        />
        <MetricKPICard
          title="Engajamento Médio"
          value={metrics.mediaAvaliacoes.toFixed(1)}
          subtitle="avaliações/lead"
          icon={BarChart3}
          trend={metrics.mediaAvaliacoes > 2 ? "up" : "neutral"}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evolução temporal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Evolução de Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.evolucaoDiaria}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
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
                    dataKey="novosLeads"
                    name="Novos Leads"
                    stroke="hsl(var(--accent))"
                    fill="url(#colorLeads)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Funil de conversão */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 py-4">
              {funnelData.map((item, index) => {
                const width = metrics.totalLeads > 0 
                  ? (item.value / metrics.totalLeads) * 100 
                  : 0;
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
              {metrics.taxaConversaoPosLimite > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                  Taxa de conversão pós-limite: <span className="font-semibold text-success">{metrics.taxaConversaoPosLimite.toFixed(1)}%</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Por bairro */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top 5 Bairros</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.porBairro} layout="vertical">
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="bairro" 
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar 
                    dataKey="total" 
                    name="Leads" 
                    fill="hsl(var(--accent))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Por origem */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Origem</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.porOrigem}
                    dataKey="total"
                    nameKey="origem"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    label={({ origem, percent }) => 
                      percent > 0.1 ? `${(percent * 100).toFixed(0)}%` : ""
                    }
                    labelLine={false}
                  >
                    {metrics.porOrigem.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
      </div>
    </div>
  );
}
