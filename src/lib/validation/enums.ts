import { z } from "zod";
import { PLANS } from "@/lib/plans";

export const RsvpStatus = z.enum(["pending", "confirmed", "declined", "maybe"]);
export type RsvpStatus = z.infer<typeof RsvpStatus>;

export const TableShape = z.enum(["round", "square", "rectangle", "imperial", "u-shape"]);
export type TableShape = z.infer<typeof TableShape>;

export const RelType = z.enum(["friend", "family", "colleague", "conflict", "couple"]);
export type RelType = z.infer<typeof RelType>;

export const Role = z.enum(["couple", "planner"]);
export type Role = z.infer<typeof Role>;

export const Plan = z.enum(PLANS);
export type Plan = z.infer<typeof Plan>;

export const ExpenseCategory = z.enum([
  "venue", "catering", "decor", "photography", "music",
  "attire", "transport", "stationery", "favors", "other",
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategory>;

export const TaskStatus = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const AnnouncementType = z.enum(["INFO", "WARNING"]);
export type AnnouncementType = z.infer<typeof AnnouncementType>;
