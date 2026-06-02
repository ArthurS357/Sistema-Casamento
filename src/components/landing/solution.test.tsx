import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingSolution } from "./solution";

describe("LandingSolution", () => {
  it("surfaces the Lia (IA) feature", () => {
    render(<LandingSolution />);
    expect(screen.getByText("Lia, sua assistente de IA")).toBeDefined();
  });

  it("tags paid features with Pro and Gestor badges", () => {
    render(<LandingSolution />);
    // "Pro" tags appear on multiple paid features.
    expect(screen.getAllByText("Pro").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gestor").length).toBeGreaterThan(0);
    expect(screen.getByText("IA")).toBeDefined();
  });
});
