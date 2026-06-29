# Vendas

Sistema de controle de pedidos e pagamentos por cliente, com ciclos de
faturamento quinzenais. Originalmente construído para um único cliente
("Roli"), hoje aceita qualquer número de clientes cadastrados.

**Stack:** Next.js 14 · Neon (PostgreSQL) · Vercel · Tailwind CSS

**Repositório atual:** `github.com/gnscozziero-lang/roli-vendas` — o slug
do repositório ainda é `roli-vendas` por continuidade (não foi renomeado);
o produto em si chama-se apenas **Vendas**.

---

## Funcionalidades

- **Dashboard** — saldo total em aberto, próximo vencimento e ciclos em aberto, com filtro por cliente
- **Clientes** — cadastro, renomeação e ativação/inativação
- **Pedidos** — registro por cliente, com seleção de itens/quantidades; vencimento calculado automaticamente
- **Pagamentos** — registro por cliente, com abatimento automático do ciclo mais antigo primeiro
- **Itens** — catálogo com edição inline de preços
- **Relatórios** — extratos em PDF por ciclo de vencimento (via `window.print()`)
- **Importar** — importação única de histórico via `seed_data.json` (etapa já executada em produção)

### Regra de vencimento

| Data da compra       | Vencimento          |
|----------------------|---------------------|
| Dias 1–15 do mês M   | Dia 30 do mês M     |
| Dias 16–31 do mês M  | Dia 30 do mês M+1   |

Pagamentos abatem o ciclo mais antigo primeiro. Cada pagamento pode levar
um `due_date_ref` apontando para o ciclo a que realmente se refere,
independente da data em que foi efetivamente pago.

---

## Passo a passo de deploy (Neon + GitHub + Vercel)

### 1. Neon — banco de dados gratuito

1. Acesse [neon.tech](https://neon.tech) → **Sign up** (gratuito)
2. Clique em **New Project** → dê um nome
3. Em **Connection Details**, copie a **Connection string** (formato `postgresql://...`)
4. No painel, clique em **SQL Editor** → cole e execute o conteúdo de `supabase/schema.sql`
   (idempotente — seguro de rodar de novo em uma base que já tem as tabelas)

### 2. GitHub — hospedar o código

```bash
git init
git add .
git commit -m "inicial"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

### 3. Vercel — deploy automático

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o repositório do GitHub
3. Em **Environment Variables**, adicione **apenas uma variável**:
   ```
   DATABASE_URL = postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```
4. Clique em **Deploy** — aguarde ~2 minutos

### 4. Importação histórica (já realizada nesta instância)

Esta etapa já foi executada em produção e não precisa ser repetida. Para
referência, em uma instalação nova:

1. Acesse `https://sua-url.vercel.app/importar`
2. Selecione o arquivo `seed_data.json`
3. Clique em **Importar**

> ⚠️ Importe **apenas uma vez**. Para reimportar do zero, limpe as tabelas:
> ```sql
> TRUNCATE orders, payments, items, settings, clients RESTART IDENTITY CASCADE;
> ```

---

## Desenvolvimento local

```bash
npm install
cp .env.local.example .env.local
# Edite .env.local com sua DATABASE_URL do Neon
npm run dev
# Acesse http://localhost:3000
```

---

## Estrutura

```
src/
├── app/
│   ├── page.tsx              Dashboard (+ DashboardClient.tsx)
│   ├── clientes/             Cadastro de clientes
│   ├── pedidos/              Gestão de pedidos (NovoPedidoForm, EditOrderModal, EditarPedidoForm)
│   ├── pagamentos/           Gestão de pagamentos
│   ├── itens/                Catálogo de itens
│   ├── relatorios/           Extratos em PDF
│   ├── importar/             Importação do histórico
│   └── api/                  Rotas para dados de pedidos/relatórios
└── lib/
    ├── db.ts                 Cliente Neon
    ├── billing.ts            Lógica de vencimentos e saldos
    └── actions.ts            Server Actions (CRUD de clients, items, orders, payments)

supabase/schema.sql            DDL PostgreSQL (funciona no Neon)
seed_data.json                 Histórico exportado da planilha original
```
