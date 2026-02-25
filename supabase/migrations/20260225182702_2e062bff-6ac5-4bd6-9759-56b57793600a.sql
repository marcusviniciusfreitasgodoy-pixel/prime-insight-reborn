CREATE OR REPLACE VIEW public.itbi_stats_public AS
SELECT bairro,
    logradouro,
    uso,
    count(*) AS total_transacoes,
    round(avg(valor_m2), 2) AS preco_medio_m2,
    round(percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (valor_m2::double precision))::numeric, 2) AS mediana_m2,
    round(percentile_cont(0.10::double precision) WITHIN GROUP (ORDER BY (valor_m2::double precision))::numeric, 2) AS preco_min_m2,
    round(percentile_cont(0.90::double precision) WITHIN GROUP (ORDER BY (valor_m2::double precision))::numeric, 2) AS preco_max_m2,
    min(data_transacao) AS primeira_transacao,
    max(data_transacao) AS ultima_transacao,
    round(avg(area_m2), 2) AS area_media_m2
   FROM itbi_transactions
  WHERE valor_m2 IS NOT NULL AND valor_m2 > 0::numeric AND percentual_transferido >= 90::numeric AND data_transacao >= '2020-01-01'::date
  GROUP BY bairro, logradouro, uso
 HAVING count(*) >= 3;