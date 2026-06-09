# 🔍 Auditoria Estratégica — Atelier do Sim

> **Data:** 09/06/2026 · **Escopo:** Arquitetura, UX/UI e Estratégia de Produto (tiers Free / Pro / Gestor)
> **Postura:** Tech Lead / Product Manager · **Personas:** typescript-pro · backend-patterns · react-expert · frontend-design
> **Stack auditada:** Next.js 15 (App Router) · React 19 · Prisma 6 + PostgreSQL (Neon) · NextAuth v5 · Stripe · TanStack Query v5 · Tailwind + Radix/shadcn

---

## Sumário Executivo

| Pilar | Nota | Veredito |
|---|---|---|
| Segurança & Auth | 8.5/10 | NextAuth v5 + 2FA TOTP + Argon2id + rate limit tiered. Sólido, com 2 riscos pontuais de alta prioridade. |
| Modelo de Dados (Prisma) | 8/10 | Multi-tenancy correta, FKs indexadas, dinheiro em centavos (`Int`). Enums como `String` e tokens OAuth em claro são as dívidas. |
| Arquitetura Next.js | 6/10 | App Router presente, mas subutilizado: 49 client components, zero Server Actions, zero cache, sem `error.tsx`/`loading.tsx`. |
| UX/UI | 8.5/10 | Design coeso (tema dourado), skeletons, empty states, paywall bem desenhado. Lacunas em confirmações, toasts e mobile. |
| Prontidão SaaS (monetização) | 7/10 | Gating server-side correto. Faltam "iscas" no Free e o tier Gestor entrega pouco valor real (analytics mockado). |

**Top 5 riscos/ações prioritárias:**

1. 🔴 **Webhook Stripe confia na `metadata.plan` sem validar o `priceId`** — risco direto de receita.
2. 🔴 **Tokens OAuth (`Account.access_token`/`refresh_token`) em texto claro no banco.**
3. 🟠 **`/api/auth/reset-password` sem rate limit** (única rota de auth desprotegida).
4. 🟠 **Soft delete sem job de expurgo** — `deleteRequestedAt` é marcado, mas nada efetiva a exclusão após 30 dias.
5. 🟠 **Analytics do tier Gestor exibe dados mockados** — quem paga R$ 80/mês vê dados falsos; risco de churn e de confiança.

---

## 1. Análise de Arquitetura — Dívidas Técnicas e Melhorias

### 1.1 Schema Prisma (`prisma/schema.prisma`)

#### ✅ O que está bem feito

| Item | Evidência |
|---|---|
| Multi-tenancy clara | `Wedding → Workspace → Membership → User`, com acesso sempre validado via membership |
| FKs todas indexadas | `@@index([weddingId])` em Guest, Table, Expense, Gift, Task, GuestRelationship; `@@index([workspaceId])` em Wedding/Membership |
| Dinheiro em centavos | `Expense.amount: Int`, `Gift.price: Int` + helpers `toCents/toReais/formatBRL` em `src/lib/money.ts` — evita erros de ponto flutuante |
| Constraints compostas | `Seat @@unique([tableId, number])`, `GuestRelationship @@unique([guestId, relatedId, type])`, `Membership @@unique([userId, workspaceId])` |
| RSVP anônimo seguro | `Guest.rsvpToken @unique @default(cuid())` — token não enumerável |
| Auditoria resiliente | `SystemLog.userId` **sem** FK, de propósito: a trilha sobrevive à anonimização LGPD |
| Idempotência Stripe | `ProcessedStripeEvent` com `id` = event.id da Stripe |
| Dual-URL Neon | `directUrl` + pooled (PgBouncer) — padrão correto para serverless |

#### ⚠️ Dívidas técnicas e melhorias

