# Arquitetura

Stack Tecnológica:
- Linguagem: TypeScript 5.7.3
- Frontend: React 19 + Tailwind CSS 3.4
- Framework: Next.js 15.1.6 (App Router)
- Backend: Next.js API Routes / Server Actions + Node.js
- BD: SQLite (Prisma ORM 6.2)
- Auth: NextAuth.js 5.0 (Auth.js)

Organização:
- `prisma/`: Schema do BD e arquivo SQLite.
- `src/app/`: Rotas Next.js App Router.
- `src/app/api/`: Endpoints REST.
- `src/components/`: Componentes UI (Radix UI, Lucide).
- `src/lib/`: Utils (db.ts, auth, validation).
- `src/types/`: Tipagens.

Cache e Estado:
- Cliente: TanStack React Query 5.64.
- Formulários: React Hook Form + Zod.
- Servidor: Server Components por padrão.

Modelagem (Prisma):
- `User` 1:N `Wedding`.
- `Wedding` 1:N `Guest`, `Table`, `Expense`, `GuestRelationship`.
- `Table` 1:N `Seat`.
- `Guest` 1:1 `Seat`.
