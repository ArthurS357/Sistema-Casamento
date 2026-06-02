import { describe, expect, test } from "vitest";
import { dueStatus, pendingCount, TASK_STATUS_ORDER } from "./tasks";
import { TaskCreateSchema } from "./validation/schemas";

const NOW = new Date("2026-06-02T12:00:00");

describe("dueStatus", () => {
  test("returns 'none' when no due date", () => {
    expect(dueStatus(null, "PENDING", NOW)).toBe("none");
    expect(dueStatus(undefined, "PENDING", NOW)).toBe("none");
  });

  test("COMPLETED tasks never show urgency", () => {
    expect(dueStatus("2026-01-01", "COMPLETED", NOW)).toBe("none");
  });

  test("past due date on open task is overdue", () => {
    expect(dueStatus("2026-06-01", "PENDING", NOW)).toBe("overdue");
  });

  test("same calendar day is 'today' regardless of clock time", () => {
    expect(dueStatus("2026-06-02T23:59:00", "IN_PROGRESS", NOW)).toBe("today");
  });

  test("within a week is 'soon'", () => {
    expect(dueStatus("2026-06-07", "PENDING", NOW)).toBe("soon");
  });

  test("more than a week ahead is 'upcoming'", () => {
    expect(dueStatus("2026-07-01", "PENDING", NOW)).toBe("upcoming");
  });

  test("invalid date string falls back to 'none'", () => {
    expect(dueStatus("not-a-date", "PENDING", NOW)).toBe("none");
  });
});

describe("pendingCount", () => {
  test("counts everything that is not COMPLETED", () => {
    const tasks = [
      { status: "PENDING" },
      { status: "IN_PROGRESS" },
      { status: "COMPLETED" },
      { status: "COMPLETED" },
    ];
    expect(pendingCount(tasks)).toBe(2);
  });

  test("empty list is zero", () => {
    expect(pendingCount([])).toBe(0);
  });
});

describe("TaskCreateSchema", () => {
  test("applies PENDING default and leaves omitted optionals undefined", () => {
    const parsed = TaskCreateSchema.parse({ title: "Fechar buffet" });
    expect(parsed.status).toBe("PENDING");
    expect(parsed.description).toBeUndefined();
    expect(parsed.category).toBeUndefined();
  });

  test("trims provided strings", () => {
    const parsed = TaskCreateSchema.parse({ title: "  Provar bolo  ", category: "  Cerimônia " });
    expect(parsed.title).toBe("Provar bolo");
    expect(parsed.category).toBe("Cerimônia");
  });

  test("rejects empty title", () => {
    expect(() => TaskCreateSchema.parse({ title: "   " })).toThrow();
  });

  test("rejects status outside the enum", () => {
    expect(() => TaskCreateSchema.parse({ title: "x", status: "DONE" })).toThrow();
  });

  test("coerces dueDate string into a Date", () => {
    const parsed = TaskCreateSchema.parse({ title: "x", dueDate: "2026-06-10" });
    expect(parsed.dueDate).toBeInstanceOf(Date);
  });

  test("status order has the three documented columns", () => {
    expect(TASK_STATUS_ORDER).toEqual(["PENDING", "IN_PROGRESS", "COMPLETED"]);
  });
});
