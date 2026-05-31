# Setup Local (SaaS)

Guia de inicialização com PostgreSQL, NextAuth e Stripe.

### 1. Dependências
```bash
npm install
```

### 2. Variáveis de Ambiente
Copiar template:
```bash
cp .env.example .env
```
Preencher `.env`. Gerar `AUTH_SECRET` com `openssl rand -base64 32`.

### 3. Banco de Dados (PostgreSQL)
Docker (local):
```bash
docker run --name casamento-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=casamento -p 5432:5432 -d postgres:16
```
Nuvem (Neon/Supabase): Atualizar `DATABASE_URL`.

Sincronizar schema Prisma:
```bash
npx prisma db push
```

### 4. Stripe (Billing)
Necessário Stripe CLI. Redirecionar webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copiar webhook secret gerado para `STRIPE_WEBHOOK_SECRET` no `.env`.

### 5. Execução
```bash
npm run dev
```
Acesso: `http://localhost:3000`.
