import { z } from "zod";
import { RsvpStatus, TableShape, RelType, ExpenseCategory } from "./enums";

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

export const RegisterSchema = z.object({
  name: nonEmpty,
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const WeddingCreateSchema = z.object({
  title: nonEmpty,
  date: z.coerce.date(),
  budgetTotal: cents.default(0),
});
export const WeddingUpdateSchema = WeddingCreateSchema.partial();

export const GuestCreateSchema = z.object({
  name: nonEmpty,
  email: emailOpt,
  phone: phoneOpt,
  rsvpStatus: RsvpStatus.default("pending"),
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
  dietaryRestrictions: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export const RelationshipCreateSchema = z
  .object({
    type: RelType,
    guestId: cuid,
    relatedId: cuid,
  })
  .refine((d) => d.guestId !== d.relatedId, { message: "guestId must differ from relatedId" });
