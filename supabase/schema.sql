-- ============================================================
-- VENDAS — Schema PostgreSQL (Neon)
-- Execute no SQL Editor do painel Neon (ou Supabase, se aplicável)
--
-- Reconstruído a partir das queries usadas em src/lib/actions.ts e
-- nas páginas Server Component em 2026-06-29. As tabelas/colunas
-- abaixo já existem na base de produção (foram criadas via ALTER
-- manual no console do Neon, sem migração registrada). Este arquivo
-- foi atualizado para refletir isso e ficar seguro de re-executar
-- (idempotente). Tipos e constraints de "clients" não foram
-- confirmados diretamente no banco (sem acesso à DATABASE_URL) —
-- conferir manualmente antes de assumir como definitivo.
-- ============================================================

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------
-- Configurações gerais (saldo inicial global e por cliente)
-- Chaves no padrão: 'initial_balance' (global) e
-- 'initial_balance_<NOME_CLIENTE>' (por cliente)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- Clientes
-- Adicionada quando o sistema deixou de ser mono-cliente (Roli)
-- e passou a aceitar qualquer cliente. Orders e payments
-- referenciam o cliente pelo nome (TEXT), não por client_id.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- Catálogo de itens
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS items_name_idx ON items(name);

-- --------------------------------------------------------
-- Pedidos (cabeçalho)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_date   DATE NOT NULL,
  due_date     DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  description  TEXT DEFAULT '',
  imported     BOOLEAN DEFAULT false,
  client       TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Coluna adicionada manualmente em produção após a criação inicial
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS orders_order_date_idx ON orders(order_date);
CREATE INDEX IF NOT EXISTS orders_due_date_idx   ON orders(due_date);
CREATE INDEX IF NOT EXISTS orders_client_idx     ON orders(client);

-- --------------------------------------------------------
-- Itens do pedido (linhas)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id     UUID REFERENCES items(id),
  item_name   TEXT NOT NULL,
  quantity    DECIMAL(10,3) NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);

-- --------------------------------------------------------
-- Pagamentos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_date DATE NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  notes        TEXT DEFAULT '',
  imported     BOOLEAN DEFAULT false,
  due_date_ref DATE,
  client       TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Colunas adicionadas manualmente em produção após a criação inicial
ALTER TABLE payments ADD COLUMN IF NOT EXISTS due_date_ref DATE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS payments_payment_date_idx ON payments(payment_date);
CREATE INDEX IF NOT EXISTS payments_client_idx        ON payments(client);

-- --------------------------------------------------------
-- Row Level Security (desabilitar para uso pessoal simples)
-- Se quiser autenticação, habilite e configure policies.
-- --------------------------------------------------------
ALTER TABLE settings    DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients     DISABLE ROW LEVEL SECURITY;
ALTER TABLE items       DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders      DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments    DISABLE ROW LEVEL SECURITY;
