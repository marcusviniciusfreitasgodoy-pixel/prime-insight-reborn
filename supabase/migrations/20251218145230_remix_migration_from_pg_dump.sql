CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'corretor',
    'gerente'
);


--
-- Name: uso_imovel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.uso_imovel AS ENUM (
    'Residencial',
    'Comercial'
);


--
-- Name: check_lead_exists(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_lead_exists(lead_email text) RETURNS TABLE(exists_flag boolean, current_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as exists_flag,
    COALESCE(evaluation_count, 1) as current_count
  FROM public.leads 
  WHERE email = lower(trim(lead_email))
  LIMIT 1;
  
  -- If no rows returned, return false with count 0
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE as exists_flag, 0 as current_count;
  END IF;
END;
$$;


--
-- Name: get_vault_secret(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_vault_secret(secret_name text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  secret_value text;
BEGIN
  -- Only allow service_role to access this function
  IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: requires service_role';
  END IF;
  
  -- Retrieve the decrypted secret from vault
  SELECT decrypted_secret INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = secret_name;
  
  RETURN secret_value;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'corretor');
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.raw_user_meta_data ->> 'phone'
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: increment_lead_evaluation(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_lead_evaluation(lead_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Only increment if lead exists and hasn't been updated in the last minute (rate limit)
  UPDATE public.leads 
  SET evaluation_count = COALESCE(evaluation_count, 0) + 1,
      updated_at = now()
  WHERE email = lead_email
    AND (updated_at < now() - interval '1 minute' OR updated_at IS NULL);
END;
$$;


--
-- Name: update_lead_by_email(text, text, text, text, numeric, numeric, integer, integer, integer, integer, text, text, text, boolean, text, text, text, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_lead_by_email(p_email text, p_nome text DEFAULT NULL::text, p_telefone text DEFAULT NULL::text, p_bairro_interesse text DEFAULT NULL::text, p_area_interesse numeric DEFAULT NULL::numeric, p_valor_interesse numeric DEFAULT NULL::numeric, p_quartos integer DEFAULT NULL::integer, p_banheiros integer DEFAULT NULL::integer, p_suites integer DEFAULT NULL::integer, p_vagas integer DEFAULT NULL::integer, p_objetivo text DEFAULT NULL::text, p_urgencia text DEFAULT NULL::text, p_preferencia_contato text DEFAULT NULL::text, p_aceita_marketing boolean DEFAULT NULL::boolean, p_diferenciais_imovel text DEFAULT NULL::text, p_interesse text DEFAULT NULL::text, p_endereco_imovel_analise text DEFAULT NULL::text, p_valor_pedido_vendedor numeric DEFAULT NULL::numeric) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_lead_id uuid;
BEGIN
  -- Update the lead and return its ID
  UPDATE public.leads 
  SET 
    nome = COALESCE(p_nome, nome),
    telefone = COALESCE(p_telefone, telefone),
    bairro_interesse = COALESCE(p_bairro_interesse, bairro_interesse),
    area_interesse = COALESCE(p_area_interesse, area_interesse),
    valor_interesse = COALESCE(p_valor_interesse, valor_interesse),
    quartos = COALESCE(p_quartos, quartos),
    banheiros = COALESCE(p_banheiros, banheiros),
    suites = COALESCE(p_suites, suites),
    vagas = COALESCE(p_vagas, vagas),
    objetivo = COALESCE(p_objetivo, objetivo),
    urgencia = COALESCE(p_urgencia, urgencia),
    preferencia_contato = COALESCE(p_preferencia_contato, preferencia_contato),
    aceita_marketing = COALESCE(p_aceita_marketing, aceita_marketing),
    diferenciais_imovel = COALESCE(p_diferenciais_imovel, diferenciais_imovel),
    interesse = COALESCE(p_interesse, interesse),
    endereco_imovel_analise = COALESCE(p_endereco_imovel_analise, endereco_imovel_analise),
    valor_pedido_vendedor = COALESCE(p_valor_pedido_vendedor, valor_pedido_vendedor),
    updated_at = now()
  WHERE email = lower(trim(p_email))
  RETURNING id INTO v_lead_id;
  
  -- Also increment evaluation count
  UPDATE public.leads 
  SET evaluation_count = COALESCE(evaluation_count, 0) + 1
  WHERE id = v_lead_id;
  
  RETURN v_lead_id;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: condominios_mapeamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.condominios_mapeamento (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome_condominio text NOT NULL,
    logradouro_padrao text NOT NULL,
    numero_inicio integer,
    numero_fim integer,
    microbairro text,
    padrao_construtivo text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ia_valuation_weights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ia_valuation_weights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome_variavel text,
    parametro text,
    peso_valor numeric,
    tipo_imovel text,
    descricao text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    factor_key text,
    label text,
    multiplier numeric,
    category text,
    order_index integer,
    is_active boolean DEFAULT true,
    CONSTRAINT ia_valuation_weights_tipo_imovel_check CHECK ((tipo_imovel = ANY (ARRAY['Apartamento'::text, 'Casa'::text, 'Ambos'::text])))
);


--
-- Name: itbi_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itbi_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    logradouro text NOT NULL,
    numero text,
    complemento text,
    bairro text DEFAULT 'BARRA DA TIJUCA'::text,
    valor_transacao numeric(15,2) NOT NULL,
    area_m2 numeric(10,2) NOT NULL,
    valor_m2 numeric(10,2) GENERATED ALWAYS AS ((valor_transacao / NULLIF(area_m2, (0)::numeric))) STORED,
    data_transacao date NOT NULL,
    uso public.uso_imovel DEFAULT 'Residencial'::public.uso_imovel NOT NULL,
    tipologia text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    total_transacoes integer DEFAULT 1 NOT NULL,
    percentual_transferido numeric DEFAULT 100
);


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    email text NOT NULL,
    telefone text NOT NULL,
    interesse text DEFAULT 'compra'::text,
    bairro_interesse text,
    area_interesse numeric,
    valor_interesse numeric,
    origem text DEFAULT 'avaliacao_rapida'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    convertido boolean DEFAULT false,
    notas text,
    quartos integer,
    banheiros integer,
    suites integer,
    vagas integer,
    evaluation_count integer DEFAULT 1,
    objetivo text,
    urgencia text,
    preferencia_contato text,
    aceita_marketing boolean DEFAULT false,
    diferenciais_imovel text,
    endereco_imovel_analise text,
    valor_pedido_vendedor numeric
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sofia_knowledge_base; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sofia_knowledge_base (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category character varying(100) NOT NULL,
    title character varying(500) NOT NULL,
    content text NOT NULL,
    keywords text[] DEFAULT '{}'::text[],
    source character varying(500),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'corretor'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: valuation_characteristics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.valuation_characteristics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category character varying(1) NOT NULL,
    category_name character varying(100) NOT NULL,
    char_code character varying(50) NOT NULL,
    char_name character varying(150) NOT NULL,
    char_description text,
    char_type character varying(10) NOT NULL,
    weight_value numeric(5,4) NOT NULL,
    category_cap_max numeric(5,4) NOT NULL,
    category_cap_min numeric(5,4) NOT NULL,
    display_order integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    applies_to character varying(20) DEFAULT 'ambos'::character varying,
    CONSTRAINT valuation_characteristics_applies_to_check CHECK (((applies_to)::text = ANY ((ARRAY['casa'::character varying, 'apartamento'::character varying, 'ambos'::character varying])::text[]))),
    CONSTRAINT valuation_characteristics_char_type_check CHECK (((char_type)::text = ANY ((ARRAY['positive'::character varying, 'negative'::character varying])::text[])))
);


--
-- Name: valuation_documentation_factors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.valuation_documentation_factors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status_code character varying(50) NOT NULL,
    status_name character varying(100) NOT NULL,
    factor numeric(5,4),
    adjustment numeric(5,4),
    severity character varying(20) NOT NULL,
    action_required character varying(50) NOT NULL,
    description text,
    display_order integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: valuation_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.valuation_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    valuation_id uuid NOT NULL,
    characteristic_id uuid NOT NULL,
    response_value character varying(20) NOT NULL,
    weight_applied numeric(5,4),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT valuation_responses_response_value_check CHECK (((response_value)::text = ANY ((ARRAY['sim'::character varying, 'nao'::character varying, 'parcial'::character varying, 'nao_aplica'::character varying])::text[])))
);


--
-- Name: valuations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.valuations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    logradouro text NOT NULL,
    numero text,
    bairro text DEFAULT 'BARRA DA TIJUCA'::text NOT NULL,
    property_area_m2 numeric(10,2) NOT NULL,
    property_type character varying(50) DEFAULT 'apartamento'::character varying,
    itbi_min_m2 numeric(10,2) NOT NULL,
    itbi_med_m2 numeric(10,2) NOT NULL,
    itbi_max_m2 numeric(10,2) NOT NULL,
    itbi_transaction_count integer,
    anuncio_min_m2 numeric(10,2),
    anuncio_med_m2 numeric(10,2),
    anuncio_max_m2 numeric(10,2),
    combined_min_m2 numeric(10,2) NOT NULL,
    combined_med_m2 numeric(10,2) NOT NULL,
    combined_max_m2 numeric(10,2) NOT NULL,
    trend_percentage numeric(5,2),
    trend_direction character varying(10),
    base_price_selected character varying(10) DEFAULT 'med'::character varying,
    base_price_custom_m2 numeric(10,2),
    total_adjustment numeric(5,4) NOT NULL,
    auto_capped boolean DEFAULT false,
    documentation_status character varying(50) NOT NULL,
    documentation_factor numeric(5,4) NOT NULL,
    documentation_notes text,
    final_value_min numeric(15,2) NOT NULL,
    final_value_med numeric(15,2) NOT NULL,
    final_value_max numeric(15,2) NOT NULL,
    confidence_score integer NOT NULL,
    confidence_level character varying(20) NOT NULL,
    spread_percentage numeric(5,2) NOT NULL,
    recommendation_action character varying(100),
    recommendation_title character varying(200),
    recommendation_details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    pdf_generated boolean DEFAULT false,
    area_terreno_m2 numeric,
    proporcao_terreno numeric,
    bonus_terreno numeric DEFAULT 0,
    CONSTRAINT valuations_base_price_selected_check CHECK (((base_price_selected)::text = ANY ((ARRAY['min'::character varying, 'med'::character varying, 'max'::character varying, 'custom'::character varying])::text[]))),
    CONSTRAINT valuations_confidence_level_check CHECK (((confidence_level)::text = ANY ((ARRAY['green'::character varying, 'yellow_high'::character varying, 'yellow_medium'::character varying, 'red'::character varying])::text[]))),
    CONSTRAINT valuations_trend_direction_check CHECK (((trend_direction)::text = ANY ((ARRAY['UP'::character varying, 'STABLE'::character varying, 'DOWN'::character varying])::text[])))
);


--
-- Name: view_ranking_microbairros; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.view_ranking_microbairros WITH (security_invoker='true') AS
 WITH microbairro_data AS (
         SELECT
                CASE
                    WHEN ((itbi_transactions.logradouro ~~* '%LUCIO COSTA%'::text) OR (itbi_transactions.logradouro ~~* '%LÚCIO COSTA%'::text) OR (itbi_transactions.logradouro ~~* '%SERNAMBETIBA%'::text) OR (itbi_transactions.logradouro ~~* '%PEPE%'::text) OR (itbi_transactions.logradouro ~~* '%PEPÊ%'::text)) THEN 'Orla'::text
                    WHEN ((itbi_transactions.logradouro ~~* '%PENINSULA%'::text) OR (itbi_transactions.logradouro ~~* '%PENÍNSULA%'::text)) THEN 'Península'::text
                    WHEN ((itbi_transactions.logradouro ~~* '%ABELARDO BUENO%'::text) OR (itbi_transactions.logradouro ~~* '%EMBAIXADOR%'::text)) THEN 'Centro Metropolitano'::text
                    WHEN ((itbi_transactions.logradouro ~~* '%AYRTON SENNA%'::text) OR (itbi_transactions.logradouro ~~* '%VIA PARQUE%'::text) OR (itbi_transactions.logradouro ~~* '%ALFA BARRA%'::text)) THEN 'Ayrton Senna'::text
                    WHEN ((itbi_transactions.logradouro ~~* '%OLEGARIO%'::text) OR (itbi_transactions.logradouro ~~* '%OLEGÁRIO%'::text) OR (itbi_transactions.logradouro ~~* '%ERICO%'::text) OR (itbi_transactions.logradouro ~~* '%ÉRICO%'::text) OR (itbi_transactions.logradouro ~~* '%VERÍSSIMO%'::text)) THEN 'Jardim Oceânico'::text
                    WHEN ((itbi_transactions.logradouro ~~* '%DULCIDIO%'::text) OR (itbi_transactions.logradouro ~~* '%DULCÍDIO%'::text) OR (itbi_transactions.logradouro ~~* '%CARDOSO%'::text)) THEN 'ABM'::text
                    WHEN ((itbi_transactions.logradouro ~~* '%MARIO COVAS%'::text) OR (itbi_transactions.logradouro ~~* '%MÁRIO COVAS%'::text) OR (itbi_transactions.logradouro ~~* '%CESAR LATTES%'::text) OR (itbi_transactions.logradouro ~~* '%CÉSAR LATTES%'::text) OR (itbi_transactions.logradouro ~~* '%HENRIQUE CORDEIRO%'::text)) THEN 'Parque das Rosas'::text
                    WHEN ((itbi_transactions.logradouro ~~* '%AMERICAS%'::text) OR (itbi_transactions.logradouro ~~* '%AMÉRICAS%'::text)) THEN 'Eixo Américas'::text
                    ELSE 'Outros'::text
                END AS microbairro,
            itbi_transactions.valor_m2,
            itbi_transactions.total_transacoes
           FROM public.itbi_transactions
          WHERE ((itbi_transactions.bairro ~~* 'BARRA DA TIJUCA'::text) AND (itbi_transactions.uso = 'Residencial'::public.uso_imovel) AND (itbi_transactions.percentual_transferido >= (90)::numeric) AND (itbi_transactions.valor_m2 IS NOT NULL) AND (itbi_transactions.valor_m2 <= (40000)::numeric) AND (itbi_transactions.data_transacao >= (CURRENT_DATE - '1 year'::interval)))
        )
 SELECT microbairro,
    round(avg(valor_m2), 2) AS preco_medio_m2,
    sum(total_transacoes) AS total_transacoes,
    round((percentile_cont((0.5)::double precision) WITHIN GROUP (ORDER BY ((valor_m2)::double precision)))::numeric, 2) AS mediana_m2,
    round(min(valor_m2), 2) AS preco_min_m2,
    round(max(valor_m2), 2) AS preco_max_m2
   FROM microbairro_data
  WHERE (microbairro <> 'Outros'::text)
  GROUP BY microbairro
 HAVING (sum(total_transacoes) >= 10)
  ORDER BY (round(avg(valor_m2), 2)) DESC;


--
-- Name: condominios_mapeamento condominios_mapeamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condominios_mapeamento
    ADD CONSTRAINT condominios_mapeamento_pkey PRIMARY KEY (id);


--
-- Name: ia_valuation_weights ia_valuation_weights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ia_valuation_weights
    ADD CONSTRAINT ia_valuation_weights_pkey PRIMARY KEY (id);


--
-- Name: itbi_transactions itbi_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itbi_transactions
    ADD CONSTRAINT itbi_transactions_pkey PRIMARY KEY (id);


--
-- Name: itbi_transactions itbi_unique_transaction; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itbi_transactions
    ADD CONSTRAINT itbi_unique_transaction UNIQUE (logradouro, numero, data_transacao, valor_transacao);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: sofia_knowledge_base sofia_knowledge_base_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sofia_knowledge_base
    ADD CONSTRAINT sofia_knowledge_base_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: valuation_characteristics valuation_characteristics_char_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valuation_characteristics
    ADD CONSTRAINT valuation_characteristics_char_code_key UNIQUE (char_code);


--
-- Name: valuation_characteristics valuation_characteristics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valuation_characteristics
    ADD CONSTRAINT valuation_characteristics_pkey PRIMARY KEY (id);


--
-- Name: valuation_documentation_factors valuation_documentation_factors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valuation_documentation_factors
    ADD CONSTRAINT valuation_documentation_factors_pkey PRIMARY KEY (id);


--
-- Name: valuation_documentation_factors valuation_documentation_factors_status_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valuation_documentation_factors
    ADD CONSTRAINT valuation_documentation_factors_status_code_key UNIQUE (status_code);


--
-- Name: valuation_responses valuation_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valuation_responses
    ADD CONSTRAINT valuation_responses_pkey PRIMARY KEY (id);


--
-- Name: valuations valuations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valuations
    ADD CONSTRAINT valuations_pkey PRIMARY KEY (id);


--
-- Name: idx_condominios_logradouro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_condominios_logradouro ON public.condominios_mapeamento USING btree (logradouro_padrao);


--
-- Name: idx_condominios_microbairro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_condominios_microbairro ON public.condominios_mapeamento USING btree (microbairro);


--
-- Name: idx_condominios_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_condominios_nome ON public.condominios_mapeamento USING btree (nome_condominio);


--
-- Name: idx_itbi_bairro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itbi_bairro ON public.itbi_transactions USING btree (bairro);


--
-- Name: idx_itbi_bairro_uso_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itbi_bairro_uso_data ON public.itbi_transactions USING btree (bairro, uso, data_transacao);


--
-- Name: idx_itbi_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itbi_data ON public.itbi_transactions USING btree (data_transacao DESC);


--
-- Name: idx_itbi_logradouro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itbi_logradouro ON public.itbi_transactions USING btree (logradouro);


--
-- Name: idx_itbi_uso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itbi_uso ON public.itbi_transactions USING btree (uso);


--
-- Name: idx_leads_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC);


--
-- Name: idx_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_email ON public.leads USING btree (email);


--
-- Name: idx_sofia_knowledge_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sofia_knowledge_category ON public.sofia_knowledge_base USING btree (category);


--
-- Name: idx_sofia_knowledge_content; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sofia_knowledge_content ON public.sofia_knowledge_base USING gin (to_tsvector('portuguese'::regconfig, content));


--
-- Name: idx_sofia_knowledge_keywords; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sofia_knowledge_keywords ON public.sofia_knowledge_base USING gin (keywords);


--
-- Name: idx_valuation_characteristics_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valuation_characteristics_category ON public.valuation_characteristics USING btree (category, is_active);


--
-- Name: idx_valuation_responses_valuation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valuation_responses_valuation ON public.valuation_responses USING btree (valuation_id);


--
-- Name: idx_valuation_tipo_imovel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valuation_tipo_imovel ON public.ia_valuation_weights USING btree (tipo_imovel);


--
-- Name: idx_valuation_variavel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valuation_variavel ON public.ia_valuation_weights USING btree (nome_variavel);


--
-- Name: idx_valuations_logradouro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valuations_logradouro ON public.valuations USING btree (logradouro);


--
-- Name: idx_valuations_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_valuations_user_date ON public.valuations USING btree (user_id, created_at DESC);


--
-- Name: ia_valuation_weights update_ia_valuation_weights_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ia_valuation_weights_updated_at BEFORE UPDATE ON public.ia_valuation_weights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: itbi_transactions update_itbi_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_itbi_transactions_updated_at BEFORE UPDATE ON public.itbi_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leads update_leads_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sofia_knowledge_base update_sofia_knowledge_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sofia_knowledge_updated_at BEFORE UPDATE ON public.sofia_knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: valuation_characteristics update_valuation_characteristics_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_valuation_characteristics_updated_at BEFORE UPDATE ON public.valuation_characteristics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: valuations update_valuations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_valuations_updated_at BEFORE UPDATE ON public.valuations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: valuation_responses valuation_responses_characteristic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valuation_responses
    ADD CONSTRAINT valuation_responses_characteristic_id_fkey FOREIGN KEY (characteristic_id) REFERENCES public.valuation_characteristics(id);


--
-- Name: valuation_responses valuation_responses_valuation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valuation_responses
    ADD CONSTRAINT valuation_responses_valuation_id_fkey FOREIGN KEY (valuation_id) REFERENCES public.valuations(id) ON DELETE CASCADE;


--
-- Name: valuations valuations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.valuations
    ADD CONSTRAINT valuations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: sofia_knowledge_base Acesso público para leitura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Acesso público para leitura" ON public.sofia_knowledge_base FOR SELECT USING ((is_active = true));


--
-- Name: valuation_characteristics Acesso público para visualização de características; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Acesso público para visualização de características" ON public.valuation_characteristics FOR SELECT TO anon USING (true);


--
-- Name: condominios_mapeamento Acesso público para visualização de condomínios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Acesso público para visualização de condomínios" ON public.condominios_mapeamento FOR SELECT TO anon USING (true);


--
-- Name: valuation_documentation_factors Acesso público para visualização de fatores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Acesso público para visualização de fatores" ON public.valuation_documentation_factors FOR SELECT TO anon USING (true);


--
-- Name: ia_valuation_weights Acesso público para visualização de pesos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Acesso público para visualização de pesos" ON public.ia_valuation_weights FOR SELECT TO anon USING (true);


--
-- Name: itbi_transactions Acesso público para visualização de transações ITBI; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Acesso público para visualização de transações ITBI" ON public.itbi_transactions FOR SELECT TO anon USING (true);


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins podem gerenciar leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar leads" ON public.leads USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: leads Admins podem visualizar todos os leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem visualizar todos os leads" ON public.leads FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: valuation_characteristics Apenas admins podem gerenciar características; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas admins podem gerenciar características" ON public.valuation_characteristics USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: condominios_mapeamento Apenas admins podem gerenciar condomínios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas admins podem gerenciar condomínios" ON public.condominios_mapeamento TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: sofia_knowledge_base Apenas admins podem gerenciar conhecimento; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas admins podem gerenciar conhecimento" ON public.sofia_knowledge_base USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: valuation_documentation_factors Apenas admins podem gerenciar fatores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas admins podem gerenciar fatores" ON public.valuation_documentation_factors USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ia_valuation_weights Apenas admins podem gerenciar pesos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas admins podem gerenciar pesos" ON public.ia_valuation_weights TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: itbi_transactions Apenas sistema pode inserir transações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apenas sistema pode inserir transações" ON public.itbi_transactions FOR INSERT TO authenticated WITH CHECK (false);


--
-- Name: leads Permitir cadastro público de leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir cadastro público de leads" ON public.leads FOR INSERT TO anon WITH CHECK (true);


--
-- Name: leads Qualquer pessoa pode se cadastrar como lead; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Qualquer pessoa pode se cadastrar como lead" ON public.leads FOR INSERT WITH CHECK (true);


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: valuation_characteristics Usuários autenticados podem visualizar características; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem visualizar características" ON public.valuation_characteristics FOR SELECT USING (true);


--
-- Name: condominios_mapeamento Usuários autenticados podem visualizar condomínios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem visualizar condomínios" ON public.condominios_mapeamento FOR SELECT TO authenticated USING (true);


--
-- Name: valuation_documentation_factors Usuários autenticados podem visualizar fatores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem visualizar fatores" ON public.valuation_documentation_factors FOR SELECT USING (true);


--
-- Name: ia_valuation_weights Usuários autenticados podem visualizar pesos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem visualizar pesos" ON public.ia_valuation_weights FOR SELECT TO authenticated USING (true);


--
-- Name: itbi_transactions Usuários autenticados podem visualizar transações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários autenticados podem visualizar transações" ON public.itbi_transactions FOR SELECT TO authenticated USING (true);


--
-- Name: valuations Usuários podem atualizar suas avaliações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem atualizar suas avaliações" ON public.valuations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: valuations Usuários podem criar avaliações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem criar avaliações" ON public.valuations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: valuation_responses Usuários podem criar respostas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem criar respostas" ON public.valuation_responses FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.valuations v
  WHERE ((v.id = valuation_responses.valuation_id) AND (v.user_id = auth.uid())))));


--
-- Name: valuations Usuários podem deletar suas avaliações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem deletar suas avaliações" ON public.valuations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: valuation_responses Usuários podem ver respostas de suas avaliações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver respostas de suas avaliações" ON public.valuation_responses FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.valuations v
  WHERE ((v.id = valuation_responses.valuation_id) AND (v.user_id = auth.uid())))));


--
-- Name: valuations Usuários podem ver suas avaliações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver suas avaliações" ON public.valuations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: condominios_mapeamento; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.condominios_mapeamento ENABLE ROW LEVEL SECURITY;

--
-- Name: ia_valuation_weights; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ia_valuation_weights ENABLE ROW LEVEL SECURITY;

--
-- Name: itbi_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itbi_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: sofia_knowledge_base; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sofia_knowledge_base ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: valuation_characteristics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.valuation_characteristics ENABLE ROW LEVEL SECURITY;

--
-- Name: valuation_documentation_factors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.valuation_documentation_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: valuation_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.valuation_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: valuations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


