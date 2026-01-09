import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface YearlyData {
  year: number;
  transaction_count: number;
  avg_valor_m2: number;
  min_valor_m2: number;
  max_valor_m2: number;
}

export interface HistoricalTrend {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  label: string;
}

export interface HistoricalAnalysis {
  yearly_data: YearlyData[];
  transaction_trend: HistoricalTrend;
  price_trend: HistoricalTrend;
  liquidity_diagnosis: string;
  price_diagnosis: string;
  overall_diagnosis: string;
  total_transactions: number;
  avg_transactions_per_year: number;
}

// Limites de outliers por bairro
const OUTLIER_LIMITS: Record<string, number> = {
  'BARRA DA TIJUCA': 40000,
  'RECREIO DOS BANDEIRANTES': 35000,
  'LEBLON': 80000,
  'IPANEMA': 70000,
  'LAGOA': 50000,
  'JARDIM BOTANICO': 50000,
  'GAVEA': 50000,
  'COPACABANA': 40000,
  'BOTAFOGO': 40000,
  'FLAMENGO': 35000,
  'LARANJEIRAS': 35000,
  'HUMAITA': 40000,
  'TIJUCA': 30000,
  'DEFAULT': 60000,
};

const getOutlierLimit = (bairro: string): number => {
  const normalizedBairro = bairro.toUpperCase();
  return OUTLIER_LIMITS[normalizedBairro] || OUTLIER_LIMITS['DEFAULT'];
};

function calculateTrend(data: YearlyData[], field: 'transaction_count' | 'avg_valor_m2'): HistoricalTrend {
  if (data.length < 2) {
    return { direction: 'stable', percentage: 0, label: 'Dados insuficientes' };
  }

  // Compare last 2 years
  const recentYears = data.slice(-3);
  if (recentYears.length < 2) {
    return { direction: 'stable', percentage: 0, label: 'Dados insuficientes' };
  }

  const firstValue = recentYears[0][field];
  const lastValue = recentYears[recentYears.length - 1][field];

  if (firstValue === 0) {
    return { direction: 'stable', percentage: 0, label: 'Sem base de comparação' };
  }

  const percentageChange = ((lastValue - firstValue) / firstValue) * 100;
  
  let direction: 'up' | 'down' | 'stable';
  let label: string;

  if (percentageChange > 5) {
    direction = 'up';
    label = field === 'transaction_count' ? 'Aumento de liquidez' : 'Valorização';
  } else if (percentageChange < -5) {
    direction = 'down';
    label = field === 'transaction_count' ? 'Redução de liquidez' : 'Desvalorização';
  } else {
    direction = 'stable';
    label = field === 'transaction_count' ? 'Liquidez estável' : 'Preços estáveis';
  }

  return {
    direction,
    percentage: parseFloat(percentageChange.toFixed(1)),
    label,
  };
}

function generateDiagnosis(
  transactionTrend: HistoricalTrend,
  priceTrend: HistoricalTrend,
  avgTransactionsPerYear: number
): { liquidity: string; price: string; overall: string } {
  // Diagnóstico de liquidez
  let liquidity: string;
  if (transactionTrend.direction === 'up') {
    liquidity = `O número de transações na região aumentou ${transactionTrend.percentage.toFixed(0)}% nos últimos anos, indicando maior demanda e facilidade de venda.`;
  } else if (transactionTrend.direction === 'down') {
    liquidity = `O número de transações na região diminuiu ${Math.abs(transactionTrend.percentage).toFixed(0)}% nos últimos anos, indicando menor liquidez. Recomenda-se precificação competitiva.`;
  } else {
    liquidity = `O volume de transações permanece estável na região, mantendo liquidez consistente ao longo dos anos.`;
  }

  // Diagnóstico de preço
  let price: string;
  if (priceTrend.direction === 'up') {
    price = `O valor médio por m² valorizou ${priceTrend.percentage.toFixed(0)}% nos últimos anos, refletindo aquecimento do mercado local.`;
  } else if (priceTrend.direction === 'down') {
    price = `O valor médio por m² recuou ${Math.abs(priceTrend.percentage).toFixed(0)}% nos últimos anos. Considere este fator na estratégia de precificação.`;
  } else {
    price = `Os preços por m² mantiveram-se estáveis nos últimos anos, indicando mercado equilibrado.`;
  }

  // Diagnóstico geral
  let overall: string;
  if (transactionTrend.direction === 'up' && priceTrend.direction === 'up') {
    overall = '🟢 MERCADO AQUECIDO: Alta demanda combinada com valorização. Momento favorável para venda.';
  } else if (transactionTrend.direction === 'down' && priceTrend.direction === 'down') {
    overall = '🔴 MERCADO DESAFIADOR: Menor liquidez e preços em queda. Considere precificação agressiva ou aguardar momento mais favorável.';
  } else if (transactionTrend.direction === 'up' && priceTrend.direction === 'down') {
    overall = '🟡 MERCADO EM AJUSTE: Volume crescente mas preços em correção. Oportunidade para compradores, vendedores devem ser competitivos.';
  } else if (transactionTrend.direction === 'down' && priceTrend.direction === 'up') {
    overall = '🟡 MERCADO SELETIVO: Menos transações mas preços subindo. Compradores mais exigentes, imóvel diferenciado pode se destacar.';
  } else {
    overall = '🟢 MERCADO ESTÁVEL: Condições normais de mercado. Precificação adequada deve garantir venda em tempo razoável.';
  }

  // Adicionar contexto de volume
  if (avgTransactionsPerYear < 10) {
    overall += ' ⚠️ Volume baixo de transações na região - dados limitados.';
  }

  return { liquidity, price, overall };
}