| # | Severidade | Achado | Recomendação |
|---|---|---|---|
| D1 | 🔴 Alta | `Account.access_token` / `refresh_token` armazenados em texto claro | Encriptar at-rest (libsodium/KMS) ou, como os tokens Google não são usados pós-login, simplesmente **não persistir** (`account()` callback filtrando os campos) |
| D2 | 🟠 Média | Enums modelados como `String` (`rsvpStatus`, `plan`, `role`, `status`, `category`, `type`) | Migrar para `enum` nativo do Postgres via Prisma — integridade no banco, não só no Zod; previne drift entre `src/lib/validation/enums.ts` e dados reais |
| D3 | 🟠 Média | `Workspace` sem soft delete; `onDelete: Cascade` em toda a árvore | Deletar um workspace destrói casamentos, convidados e histórico financeiro irreversivelmente. Adicionar `deletedAt` + janela de recuperação (mesmo padrão já usado em `User.deleteRequestedAt`) |
| D4 | 🟡 Baixa | `Guest.seatId` (`@unique`) sem `onDelete: SetNull` explícito | Explicitar comportamento ao deletar mesa/assento para não depender do default do Prisma |
| D5 | 🟡 Baixa | `ProcessedStripeEvent` sem campo de status/resultado | Em escala, adicionar `status` + `error` ajuda a depurar webhooks reprocessados |
| D6 | 🟡 Baixa | Falta índice em `Guest.rsvpStatus` e `Task.status` | Quando listas crescerem (300+ convidados), filtros por status farão scan; índice composto `@@index([weddingId, rsvpStatus])` resolve |

### 1.2 API Routes — Segurança e Padrões (36 rotas em `src/app/api/`)

#### ✅ Padrão consistente e correto

Todas as rotas autenticadas seguem o mesmo pipeline, centralizado em `src/lib/auth/guards.ts`:

```ts
const userId = await requireUserId();              // 401 se sem sessão
await assertWeddingAccess(weddingId, userId);      // 404/403 multi-tenant
await requirePremiumWeddingFeature(weddingId);     // 403 paywall server-side
// ... Zod valida input, try/catch com errorResponse(e)
```

- **Try/catch:** presente e padronizado via `AuthError` + `errorResponse` — retorno consistente de `401/403/404/429`.
- **Validação:** Zod em todos os inputs de escrita (`src/lib/validation/schemas.ts`), incluindo sanitização de e-mail (`trim().toLowerCase()`), honeypot anti-bot no registro e dinheiro como `int().nonnegative()`.
- **Anti-enumeração:** `forgot-password` retorna 200 mesmo para e-mail inexistente; senha verificada **antes** de `isBlocked` (evita timing oracle).
- **Rate limit:** Upstash sliding window — `authLimiter` (5/60s) no login/registro, `publicLimiter` (10/10s) no RSVP/presentes públicos, tiered por plano em rotas pesadas (`/api/user/extract`). Degradação graciosa sem Redis (dev/CI).
- **Paywall server-side:** Gifts e Tables bloqueados na API, não só na UI. Limites de casamentos/membros validados no POST.

#### 🔴 Achados de segurança (corrigir antes de escalar)

| # | Severidade | Onde | Problema | Correção |
|---|---|---|---|---|
| S1 | 🔴 Alta | `src/app/api/stripe/webhook/route.ts` | `plan = s.metadata?.plan` é confiado sem verificar o `priceId` pago. Um checkout manipulado pode gravar `gestor` pagando preço de `pro` | Derivar o plano do `line_items[0].price.id` contra `STRIPE_PRICE_BY_PLAN` (`src/lib/stripe.ts`) e rejeitar divergência |
| S2 | 🟠 Média | `src/app/api/stripe/checkout/route.ts` | Race condition: requisições simultâneas sem `stripeCustomerId` criam múltiplos customers no Stripe | `idempotencyKey` na chamada Stripe + update condicional (`where: { id, stripeCustomerId: null }`) |
| S3 | 🟠 Média | `src/app/api/auth/reset-password/route.ts` | Única rota de auth **sem** rate limit (brute force no token, ainda que UUID) | Aplicar `authLimiter` como nas rotas irmãs |
| S4 | 🟠 Média | `src/lib/auth/soft-delete.ts` | `deleteRequestedAt` marcado, avaliação lazy no login — mas não há job que efetive a exclusão de quem nunca mais loga | Cron (Vercel Cron / `app/api/cron/purge`) que expurga contas com `deleteRequestedAt < now() - 30d` |
| S5 | 🟡 Baixa | `src/app/api/user/2fa/route.ts` | 2FA sem backup codes — perda do authenticator depende da senha para recuperar | Gerar 8–10 códigos de uso único no setup |

