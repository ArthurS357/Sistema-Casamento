import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Pro</Badge>);
    expect(screen.getByText("Pro")).toBeDefined();
  });

  it("applies the variant styles", () => {
    render(<Badge variant="gestor">Gestor</Badge>);
    const el = screen.getByText("Gestor");
    expect(el.className).toContain("bg-slate-900");
  });

  it("merges custom className", () => {
    render(<Badge className="custom-x">IA</Badge>);
    expect(screen.getByText("IA").className).toContain("custom-x");
  });
});
