import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target
} from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { useHistoricalAnalysis, type HistoricalAnalysis, type FutureProjection } from "@/hooks/useHistoricalAnalysis";

interface Props {
  bairro: string;
  logradouro?: string;
  compact?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${value}`;
};

const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
  switch (direction) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTrendBadgeVariant = (direction: 'up' | 'down' | 'stable', isPositive: boolean) => {
  if (direction === 'up') {
    return isPositive ? "default" : "destructive";
  }
  if (direction === 'down') {
    return isPositive ? "destructive" : "default";
  }
  return "secondary";
};

export function HistoricalAnalysisChart({ bairro, logradouro, compact = false }: Props) {
  const { data: analysis, isLoading, error } = useHistoricalAnalysis(bairro, logradouro);

  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-6 px-3 sm:px-6 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Dados históricos não disponíveis para esta região
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data with projections
  const currentYear = new Date().getFullYear();
  const chartData = analysis.yearly_data.map(y => ({
    year: y.year.toString(),
    transacoes: y.transaction_count,
    valorM2: y.avg_valor_m2,
    isProjection: false,
  }));

  // Add projection data if available
  if (analysis.future_projection) {
    analysis.future_projection.projections.forEach(p => {
      chartData.push({
        year: p.year.toString(),
        transacoes: 0,
        valorM2: p.provavel,
        isProjection: true,
        pessimista: p.pessimista,
        otimista: p.otimista,
        provavel: p.provavel,
      } as any);
    });
  }

  const DiagnosisIcon = analysis.overall_diagnosis.includes('🟢') 
    ? CheckCircle 
    : analysis.overall_diagnosis.includes('🔴') 
    ? XCircle 
    : AlertTriangle;

  const diagnosisColor = analysis.overall_diagnosis.includes('🟢')
    ? 'text-emerald-600'
    : analysis.overall_diagnosis.includes('🔴')
    ? 'text-red-600'
    : 'text-amber-600';

  const getConfidenceBadgeVariant = (level: 'alta' | 'media' | 'baixa') => {
    switch (level) {
      case 'alta': return 'default';
      case 'media': return 'secondary';
      case 'baixa': return 'destructive';
    }
  };

  if (compact) {
    return (
      <Card className="bg-muted/30">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Histórico 5 Anos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-3 sm:px-6">
          {/* Trends Summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              {getTrendIcon(analysis.transaction_trend.direction)}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Transações</p>
                <Badge 
                  variant={getTrendBadgeVariant(analysis.transaction_trend.direction, true)} 
                  className="text-[10px]"
                >
                  {analysis.transaction_trend.percentage > 0 ? '+' : ''}
                  {analysis.transaction_trend.percentage}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(analysis.price_trend.direction)}
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Valor/m²</p>
                <Badge 
                  variant={getTrendBadgeVariant(analysis.price_trend.direction, true)} 
                  className="text-[10px]"
                >
                  {analysis.price_trend.percentage > 0 ? '+' : ''}
                  {analysis.price_trend.percentage}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Overall Diagnosis */}
          <div className={`p-2 rounded-lg bg-background border ${
            analysis.overall_diagnosis.includes('🟢') ? 'border-emerald-200' :
            analysis.overall_diagnosis.includes('🔴') ? 'border-red-200' :
            'border-amber-200'
          }`}>
            <p className="text-xs leading-relaxed">
              {analysis.overall_diagnosis}
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{analysis.total_transactions} transações (5 anos)</span>
            <span>~{analysis.avg_transactions_per_year}/ano</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          📊 Análise Histórica e Projeção de Valor
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Evolução histórica (5 anos) e projeção futura (3 anos)
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-3 sm:px-6">
        {/* Chart */}
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v.toString()}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v)}
              />
              <ReferenceLine 
                x={currentYear.toString()} 
                yAxisId="right" 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                label={{ value: 'Hoje', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  fontSize: 12, 
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number, name: string, props: any) => {
                  if (name === 'transacoes') return [value, 'Transações'];
                  if (name === 'valorM2') {
                    if (props.payload.isProjection) {
                      return [formatCurrency(value), 'Projeção Provável'];
                    }
                    return [formatCurrency(value), 'Valor/m² Real'];
                  }
                  if (name === 'otimista') return [formatCurrency(value), 'Cenário Otimista'];
                  if (name === 'pessimista') return [formatCurrency(value), 'Cenário Pessimista'];
                  return [formatCurrency(value), name];
                }}
                labelFormatter={(label) => `Ano: ${label}`}
              />
              <Legend 
                wrapperStyle={{ fontSize: 10 }}
                formatter={(value) => {
                  if (value === 'transacoes') return 'Transações';
                  if (value === 'valorM2') return 'Valor/m²';
                  if (value === 'otimista') return 'Otimista';
                  if (value === 'pessimista') return 'Pessimista';
                  return value;
                }}
              />
              <Bar 
                yAxisId="left" 
                dataKey="transacoes" 
                fill="hsl(var(--primary) / 0.6)" 
                radius={[4, 4, 0, 0]}
                name="transacoes"
              />
              {/* Projection area for range */}
              {analysis.future_projection && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="otimista"
                  stroke="transparent"
                  fill="url(#projectionGradient)"
                  name="otimista"
                />
              )}
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="valorM2" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isProjection) {
                    return (
                      <circle 
                        key={`dot-${payload.year}`}
                        cx={cx} 
                        cy={cy} 
                        r={4} 
                        fill="hsl(var(--chart-2))" 
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle key={`dot-${payload.year}`} cx={cx} cy={cy} r={4} fill="hsl(var(--chart-1))" />;
                }}
                name="valorM2"
              />
              {/* Provável projection line (dashed) */}
              {analysis.future_projection && (
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="provavel" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: 'hsl(var(--chart-2))' }}
                  name="provavel"
                  connectNulls={false}
                />
              )}
              {/* Pessimista line for projections */}
              {analysis.future_projection && (
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="pessimista" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={{ r: 3, fill: 'hsl(var(--destructive))' }}
                  name="pessimista"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Trends */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2 mb-1">
              {getTrendIcon(analysis.transaction_trend.direction)}
              <span className="text-xs font-medium">Liquidez</span>
            </div>
            <Badge 
              variant={getTrendBadgeVariant(analysis.transaction_trend.direction, true)} 
              className="text-xs mb-2"
            >
              {analysis.transaction_trend.percentage > 0 ? '+' : ''}
              {analysis.transaction_trend.percentage}%
            </Badge>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {analysis.transaction_trend.label}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-background border">
            <div className="flex items-center gap-2 mb-1">
              {getTrendIcon(analysis.price_trend.direction)}
              <span className="text-xs font-medium">Preços</span>
            </div>
            <Badge 
              variant={getTrendBadgeVariant(analysis.price_trend.direction, true)} 
              className="text-xs mb-2"
            >
              {analysis.price_trend.percentage > 0 ? '+' : ''}
              {analysis.price_trend.percentage}%
            </Badge>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {analysis.price_trend.label}
            </p>
          </div>
        </div>

        {/* Future Projection Section */}
        {analysis.future_projection && (
          <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-semibold">Projeção de Valor (3 Anos)</h4>
              <Badge variant={getConfidenceBadgeVariant(analysis.future_projection.confidence_level)} className="ml-auto text-[10px]">
                Confiança: {analysis.future_projection.confidence_level.charAt(0).toUpperCase() + analysis.future_projection.confidence_level.slice(1)}
              </Badge>
            </div>

            {/* Projection Table */}
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Ano</th>
                    <th className="text-right py-2 font-medium text-red-600">Pessimista</th>
                    <th className="text-right py-2 font-medium text-primary">Provável</th>
                    <th className="text-right py-2 font-medium text-emerald-600">Otimista</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.future_projection.projections.map((p) => (
                    <tr key={p.year} className="border-b border-dashed last:border-0">
                      <td className="py-2 font-medium">{p.year}</td>
                      <td className="text-right py-2 text-red-600">{formatCurrency(p.pessimista)}/m²</td>
                      <td className="text-right py-2 font-semibold text-primary">{formatCurrency(p.provavel)}/m²</td>
                      <td className="text-right py-2 text-emerald-600">{formatCurrency(p.otimista)}/m²</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Projection Stats */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Taxa média anual: {analysis.future_projection.annual_growth_rate > 0 ? '+' : ''}{analysis.future_projection.annual_growth_rate.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Volatilidade: {analysis.future_projection.volatility.toFixed(1)}%
              </span>
            </div>

            {/* Projection Diagnosis */}
            <p className="text-xs leading-relaxed">
              {analysis.future_projection.projection_diagnosis}
            </p>
          </div>
        )}

        {/* Diagnosis */}
        <div className={`p-3 sm:p-4 rounded-lg border ${
          analysis.overall_diagnosis.includes('🟢') ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30' :
          analysis.overall_diagnosis.includes('🔴') ? 'bg-red-50 border-red-200 dark:bg-red-950/30' :
          'bg-amber-50 border-amber-200 dark:bg-amber-950/30'
        }`}>
          <div className="flex items-start gap-2">
            <DiagnosisIcon className={`h-5 w-5 shrink-0 mt-0.5 ${diagnosisColor}`} />
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-medium">
                {analysis.overall_diagnosis.replace(/^[🟢🟡🔴]\s*/, '').split(':')[0]}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {analysis.overall_diagnosis.split(':').slice(1).join(':').trim()}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Diagnosis */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>{analysis.liquidity_diagnosis}</p>
          <p>{analysis.price_diagnosis}</p>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
          <span>📊 {analysis.total_transactions} transações analisadas</span>
          <span>~{analysis.avg_transactions_per_year} transações/ano</span>
        </div>
      </CardContent>
    </Card>
  );
}