### 1.3 Arquitetura Next.js (`src/app`) — o maior gap técnico

O projeto usa App Router, mas opera como uma SPA: **apenas 4 Server Components** (layouts de validação) contra **49 Client Components**, todos buscando dados via React Query → API routes próprias → Prisma. Server Actions estão habilitadas no `next.config.ts` e **nunca usadas**.

| # | Achado | Impacto | Melhoria |
|---|---|---|---|
| N1 | ❌ Nenhum `error.tsx`, `loading.tsx` ou `not-found.tsx` em nível algum | Erro não tratado = tela branca; navegação sem feedback nativo | Adicionar no root e no grupo `(app)` — esforço de minutos, ganho imediato de resiliência |
| N2 | Landing (`/`), `/pricing`, `/terms`, `/privacy` renderizam dinamicamente a cada request | Custo serverless e TTFB desnecessários em páginas estáticas | `export const revalidate = 3600` (ou full static) |
| N3 | Dupla viagem de dados: página client → `/api/weddings` → Prisma | Latência extra + payload duplicado em toda navegação | Buscar dados iniciais no Server Component e hidratar o React Query (`HydrationBoundary` + `initialData`) — mantém a UX otimista atual sem o round-trip inicial |
| N4 | Zero uso de `revalidateTag`/`unstable_cache` | Layout `weddings/[id]` refaz a query de acesso a cada navegação interna | `cache()` por request + `revalidateTag('wedding:{id}')` nas mutações |
| N5 | Middleware não valida `systemRole` para `/admin` (delegado ao layout) | Defesa em camada única no edge | Aceitável, mas documentar a decisão; o layout valida via DB, o que é correto |

### 1.4 Duplicação e reaproveitamento

O mesmo trio `useQuery + useMutation + invalidateQueries` está copiado em ~49 componentes, e o gating de plano (`useActivePlan()` → `isPremium` → `<Paywall/>`) se repete por página.

**Recomendações de refactor (baixo risco, alto retorno):**

1. **Factory de CRUD hooks** — `createCrudHooks<T>("guests", (id) => `/api/weddings/${id}/guests`)` gerando `useList/useCreate/useUpdate/useDelete` com invalidação padronizada. Elimina ~60% do boilerplate das páginas.
2. **`<PremiumGate feature="tables">`** — componente único que encapsula `useActivePlan` + `<Paywall>` (hoje cada página reimplementa o branch `isPremium === false`).
3. **`getAuthenticatedUser()` cacheado com `React.cache()`** — a checagem `await auth(); if (!session) redirect("/login")` está repetida em 4 layouts/páginas.
4. **Tipos de resposta compartilhados** — as rotas retornam `Response.json(data)` sem contrato tipado consumível; extrair tipos de `prisma` + Zod (`z.infer`) para um `src/types/api.ts` consumido por ambos os lados, eliminando os `useQuery<Wedding[]>` declarados à mão no client.

---

## 2. Análise de UX/UI

### 2.1 Pontos fortes (manter e proteger)

