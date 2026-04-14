-- ============================================================
-- ROLI VENDAS — Schema Supabase
-- Execute no SQL Editor do painel Supabase
-- ============================================================

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------
-- Configurações gerais (saldo inicial, etc.)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
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
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_order_date_idx ON orders(order_date);
CREATE INDEX IF NOT EXISTS orders_due_date_idx   ON orders(due_date);

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
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_payment_date_idx ON payments(payment_date);

-- --------------------------------------------------------
-- Row Level Security (desabilitar para uso pessoal simples)
-- Se quiser autenticação, habilite e configure policies.
-- --------------------------------------------------------
ALTER TABLE settings   DISABLE ROW LEVEL SECURITY;
ALTER TABLE items      DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders     DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments   DISABLE ROW LEVEL SECURITY;
