import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

/**
 * Seed oficial e idempotente.
 *
 * Cria/garante duas contas de acesso imediato em dev e em produção
 * (após deploys), sem destruir dados existentes. Usa `upsert` em todas
 * as escritas: rodar N vezes converge para o mesmo estado.
 *
 * - admin@atelie.com.br → systemRole "admin" (acesso ao painel de sistema)
 * - teste@atelie.com.br → conta de teste comum
 *
 * Ambas recebem um Workspace + Membership "owner" para serem utilizáveis
 * no modelo multi-tenant (toda Wedding pertence a um Workspace).
 */

// Parâmetros do argon2id alinhados com o restante da aplicação.
const HASH_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const DEFAULT_PASSWORD = "12345678";

type SystemRole = "user" | "admin";

interface SeedAccount {
  readonly name: string;
  readonly email: string;
  readonly systemRole: SystemRole;
  readonly workspaceName: string;
  readonly workspaceSlug: string;
}

const ACCOUNTS: readonly SeedAccount[] = [
  {
    name: "Admin Atelier",
    email: "admin@atelie.com.br",
    systemRole: "admin",
    workspaceName: "Atelier Admin",
    workspaceSlug: "atelier-admin",
  },
  {
    name: "Conta de Teste",
    email: "teste@atelie.com.br",
    systemRole: "user",
    workspaceName: "Atelier Teste",
    workspaceSlug: "atelier-teste",
  },
] as const;

/**
 * Garante um usuário + workspace + membership de forma idempotente.
 * `update: {}` preserva qualquer alteração feita após o primeiro seed.
 */
async function upsertAccount(account: SeedAccount, passwordHash: string): Promise<void> {
  const user = await prisma.user.upsert({
    where: { email: account.email },
    update: {},
    create: {
      name: account.name,
      email: account.email,
      password: passwordHash,
      systemRole: account.systemRole,
      twoFactorEnabled: false,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: account.workspaceSlug },
    update: {},
    create: {
      name: account.workspaceName,
      slug: account.workspaceSlug,
    },
  });

  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "owner",
    },
  });
}

async function main(): Promise<void> {
  console.log("🌱 Executando seed (idempotente via upsert)...");

  const passwordHash = await argon2.hash(DEFAULT_PASSWORD, HASH_OPTS);

  for (const account of ACCOUNTS) {
    await upsertAccount(account, passwordHash);
    console.log(`   ✔ ${account.systemRole === "admin" ? "Admin" : "Teste"} → ${account.email}`);
  }

  console.log("\n✅ Seed concluído. Contas disponíveis:");
  for (const account of ACCOUNTS) {
    console.log(`   ${account.email} / ${DEFAULT_PASSWORD}`);
  }
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
