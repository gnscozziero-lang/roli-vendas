# Roli Vendas

Sistema de controle de pedidos e pagamentos com ciclos de faturamento quinzenais.
**Stack:** Next.js 14 · Neon (PostgreSQL) · Vercel · Tailwind CSS

---

## Funcionalidades

- **Dashboard** — saldo total em aberto, próximo vencimento, ciclos em aberto
- **Pedidos** — registro por data com seleção de itens/quantidades; vencimento calculado automaticamente
- **Pagamentos** — registro com abatimento automático do ciclo mais antigo primeiro
- **Itens** — catálogo com edição inline de preços
- **Importar** — importação única do histórico via `seed_data.json`

### Regra de vencimento

| Data da compra       | Vencimento          |
|----------------------|---------------------|
| Dias 1–15 do mês M   | Dia 30 do mês M     |
| Dias 16–31 do mês M  | Dia 30 do mês M+1   |

---

## Passo a passo de deploy (Neon + GitHub + Vercel)

### 1. Neon — banco de dados gratuito

1. Acesse [neon.tech](https://neon.tech) → **Sign up** (gratuito)
2. Clique em **New Project** → dê um nome (ex: `roli-vendas`)
3. Em **Connection Details**, copie a **Connection string** (formato `postgresql://...`)
4. No painel, clique em **SQL Editor** → cole e execute o conteúdo de `supabase/schema.sql`

### 2. GitHub — hospedar o código

```bash
# Dentro da pasta roli-vendas/
git init
git add .
git commit -m "inicial"
git remote add origin https://github.com/SEU_USUARIO/roli-vendas.git
git push -u origin main
```

### 3. Vercel — deploy automático

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o repositório `roli-vendas` do GitHub
3. Em **Environment Variables**, adicione **apenas uma variável**:
   ```
   DATABASE_URL = postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```
4. Clique em **Deploy** — aguarde ~2 minutos

### 4. Importar dados históricos

1. Acesse `https://sua-url.vercel.app/importar`
2. Selecione o arquivo `seed_data.json` (incluso no projeto)
3. Clique em **Importar**
4. Verifique o Dashboard — saldo esperado: **R$ 5.805,39**

> ⚠️ Importe **apenas uma vez**. Se precisar reimportar, limpe as tabelas:
> ```sql
> TRUNCATE orders, payments, items, settings RESTART IDENTITY CASCADE;
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
roli-vendas/
├── src/
│   ├── app/
│   │   ├── page.tsx            Dashboard
│   │   ├── pedidos/            Gestão de pedidos
│   │   ├── pagamentos/         Gestão de pagamentos
│   │   ├── itens/              Catálogo de itens
│   │   └── importar/           Importação do histórico
│   └── lib/
│       ├── db.ts               Cliente Neon
│       ├── billing.ts          Lógica de vencimentos e saldos
│       └── actions.ts          Server Actions (CRUD)
├── supabase/schema.sql         DDL PostgreSQL (funciona no Neon)
├── seed_data.json              Histórico exportado da planilha
└── README.md
```
