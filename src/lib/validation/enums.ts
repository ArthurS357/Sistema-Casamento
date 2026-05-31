import { z } from "zod";

export const RsvpStatus = z.enum(["pending", "confirmed", "declined", "maybe"]);
export type RsvpStatus = z.infer<typeof RsvpStatus>;

export const TableShape = z.enum(["round", "square", "rectangle"]);
export type TableShape = z.infer<typeof TableShape>;

export const RelType = z.enum(["friend", "family", "colleague", "conflict", "couple"]);
export type RelType = z.infer<typeof RelType>;

export const Role = z.enum(["couple", "planner"]);
export type Role = z.infer<typeof Role>;

export const Plan = z.enum(["free", "basic", "pro", "business"]);
export type Plan = z.infer<typeof Plan>;

export const ExpenseCategory = z.enum([
  "venue", "catering", "decor", "photography", "music",
  "attire", "transport", "stationery", "favors", "other",
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategory>;
