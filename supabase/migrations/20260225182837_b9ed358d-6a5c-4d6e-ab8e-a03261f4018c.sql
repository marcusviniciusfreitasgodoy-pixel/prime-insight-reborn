CREATE OR REPLACE VIEW public.view_ranking_microbairros AS
WITH microbairro_data AS (
    SELECT
        CASE
            WHEN logradouro ~~* '%LUCIO COSTA%' OR logradouro ~~* '%LÚCIO COSTA%' OR logradouro ~~* '%SERNAMBETIBA%' OR logradouro ~~* '%PEPE%' OR logradouro ~~* '%PEPÊ%' THEN 'Orla'
            WHEN logradouro ~~* '%PENINSULA%' OR logradouro ~~* '%PENÍNSULA%' THEN 'Península'
            WHEN logradouro ~~* '%ABELARDO BUENO%' OR logradouro ~~* '%EMBAIXADOR%' THEN 'Centro Metropolitano'
            WHEN logradouro ~~* '%AYRTON SENNA%' OR logradouro ~~* '%VIA PARQUE%' OR logradouro ~~* '%ALFA BARRA%' THEN 'Ayrton Senna'
            WHEN logradouro ~~* '%OLEGARIO%' OR logradouro ~~* '%OLEGÁRIO%' OR logradouro ~~* '%ERICO%' OR logradouro ~~* '%ÉRICO%' OR logradouro ~~* '%VERÍSSIMO%' THEN 'Jardim Oceânico'
            WHEN logradouro ~~* '%DULCIDIO%' OR logradouro ~~* '%DULCÍDIO%' OR logradouro ~~* '%CARDOSO%' THEN 'ABM'
            WHEN logradouro ~~* '%MARIO COVAS%' OR logradouro ~~* '%MÁRIO COVAS%' OR logradouro ~~* '%CESAR LATTES%' OR logradouro ~~* '%CÉSAR LATTES%' OR logradouro ~~* '%HENRIQUE CORDEIRO%' THEN 'Parque das Rosas'
            WHEN logradouro ~~* '%AMERICAS%' OR logradouro ~~* '%AMÉRICAS%' THEN 'Eixo Américas'
            ELSE 'Outros'
        END AS microbairro,
        valor_m2,
        total_transacoes
    FROM itbi_transactions
    WHERE bairro ~~* 'BARRA DA TIJUCA'
      AND uso = 'Residencial'::uso_imovel
      AND percentual_transferido >= 90
      AND valor_m2 IS NOT NULL
      AND valor_m2 <= 40000
      AND data_transacao >= (CURRENT_DATE - '1 year'::interval)
)
SELECT
    microbairro,
    round(avg(valor_m2), 2) AS preco_medio_m2,
    sum(total_transacoes) AS total_transacoes,
    round(percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (valor_m2::double precision))::numeric, 2) AS mediana_m2,
    round(percentile_cont(0.10::double precision) WITHIN GROUP (ORDER BY (valor_m2::double precision))::numeric, 2) AS preco_min_m2,
    round(percentile_cont(0.90::double precision) WITHIN GROUP (ORDER BY (valor_m2::double precision))::numeric, 2) AS preco_max_m2
FROM microbairro_data
WHERE microbairro <> 'Outros'
GROUP BY microbairro
HAVING sum(total_transacoes) >= 10
ORDER BY round(avg(valor_m2), 2) DESC;