export function useHistoricalAnalysis(bairro: string, logradouro?: string) {
  return useQuery<HistoricalAnalysis | null>({
    queryKey: ['historical-analysis', bairro, logradouro],
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!bairro,
    queryFn: async () => {
      const outlierLimit = getOutlierLimit(bairro);
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 5;
      const startDate = `${startYear}-01-01`;

      let allData: { data_transacao: string; valor_m2: number | null }[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('itbi_transactions')
          .select('data_transacao, valor_m2')
          .eq('uso', 'Residencial')
          .ilike('bairro', bairro)
          .not('valor_m2', 'is', null)
          .lte('valor_m2', outlierLimit)
          .gte('percentual_transferido', 90)
          .gte('data_transacao', startDate)
          .order('data_transacao', { ascending: true })
          .range(offset, offset + pageSize - 1);

        // Filter by logradouro if provided
        if (logradouro && logradouro.trim() !== '') {
          query = query.ilike('logradouro', `%${logradouro}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      if (allData.length === 0) {
        return null;
      }

      // Group by year
      const yearlyGroups: Record<number, number[]> = {};
      
      allData.forEach(t => {
        const year = new Date(t.data_transacao).getFullYear();
        if (!yearlyGroups[year]) {
          yearlyGroups[year] = [];
        }
        if (t.valor_m2) {
          yearlyGroups[year].push(t.valor_m2);
        }
      });

      // Create yearly data array
      const yearlyData: YearlyData[] = [];
      
      for (let year = startYear; year <= currentYear; year++) {
        const values = yearlyGroups[year] || [];
        if (values.length > 0) {
          const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
          yearlyData.push({
            year,
            transaction_count: values.length,
            avg_valor_m2: Math.round(avg),
            min_valor_m2: Math.round(Math.min(...values)),
            max_valor_m2: Math.round(Math.max(...values)),
          });
        } else {
          yearlyData.push({
            year,
            transaction_count: 0,
            avg_valor_m2: 0,
            min_valor_m2: 0,
            max_valor_m2: 0,
          });
        }
      }

      // Filter out years with no data for trend calculation
      const validYearlyData = yearlyData.filter(y => y.transaction_count > 0);

      // Calculate trends
      const transactionTrend = calculateTrend(validYearlyData, 'transaction_count');
      const priceTrend = calculateTrend(validYearlyData, 'avg_valor_m2');

      // Calculate totals
      const totalTransactions = validYearlyData.reduce((sum, y) => sum + y.transaction_count, 0);
      const yearsWithData = validYearlyData.length;
      const avgTransactionsPerYear = yearsWithData > 0 ? totalTransactions / yearsWithData : 0;

      // Generate diagnosis
      const diagnosis = generateDiagnosis(transactionTrend, priceTrend, avgTransactionsPerYear);

      return {
        yearly_data: yearlyData,
        transaction_trend: transactionTrend,
        price_trend: priceTrend,
        liquidity_diagnosis: diagnosis.liquidity,
        price_diagnosis: diagnosis.price,
        overall_diagnosis: diagnosis.overall,
        total_transactions: totalTransactions,
        avg_transactions_per_year: Math.round(avgTransactionsPerYear),
      };
    },
  });
}
