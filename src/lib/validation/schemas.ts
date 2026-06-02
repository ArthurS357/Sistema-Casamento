import { z } from "zod";
import { RsvpStatus, TableShape, RelType, ExpenseCategory, TaskStatus } from "./enums";

const cuid = z.string().min(20).max(40);
const nonEmpty = z.string().trim().min(1).max(200);
const emailOpt = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .optional()
  .or(z.literal("").transform(() => undefined));
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
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "Você precisa aceitar os termos para continuar",
  }),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const WeddingCreateSchema = z.object({
  title: nonEmpty,
  date: z.coerce.date(),
  budgetTotal: cents.default(0),
  pixKey: pixKeyOpt,
});
export const WeddingUpdateSchema = WeddingCreateSchema.partial().extend({
  // null limpa a chave; string define; undefined mantém.
  pixKey: pixKeyOpt.nullable(),
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

export const RelationshipCreateSchema = z
  .object({
    type: RelType,
    guestId: cuid,
    relatedId: cuid,
  })
  .refine((d) => d.guestId !== d.relatedId, { message: "guestId must differ from relatedId" });
