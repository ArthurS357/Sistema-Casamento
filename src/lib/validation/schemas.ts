import { z } from "zod";
import { RsvpStatus, TableShape, RelType, ExpenseCategory, TaskStatus, AnnouncementType } from "./enums";
import { PLANS } from "@/lib/plans";

const cuid = z.string().min(20).max(40);
const nonEmpty = z.string().trim().min(1).max(200);

/**
 * E-mail canônico: sanitiza ANTES de validar (`.trim().toLowerCase()` então
 * `.email()`). Fonte única para todos os schemas que recebem e-mail — garante
 * que "Joao@Email.com " e "joao@email.com" virem o mesmo valor no banco,
 * evitando contas duplicadas e falhas de login por case/whitespace.
 */
export const email = z.string().trim().toLowerCase().email();

const emailOpt = email
  .optional()
  .or(z.literal("").transform(() => undefined));

/**
 * Honeypot anti-bot: campo invisível ao humano. Só aceita vazio/ausente;
 * qualquer valor (bot preenche tudo) reprova a validação.
 */
export const honeypot = z
  .string()
  .max(0, "Falha na verificação anti-spam.")
  .optional();
const phoneOpt = z.string().trim().max(40).optional().or(z.literal("").transform(() => undefined));
const cents = z.number().int().nonnegative().max(1_000_000_000);
const pixKeyOpt = z
  .string()
  .trim()
  .max(77)
  .optional()
  .or(z.literal("").transform(() => undefined));
const urlOpt = z
  .string()
  .trim()
  .url()
  .max(2000)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const RegisterSchema = z.object({
  name: nonEmpty,
  email,
  password: z.string().min(8).max(200),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Você precisa aceitar os termos para continuar",
  }),
  // Honeypot: humano nunca preenche (campo escondido no form). Bot preenche → reprova.
  website: honeypot,
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const WorkspaceMemberInviteSchema = z.object({
  email,
});
export type WorkspaceMemberInviteInput = z.infer<typeof WorkspaceMemberInviteSchema>;

const partnerNameOpt = z
  .string()
  .trim()
  .max(120)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const WeddingCreateSchema = z.object({
  title: nonEmpty,
  date: z.coerce.date(),
  budgetTotal: cents.default(0),
  partner1Name: partnerNameOpt,
  partner2Name: partnerNameOpt,
  pixKey: pixKeyOpt,
});
export const WeddingUpdateSchema = WeddingCreateSchema.partial().extend({
  // null limpa a chave; string define; undefined mantém.
  pixKey: pixKeyOpt.nullable(),
  // Fotos do casal no convite virtual: até 5 URLs (upload via Cloudinary).
  photoUrls: z.array(z.string().url()).max(5).optional(),
});

export const GuestCreateSchema = z.object({
  name: nonEmpty,
  email: emailOpt,
  phone: phoneOpt,
  rsvpStatus: RsvpStatus.default("pending"),
  companions: z.number().int().nonnegative().default(0),
  dietaryRestrictions: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  notes: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
});
export const GuestUpdateSchema = GuestCreateSchema.partial().extend({
  seatId: cuid.nullable().optional(),
});

export const ExpenseCreateSchema = z.object({
  category: ExpenseCategory,
  description: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  amount: cents,
  paid: cents.default(0),
  dueDate: z.coerce.date().nullable().optional(),
});
export const ExpenseUpdateSchema = ExpenseCreateSchema.partial();

export const GiftCreateSchema = z.object({
  title: nonEmpty,
  description: z.string().trim().max(1000).optional().or(z.literal("").transform(() => undefined)),
  price: cents,
  imageUrl: urlOpt,
  isPurchased: z.boolean().default(false),
});
export const GiftUpdateSchema = GiftCreateSchema.partial();

export const TaskCreateSchema = z.object({
  title: nonEmpty,
  description: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
  dueDate: z.coerce.date().nullable().optional(),
  status: TaskStatus.default("PENDING"),
  category: z.string().trim().max(60).optional().or(z.literal("").transform(() => undefined)),
});
export const TaskUpdateSchema = TaskCreateSchema.partial();

export const TableCreateSchema = z.object({
  name: nonEmpty,
  shape: TableShape.default("round"),
  capacity: z.number().int().min(1).max(50),
});
export const TableUpdateSchema = TableCreateSchema.partial();

export const SeatCreateSchema = z.object({
  tableId: cuid,
  number: z.number().int().min(1).max(50),
});

export const RsvpPublicSchema = z.object({
  rsvpStatus: z.enum(["confirmed", "declined", "maybe"]),
  companions: z.number().int().nonnegative().optional(),
  dietaryRestrictions: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
});

// ─── Backoffice / Admin ────────────────────────────────────────

export const AnnouncementCreateSchema = z.object({
  title: nonEmpty,
  message: z.string().trim().min(1).max(1000),
  type: AnnouncementType.default("INFO"),
  isActive: z.boolean().default(false),
});
export type AnnouncementCreateInput = z.infer<typeof AnnouncementCreateSchema>;

export const AnnouncementUpdateSchema = z.object({
  isActive: z.boolean(),
});

// Ações administrativas sobre um usuário (PATCH /api/admin/users).
// Discriminated union: cada ação carrega só o payload que precisa.
export const AdminUserActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("setPlan"), plan: z.enum(PLANS) }),
  z.object({ action: z.literal("setBlocked"), isBlocked: z.boolean() }),
  z.object({ action: z.literal("resetPassword") }),
]);
export type AdminUserAction = z.infer<typeof AdminUserActionSchema>;

export const RelationshipCreateSchema = z
  .object({
    type: RelType,
    guestId: cuid,
    relatedId: cuid,
  })
  .refine((d) => d.guestId !== d.relatedId, { message: "guestId must differ from relatedId" });
