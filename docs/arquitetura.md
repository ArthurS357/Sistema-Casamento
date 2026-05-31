# Arquitetura

Stack Tecnológica:
- Linguagem: TypeScript 5.7
- Frontend: React 19 + Tailwind CSS 3.4
- Framework: Next.js 15.1.6 (App Router)
- Backend: Next.js API Routes / Server Actions + Node.js
- BD: PostgreSQL (Prisma ORM 6.2)
- Auth: NextAuth.js 5.0 (Auth.js) — Credentials + Google OAuth
- Pagamentos: Stripe (SDK 22, API 2026-05-27.dahlia)
- Tipografia: Inter (sans) + Playfair Display (display editorial)

Organização:
- `prisma/`: Schema do BD (PostgreSQL).
- `src/app/`: Rotas Next.js App Router.
- `src/app/api/`: Endpoints REST (weddings, auth, register, rsvp, stripe).
- `src/app/rsvp/[token]/`: Página pública de RSVP (sem auth).
- `src/components/`: Componentes UI (Radix UI, Lucide, Skeleton).
- `src/lib/`: Utils (db, auth, workspace, stripe, validation).

Cache e Estado:
- Cliente: TanStack React Query 5.64.
- Formulários: React Hook Form + Zod.
- Servidor: Server Components por padrão.

Modelagem (Prisma):
- `Workspace` 1:N `Membership` N:1 `User` (tenant ↔ usuários).
- `Workspace` 1:N `Wedding`; plano de assinatura e IDs Stripe no Workspace.
- `Wedding` 1:N `Guest`, `Table`, `Expense`, `GuestRelationship`.
- `Table` 1:N `Seat`; `Guest` 1:1 `Seat`.
- `Guest.rsvpToken` (único) habilita o RSVP público.
- `ProcessedStripeEvent` registra `event.id` para idempotência de webhooks.

Autorização:
- Funil único em `src/lib/auth/guards.ts`:
  - `requireUserId` → sessão; `assertWeddingAccess` → membership no workspace dono.
  - `getActiveWorkspaceId` resolve o workspace ativo do usuário.
- Provisionamento de tenant centralizado em `src/lib/workspace.ts`
  (`ensurePersonalWorkspace`, idempotente), usado por registro e por
  `events.createUser` do OAuth.

Monetização (Stripe):
- `POST /api/stripe/checkout`: cria/vincula customer e Checkout Session de
  assinatura, escopado ao workspace ativo.
- `POST /api/stripe/webhook`: verifica assinatura, sincroniza `Workspace.plan`
  em checkout/subscription, com trava de idempotência por `event.id`.
