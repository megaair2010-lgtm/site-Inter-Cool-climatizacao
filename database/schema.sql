-- Estrutura de dados do painel administrativo (PostgreSQL).
-- Espelha os tipos de src/types/index.ts. Rode uma vez no banco apontado por DATABASE_URL.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Status do funil de leads
CREATE TYPE lead_status AS ENUM (
  'novo', 'em_analise', 'orcamento_enviado', 'negociacao', 'agendado', 'concluido', 'cancelado'
);
CREATE TYPE client_type AS ENUM ('residencial', 'comercial', 'industrial', 'condominio');

-- Clientes (criados a partir de leads convertidos ou cadastrados no painel)
CREATE TABLE clients (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  phone        text NOT NULL,
  email        text,
  city         text,
  client_type  client_type NOT NULL,
  document     text,                         -- CPF/CNPJ só se necessário para faturamento
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Pedidos de orçamento (leads)
CREATE TABLE leads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid REFERENCES clients(id) ON DELETE SET NULL,
  name             text NOT NULL,
  phone            text NOT NULL,
  email            text,
  city             text NOT NULL,
  client_type      client_type NOT NULL,
  service          text NOT NULL,
  equipment_count  integer CHECK (equipment_count IS NULL OR equipment_count BETWEEN 0 AND 9999),
  equipment_brand  text,
  message          text,
  photos           text[] NOT NULL DEFAULT '{}',   -- URLs no storage privado
  status           lead_status NOT NULL DEFAULT 'novo',
  source           text NOT NULL DEFAULT 'site-form',
  consent_at       timestamptz NOT NULL DEFAULT now(), -- registro do aceite LGPD
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_status_idx ON leads (status, created_at DESC);

-- Histórico de mudanças de status / anotações da equipe
CREATE TABLE lead_events (
  id          bigserial PRIMARY KEY,
  lead_id     uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status      lead_status,
  note        text,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Conteúdo do site (editável pelo painel)
CREATE TABLE services (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  summary      text NOT NULL,
  body         text,
  icon         text,
  has_page     boolean NOT NULL DEFAULT false,
  sort_order   integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true
);

CREATE TABLE projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  category     text NOT NULL,              -- instalacoes | manutencao | vrf | comercial | residencial | industrial
  city         text,
  description  text,
  image_url    text,
  before_url   text,
  after_url    text,
  published    boolean NOT NULL DEFAULT false, -- publique só com autorização do cliente
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE testimonials (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  city         text,
  text         text NOT NULL,
  rating       smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  source_url   text,                       -- ex.: link da avaliação no Google
  authorized   boolean NOT NULL DEFAULT false, -- só exibir avaliações reais e autorizadas
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE faq (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question     text NOT NULL,
  answer       text NOT NULL,
  sort_order   integer NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true
);

CREATE TABLE cities_served (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  state        char(2) NOT NULL,
  active       boolean NOT NULL DEFAULT true,
  UNIQUE (name, state)
);

CREATE TABLE brands (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  logo_url     text,
  authorized   boolean NOT NULL DEFAULT false -- exibir somente com autorização
);

-- Configurações (chave/valor): COMPANY_NAME, COMPANY_PHONE, WHATSAPP_NUMBER, COMPANY_EMAIL,
-- COMPANY_ADDRESS, COMPANY_CITY, COMPANY_REGION, INSTAGRAM_URL, FACEBOOK_URL, LINKEDIN_URL,
-- GOOGLE_MAPS_URL, BUSINESS_HOURS. Nunca guarde senhas ou chaves de API aqui.
CREATE TABLE settings (
  key          text PRIMARY KEY,
  value        text NOT NULL DEFAULT '',
  updated_at   timestamptz NOT NULL DEFAULT now()
);
