# Segurança

Autenticação e Autorização:
- NextAuth.js v5 (beta): Credentials + Google OAuth (`allowDangerousEmailAccountLinking`,
  seguro pois o Google verifica e-mail).
- Senhas: `argon2id`.
- Middleware (`src/middleware.ts`) protege `/dashboard`, `/weddings`, `/settings`
  e redireciona para `/login`. Rotas públicas (`/rsvp`, `/api/rsvp`, `/api/stripe/webhook`)
  ficam fora do matcher por design.
- Isolamento multi-tenant: acesso a `Wedding` exige membership no Workspace dono
  (`assertWeddingAccess`). Criação/listagem escopadas por `getActiveWorkspaceId` /
  `workspace.memberships.some(userId)`.

Superfícies sensíveis novas:
- `POST /api/stripe/webhook`: assinatura verificada via `constructEvent` sobre o
  raw body; 400 se ausente/ inválida. Idempotência por `ProcessedStripeEvent.id`
  (dedupe insert-first; lock removido em erro de handler para permitir retry).
- `GET|PATCH /api/rsvp/[token]`: público, mas estritamente escopado pelo token do
  convidado. Resposta limita-se ao próprio convidado e ao título/data do casamento;
  nenhum dado de outro tenant é exposto. `PATCH` valida payload com Zod.
- `POST /api/stripe/checkout`: autenticado; opera só sobre o workspace ativo.

Vulnerabilidades e Riscos (OWASP):

| Severidade | Arquivo | Risco | Correção |
|------------|---------|-------|----------|
| Média | `next.config.ts` | Faltam headers (CSP, X-Frame-Options) | Inserir `headers()` no config. |
| Baixa | `package.json` | NextAuth Beta em uso | Monitorar release estável. |
| Baixa | `src/app/api/rsvp` | Token de RSVP sem rate limit | Adicionar rate limiting nas rotas públicas. |
| Resolvida | `src/app/api/stripe/webhook` | Replays de webhook | Idempotência por `event.id` implementada. |

Segredos e Dados:
- Segredos em `.env` (não versionado); `.env.example` documenta as chaves por etapa
  (Postgres, Google OAuth, Stripe).
- `DATABASE_URL` aponta para PostgreSQL; sem credenciais hardcoded no código.
- Lockfile (`package-lock.json`) ativo.