- **Identidade visual coesa:** paleta ouro (#D4AF37) + verde (#10B981) + slate, Playfair Display para títulos, Inter para corpo — adequada ao nicho de casamentos sem ser piegas.
- **Feedback de carregamento:** skeletons com shimmer em todas as listas; `Loader2` em botões durante submissão; `isPremium === null` evita "flash de paywall".
- **Empty states com CTA:** lista de convidados vazia ("👋 Sua lista está vazia" + botão), tarefas, presentes — todos orientam a próxima ação.
- **Optimistic updates** corretos em tasks (com rollback via `onError` + snapshot) — padrão avançado bem executado.
- **Acessibilidade básica sólida:** labels associadas, `aria-invalid`, `role="alert"`, `aria-label` em botões icon-only, focus trap nos Dialogs (Radix), focus-ring visível.
- **Paywall bem desenhado:** lock icon, badge "PRO", 3 benefícios com check, CTA — vende, não só bloqueia.

### 2.2 Lacunas e correções recomendadas

| # | Severidade | Achado | Recomendação |
|---|---|---|---|
| U1 | 🔴 Alta | **Exclusões destrutivas sem confirmação**: convidados, presentes e tarefas deletam no clique; mesas usam `window.confirm` nativo (quebra a identidade visual) | `<ConfirmDialog>` reutilizável (Radix AlertDialog) para toda ação destrutiva |
| U2 | 🔴 Alta | **Analytics (Gestor) com dados mockados** (`weddings/[id]/analytics`) | Ou substituir pelos dados reais (RSVP/despesas já existem no banco) ou rotular explicitamente como "preview" — cliente pagante vendo dado falso é o caminho mais curto para churn |
| U3 | 🟠 Média | Toasts implementados manualmente (`useState` + `setTimeout`) espalhados pelas páginas | Adotar `sonner`: 1 provider, API única, fila, acessível (`role="status"`) e elimina código repetido |
| U4 | 🟠 Média | Tabelas em mobile dependem só de `overflow-x-auto` (convidados com 6 colunas) | Padrão responsivo: tabela em `md:+`, cards empilhados em mobile |
| U5 | 🟠 Média | Sem onboarding estruturado — usuário novo vê dashboard vazio + Help FAB | Ver §2.3 |
| U6 | 🟡 Baixa | Sem `prefers-reduced-motion` (shimmer, fade-ups, hover lifts sempre ativos) | `motion-reduce:` do Tailwind nas animações customizadas |
| U7 | 🟡 Baixa | Dialogs sem `max-w` confortável em telas pequenas | `max-w-[calc(100vw-2rem)] sm:max-w-lg` no `dialog.tsx` |
| U8 | 🟡 Baixa | Kanban de tarefas e seating drag-drop sem navegação por teclado | `@dnd-kit` tem suporte a keyboard sensors — ativar é configuração, não reescrita |

### 2.3 Redução de atrito do usuário logado (onboarding)

O fluxo atual (registro → dashboard vazio → "Novo Casamento") funciona, mas perde o momento de maior motivação do usuário. Proposta em 3 camadas, da mais barata à mais completa:

1. **Setup Checklist no dashboard** (esforço: baixo) — card persistente "Comece por aqui" com 4 passos e progresso: ① criar casamento → ② adicionar 5 convidados → ③ definir orçamento → ④ criar primeira tarefa. Cada passo é um deep-link. Reaproveita `Card`, `Badge` e os dados que o dashboard já busca. Dismissível ao completar.
2. **Wizard de primeiro casamento** (esforço: médio) — ao invés do dialog atual com 4 campos secos, um stepper de 3 telas (nomes do casal → data e cidade → orçamento estimado) que já semeia o checklist com um **template de tarefas por antecedência** ("12 meses antes: reservar espaço…"). Transforma o primeiro login em valor imediato.
3. **Aha-moment guiado** (esforço: médio) — após criar o casamento, CTA único: "Adicione seus 3 primeiros convidados e veja o link RSVP mágico deles". O link RSVP público é a feature mais demonstrável do produto — usá-la como gancho de retenção do dia 1.

---

## 3. Roadmap de Produto por Tier

> Princípio adotado: **Free engaja e esbarra em limites visíveis · Pro resolve o casamento de ponta a ponta · Gestor transforma a ferramenta em negócio**. Tudo abaixo foi pensado sobre os models já existentes (`Guest.rsvpToken`, `Expense`, `Gift.pixKey`, `Table/Seat`, `Task`, `GuestRelationship`, `Workspace/Membership`, `SystemLog`) para minimizar custo de schema.

### 3.1 🆓 Free — Iscas de Conversão

| Funcionalidade | Mecânica de conversão | Esforço |
|---|---|---|
| **Limite de convidados com contador visual** (ex.: 50) | Barra "37/50 convidados" no topo da lista, que muda para âmbar aos 80% e exibe CTA "Convidados ilimitados no Pro" ao encher. Limite hoje não existe — é a isca mais barata e mais eficaz do nicho | Baixo |
| **Métricas borradas no relatório** | `/reports` renderiza os gráficos reais com `blur-sm` + overlay "Desbloqueie no Pro" — o usuário **vê que o dado existe** (muito mais persuasivo que esconder) | Baixo |
| **Marca d'água nas páginas públicas** | RSVP (`/rsvp/[token]`) e presentes (`/gift/[weddingId]`) com footer "Feito com Atelier do Sim" — vira canal de aquisição viral (cada convidado é um lead); Pro remove | Baixo |
| **Checklist com template básico (20 tarefas)** | Pro libera templates completos (80+ tarefas por estilo de casamento) — teaser visível: "+ 63 tarefas no Pro" | Médio |
| **1 lembrete de RSVP manual** | Botão "Reenviar convite" funciona 1× por convidado; Pro automatiza (ver 3.2) | Baixo |

### 3.2 💍 Pro — O Noivo / A Noiva (R$ 40/mês)

| Funcionalidade | Valor entregue | Esforço |
|---|---|---|
| **RSVP com QR Code + check-in no dia** | Cada `rsvpToken` já é único — gerar QR (a lib `qrcode.react` já está no projeto via PIX) e adicionar tela de check-in (scan → marca presença). Resolve a dor real da recepção | Médio |
| **Convite digital personalizável** | Página pública do casal (foto, texto, mapa, link RSVP) — evolução natural de `/rsvp/[token]` e `/gift/[weddingId]` que já existem. Campo novo: `Wedding.coverImageUrl`, `Wedding.message` | Médio |
| **Lembretes automáticos** | Resend já está integrado: e-mail automático para RSVP pendente (D-30/D-14) e para `Expense.dueDate` próximo. Requer apenas 1 cron + templates | Médio |
| **Checklist inteligente por data** | Templates por estilo + tarefas geradas relativas à `Wedding.date` ("contratar fotógrafo: 8 meses antes"), com re-priorização se a data mudar | Médio |
| **Financeiro interativo** | Evolução do `/budget` atual: simulador "e se" (arrastar categoria e ver impacto), alerta de estouro por categoria, parcelas em `Expense` (`installments`) | Médio |
| **Página de presentes premium** | Já existe com PIX + QR — adicionar: confirmação de quem presenteou (campo `Gift.purchasedBy`), mensagem do convidado e agradecimento automático por e-mail | Baixo |
| **Exportação de lista de convidados estilizada (PDF)** | O CSV já existe em `/reports` — PDF bonito para buffet/cerimonialista é valor percebido alto e custo baixo (`@react-pdf/renderer`) | Baixo |

### 3.3 🏢 Gestor — O Assessor / Cerimonialista (R$ 80/mês)

| Funcionalidade | Valor B2B | Esforço |
|---|---|---|
| **Dashboard de carteira (multi-casamento)** | Visão consolidada dos 5 casamentos: próximos eventos, RSVPs pendentes agregados, vencimentos da semana em todos os clientes. Os dados já existem — é uma query agregada + página nova | Médio |
| **CRM de fornecedores** | Novo model `Vendor` (nome, categoria, contato, contratos, avaliação) vinculável a `Expense` — o cerimonialista reusa seus fornecedores entre casamentos do workspace. É a feature âncora do tier | Alto |
| **Relatórios exportáveis PDF/Excel com logo do assessor** | Evolução do `/reports`: white-label (logo + cores do cerimonialista) — material que ele apresenta ao cliente final. Diferencial de venda B2B2C | Médio |
| **Log de atividades da equipe** | `SystemLog` já registra eventos — expor versão filtrada por workspace ("Maria confirmou 12 convidados ontem") para o dono acompanhar a equipe. Requer adicionar `workspaceId` ao log | Baixo |
| **Permissões granulares por membro** | `Membership.role` já existe (owner/admin/member) — efetivar: member só edita casamentos atribuídos (nova tabela `WeddingAssignment`) | Médio |
| **Analytics real (substituir o mock)** | Engajamento RSVP por semana, curva de gastos previsto×realizado — os dados estão todos no banco; o mock atual em `/analytics` é dívida de confiança (ver U2) | Médio |
| **Portal do cliente (B2B2C)** | Link read-only para os noivos acompanharem o que o assessor gerencia — fideliza o cliente final ao produto e cria pressão de upgrade reversa | Alto |

### 3.4 Sequenciamento sugerido (próximos 2 trimestres)

```
T1  ████ Free: contador de convidados + métricas borradas + marca d'água   (conversão)
    ████ Pro: lembretes automáticos + QR check-in                          (retenção)
    ██   Correções S1–S4 (Stripe/segurança)                                (fundação)
T2  ████ Gestor: dashboard de carteira + analytics real + log de equipe    (ARPU)
    ████ Pro: convite digital + checklist inteligente                      (aquisição)
    ██   Refactors N1–N3 + factory de hooks                                (velocidade)
```

---

## 4. ⚡ Quick Wins — 3 implementações de <1h com maior impacto

### QW1 — Validar `priceId` no webhook Stripe (🔴 segurança de receita)

**Arquivo:** `src/app/api/stripe/webhook/route.ts`
Hoje o plano gravado no workspace vem de `session.metadata.plan`, controlável no momento da criação do checkout. Correção (~15 linhas): expandir `line_items` no evento `checkout.session.completed`, mapear `price.id → plano` usando o `STRIPE_PRICE_BY_PLAN` já existente em `src/lib/stripe.ts`, e só então gravar. Divergência → log + 400.
**Impacto:** elimina o vetor de upgrade não pago; protege o faturamento.

### QW2 — `error.tsx` + `loading.tsx` no grupo `(app)` (🛡️ resiliência percebida)

**Arquivos novos:** `src/app/(app)/error.tsx`, `src/app/(app)/loading.tsx`, `src/app/not-found.tsx`
Hoje qualquer exceção não capturada gera tela branca. São 3 arquivos pequenos reutilizando `Card`, `Button` e o `Skeleton` existentes ("Algo deu errado" + retry via `reset()`; skeleton de página no loading; 404 com link para o dashboard).
**Impacto:** falhas viram experiências recuperáveis em todas as rotas autenticadas de uma vez.

### QW3 — Contador de limite de convidados no Free (💰 isca de conversão)

**Arquivos:** `src/lib/permissions.ts` (adicionar `guests: 50` ao `PLAN_LIMITS.free`), `src/app/api/weddings/[id]/guests/route.ts` (recusar POST acima do limite — 5 linhas no padrão `canCreateWedding` já existente) e a página de convidados (barra de progresso "37/50" + CTA ao atingir 80%).
A página já tem a lista carregada (`guests.length`) e o plano (`useActivePlan()`) — é composição de dados já presentes no client.
**Impacto:** cria o momento de upgrade mais natural do produto: a lista de convidados é a primeira coisa que todo casal preenche, e crescer além de 50 é praticamente garantido.

---

*Relatório gerado por auditoria automatizada de código — nenhuma alteração de código-fonte foi realizada nesta execução.*
