import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// API da Prefeitura do Rio de Janeiro - ITBI
const PREFEITURA_API_URL = 'https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Fazenda/ITBI/MapServer/8/query';

function classificarUso(uso: string | null): 'Residencial' | 'Comercial' {
  const texto = (uso || '').toLowerCase().trim();
  if (texto.includes('nao residencial') || texto.includes('não residencial') || texto.includes('comercial')) {
    return 'Comercial';
  }
  return 'Residencial';
}

function classificarTipologia(tipologia: string | null): string {
  const tipo = (tipologia || '').toLowerCase().trim();
  if (tipo.includes('apartamento') || tipo.includes('apto') || tipo.includes('flat') || tipo.includes('cobertura')) {
    return 'Apartamento';
  } else if (tipo.includes('casa') || tipo.includes('sobrado') || tipo.includes('residencia')) {
    return 'Casa';
  } else if (tipo.includes('terreno') || tipo.includes('lote')) {
    return 'Terreno';
  } else if (tipo.includes('sala') || tipo.includes('loja') || tipo.includes('escritório')) {
    return 'Comercial';
  }
  return 'Apartamento';
}

function extractNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null;
}

function extractString(value: unknown): string | null {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verificação de segurança: validar secret (header ou body)
  const cronSecretHeader = req.headers.get('x-cron-secret');
  let cronSecretBody: string | null = null;
  
  try {
    const body = await req.clone().json();
    cronSecretBody = body?.secret || null;
  } catch {
    // Body vazio ou não-JSON, ok
  }
  
  const cronSecret = cronSecretHeader || cronSecretBody;
  const expectedSecret = Deno.env.get('CRON_SECRET');
  
  if (!expectedSecret || cronSecret !== expectedSecret) {
    console.error('[SEED] Unauthorized: Invalid or missing cron secret');
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('=== SEED ITBI DATA - CARGA INICIAL ===');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Credenciais Supabase não encontradas');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parâmetros - buscar dados de 2020 até hoje
    const minYear = 2020;
    const maxYear = new Date().getFullYear();

    console.log(`Período: ${minYear} - ${maxYear}`);

    // Buscar com paginação
    let allFeatures: any[] = [];
    let offset = 0;
    const pageSize = 1000;
    let hasMore = true;

    // WHERE clause - todos os bairros, apenas residencial
    const whereClause = `ano_transação>=${minYear} AND ano_transação<=${maxYear}`;
    const encodedWhere = encodeURIComponent(whereClause);

    console.log(`WHERE: ${whereClause}`);
    console.log('Buscando dados da API da Prefeitura...');

    while (hasMore) {
      const apiUrl = `${PREFEITURA_API_URL}?where=${encodedWhere}&outFields=*&f=json&resultRecordCount=${pageSize}&resultOffset=${offset}`;
      
      console.log(`Offset ${offset}...`);

      const response = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'GodoyPrime/2.0' }
      });
      
      if (!response.ok) {
        console.error(`HTTP Error: ${response.status}`);
        break;
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('API Error:', data.error);
        break;
      }

      if (!data.features || data.features.length === 0) {
        console.log('Fim dos dados');
        hasMore = false;
      } else {
        console.log(`Página: ${data.features.length} registros`);
        
        if (offset === 0 && data.features[0]) {
          const attrs = data.features[0].attributes;
          console.log('Exemplo registro:', JSON.stringify({
            logradouro: attrs['logradouro'],
            bairro: attrs['bairro'],
            ano: attrs['ano_transação'],
          }));
        }
        
        allFeatures = allFeatures.concat(data.features);
        
        if (data.features.length < pageSize && !data.exceededTransferLimit) {
          hasMore = false;
        } else {
          offset += pageSize;
        }
      }

      // Limite de segurança
      if (offset > 100000) {
        console.log('Limite de segurança atingido (100k)');
        hasMore = false;
      }
    }

    console.log(`Total coletado da API: ${allFeatures.length}`);

    if (allFeatures.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum dado encontrado na API',
          transacoes_encontradas: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar dados existentes
    console.log('Limpando dados existentes...');
    const { error: deleteError } = await supabase
      .from('itbi_transactions')
      .delete()
      .gte('data_transacao', `${minYear}-01-01`);
    
    if (deleteError) {
      console.warn('Aviso ao limpar:', deleteError.message);
    }

    // Transformar e validar dados
    const transacoes: any[] = [];
    let skippedInvalidData = 0;
    let skippedOutliers = 0;
    let skippedPercentual = 0;

    for (const f of allFeatures) {
      const attrs = f.attributes;
      
      const valor = extractNumber(attrs['média_valor_transação']);
      const area = extractNumber(attrs['média_área_construída']);
      const totalTransacoes = extractNumber(attrs['total_transações']) ?? 1;
      const percentualTransferido = extractNumber(attrs['média_percentual_transferido']) ?? 100;
      const logradouro = extractString(attrs['logradouro']);
      const ano = extractNumber(attrs['ano_transação']);
      const mes = extractNumber(attrs['mês_transação']);
      const tipologia = extractString(attrs['principais_tipologias']);
      const uso = extractString(attrs['uso']);
      const bairroApi = extractString(attrs['bairro']);

      if (!logradouro || valor === null || area === null || valor <= 0 || area <= 0) {
        skippedInvalidData++;
        continue;
      }

      if (percentualTransferido < 90) {
        skippedPercentual++;
        continue;
      }

      const valorM2 = valor / area;

      if (area < 20 || area > 5000) {
        skippedOutliers++;
        continue;
      }
      if (valor < 100000 || valor > 200000000) {
        skippedOutliers++;
        continue;
      }
      if (valorM2 < 500 || valorM2 > 300000) {
        skippedOutliers++;
        continue;
      }

      let dataTransacao: string;
      if (ano && mes) {
        dataTransacao = `${ano}-${String(mes).padStart(2, '0')}-15`;
      } else {
        dataTransacao = `${ano}-06-15`;
      }

      const bairroFinal = bairroApi?.toUpperCase() || 'DESCONHECIDO';

      transacoes.push({
        logradouro: logradouro.toUpperCase(),
        numero: null,
        complemento: null,
        bairro: bairroFinal,
        valor_transacao: Math.round(valor * 100) / 100,
        area_m2: Math.round(area * 100) / 100,
        data_transacao: dataTransacao,
        uso: classificarUso(uso),
        tipologia: classificarTipologia(tipologia),
        total_transacoes: Math.round(totalTransacoes),
        percentual_transferido: Math.round(percentualTransferido * 100) / 100,
      });
    }

    console.log(`Transações válidas: ${transacoes.length}`);
    console.log(`Ignoradas (dados inválidos): ${skippedInvalidData}`);
    console.log(`Ignoradas (outliers): ${skippedOutliers}`);
    console.log(`Ignoradas (percentual < 90%): ${skippedPercentual}`);

    // Inserir em lotes
    let totalInseridas = 0;
    let erros: string[] = [];
    const batchSize = 500;

    for (let i = 0; i < transacoes.length; i += batchSize) {
      const batch = transacoes.slice(i, i + batchSize);
      const { error } = await supabase.from('itbi_transactions').insert(batch);
      
      if (error) {
        console.error(`Erro no lote ${i}-${i + batchSize}:`, error.message);
        erros.push(`Lote ${i}: ${error.message}`);
      } else {
        totalInseridas += batch.length;
        console.log(`Inseridas ${totalInseridas}/${transacoes.length}`);
      }
    }

    const summary = {
      success: true,
      message: 'Seed de dados ITBI concluído',
      periodo: `${minYear}-${maxYear}`,
      api_registros: allFeatures.length,
      registros_validos: transacoes.length,
      registros_inseridos: totalInseridas,
      ignorados: {
        dados_invalidos: skippedInvalidData,
        outliers: skippedOutliers,
        percentual_baixo: skippedPercentual,
      },
      erros: erros.length > 0 ? erros : undefined,
    };

    console.log('=== SEED FINALIZADO ===');
    console.log(JSON.stringify(summary));

    return new Response(JSON.stringify(summary), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('ERRO GERAL:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
