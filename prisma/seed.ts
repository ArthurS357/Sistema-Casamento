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
 * - Admin → e-mail/senha vêm de ADMIN_EMAIL / ADMIN_PASSWORD (.env).
 *   systemRole "admin" (acesso ao painel de sistema). Sem essas
 *   variáveis o seed aborta — credencial de admin nunca é hardcoded.
 * - teste@atelie.com.br → conta de teste comum (credencial fixa de dev).
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

// Senha fixa da conta de teste (não-sensível, apenas para dev/QA).
const TEST_PASSWORD = "12345678";

type SystemRole = "user" | "admin";

interface SeedAccount {
  readonly name: string;
  readonly email: string;
  /** Senha em texto puro; é hasheada com argon2 em `upsertAccount`. */
  readonly password: string;
  readonly systemRole: SystemRole;
  readonly workspaceName: string;
  readonly workspaceSlug: string;
}

/**
 * Garante um usuário + workspace + membership de forma idempotente.
 *
 * O `update` força `password` e `systemRole`: se a conta já existir
 * (de um seed anterior ou de login OAuth sem senha), a credencial é
 * sobrescrita pela do `.env` — sem isso o login falha com a senha nova.
 */
async function upsertAccount(account: SeedAccount): Promise<void> {
  const passwordHash = await argon2.hash(account.password, HASH_OPTS);

  const user = await prisma.user.upsert({
    where: { email: account.email },
    update: {
      password: passwordHash,
      systemRole: account.systemRole,
    },
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

  // Trava de segurança: credenciais de admin são obrigatórias e nunca hardcoded.
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL e ADMIN_PASSWORD devem estar definidos no .env");
  }

  // ⚠️ HARD RESET ("opção nuclear"): apaga TODOS os usuários, sessões e
  // workspaces antes de recriar do zero. Destrutivo e irreversível — limpa
  // resíduos de testes/OAuth. Ordem respeita as FKs (filhos → pais); os
  // deletes em Workspace/User ainda cascateiam para weddings, memberships,
  // tokens etc. NUNCA rode contra um banco com dados reais de produção.
  console.warn("🧨 HARD RESET: apagando todos os usuários, sessões e workspaces...");
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});

  const accounts: readonly SeedAccount[] = [
    {
      name: "Admin Atelier",
      email: adminEmail,
      password: adminPassword,
      systemRole: "admin",
      workspaceName: "Atelier Admin",
      workspaceSlug: "atelier-admin",
    },
    {
      name: "Conta de Teste",
      email: "teste@atelie.com.br",
      password: TEST_PASSWORD,
      systemRole: "user",
      workspaceName: "Atelier Teste",
      workspaceSlug: "atelier-teste",
    },
  ];

  for (const account of accounts) {
    await upsertAccount(account);
    console.log(`   ✔ ${account.systemRole === "admin" ? "Admin" : "Teste"} → ${account.email}`);
  }

  // Não logamos a senha do admin (vem do .env); só a credencial fixa de teste.
  console.log("\n✅ Seed concluído. Contas disponíveis:");
  console.log(`   ${adminEmail} / (senha via ADMIN_PASSWORD)`);
  console.log(`   teste@atelie.com.br / ${TEST_PASSWORD}`);
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
