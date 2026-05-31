import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const HASH_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const hash = (plain: string) => argon2.hash(plain, HASH_OPTS);

function slug(base: string, suffix: string) {
  return `${base.toLowerCase().replace(/\s+/g, "-")}-${suffix}`;
}

async function main() {
  console.log("🌱 Limpando banco...");

  // Cascade order: guests/seats/expenses/relations → weddings → memberships → workspaces → users
  await prisma.guestRelationship.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.table.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.wedding.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ── Admin ─────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn(
      "⚠️  ADMIN_EMAIL ou ADMIN_PASSWORD não definidos no .env — conta admin não criada.",
    );
  } else {
    console.log("👤 Criando usuário Admin...");
    const adminPw = await hash(adminPassword);
    const admin = await prisma.user.create({
      data: { name: "Admin", email: adminEmail, password: adminPw, systemRole: "admin" },
    });
    const adminWs = await prisma.workspace.create({
      data: { name: "Admin Workspace", slug: slug("admin-workspace", "sys") },
    });
    await prisma.membership.create({
      data: { userId: admin.id, workspaceId: adminWs.id, role: "owner" },
    });
    console.log(`   ✔ Admin → ${adminEmail} (senha via ADMIN_PASSWORD)`);
  }

  // ── Planos de teste ────────────────────────────────────────────────
  const seeds = [
    { plan: "free",   userName: "Carlos Free",   email: "free@teste.dev",   pw: "Test123!" },
    { plan: "pro",    userName: "Maria Pro",      email: "pro@teste.dev",    pw: "Test123!" },
    { plan: "gestor", userName: "João Gestor",    email: "gestor@teste.dev", pw: "Test123!" },
  ] as const;

  for (const s of seeds) {
    console.log(`\n🏢 Criando workspace ${s.plan.toUpperCase()}...`);

    const pw = await hash(s.pw);
    const user = await prisma.user.create({
      data: { name: s.userName, email: s.email, password: pw },
    });

    const ws = await prisma.workspace.create({
      data: {
        name: `${s.userName} WS`,
        slug: slug(s.userName, s.plan),
        plan: s.plan,
        memberships: { create: { userId: user.id, role: "owner" } },
      },
    });

    // ── Casamentos ─────────────────────────────────────────────────
    const weddingCount = s.plan === "gestor" ? 3 : s.plan === "pro" ? 2 : 1;

    for (let wi = 0; wi < weddingCount; wi++) {
      const weddingDate = new Date(Date.now() + (wi + 1) * 30 * 24 * 60 * 60 * 1000);
      const wedding = await prisma.wedding.create({
        data: {
          title: `Casamento ${s.userName.split(" ")[0]} #${wi + 1}`,
          date: weddingDate,
          budgetTotal: (40 + wi * 10) * 100_00,
          workspaceId: ws.id,
        },
      });

      // ── Despesas ───────────────────────────────────────────────
      await prisma.expense.createMany({
        data: [
          { category: "Buffet",       amount: 15_000_00, paid: 5_000_00, weddingId: wedding.id },
          { category: "Fotografia",   amount: 8_000_00,  paid: 2_000_00, weddingId: wedding.id },
          { category: "Decoração",    amount: 6_000_00,  paid: 0,        weddingId: wedding.id },
        ],
      });

      // ── Convidados ─────────────────────────────────────────────
      const guestNames = [
        ["Ana Silva",       "ana@example.com",    "confirmed"],
        ["Bruno Costa",     "bruno@example.com",  "pending"],
        ["Carla Mendes",    "carla@example.com",  "confirmed"],
        ["Diego Rocha",     "diego@example.com",  "declined"],
        ["Elisa Ferreira",  "elisa@example.com",  "pending"],
        ["Fábio Lima",      "fabio@example.com",  "confirmed"],
        ["Gabriela Torres", "gabi@example.com",   "pending"],
        ["Henrique Souza",  "henrique@example.com","confirmed"],
      ] as const;

      await prisma.guest.createMany({
        data: guestNames.map(([name, email, rsvpStatus]) => ({
          name,
          email,
          rsvpStatus,
          weddingId: wedding.id,
        })),
      });

      console.log(`   ✔ ${wedding.title} — ${guestNames.length} convidados`);
    }
  }

  console.log("\n✅ Seed concluído.");
  if (adminEmail) console.log(`   Admin  → ${adminEmail} (senha via ADMIN_PASSWORD)`);
  console.log("   Free   → free@teste.dev / Test123!");
  console.log("   Pro    → pro@teste.dev / Test123!");
  console.log("   Gestor → gestor@teste.dev / Test123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
