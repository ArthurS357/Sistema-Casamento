import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PremiumGate } from "./premium-gate";
import { useActivePlan } from "@/lib/use-plan";

vi.mock("@/lib/use-plan", () => ({ useActivePlan: vi.fn() }));
// Paywall usa next/link, que exige o contexto do App Router fora de testes.
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockPlan = vi.mocked(useActivePlan);

describe("PremiumGate", () => {
  beforeEach(() => mockPlan.mockReset());

  it("renderiza children para plano pago", () => {
    mockPlan.mockReturnValue({ plan: "pro", isPremium: true, isLoading: false });
    render(<PremiumGate feature="gifts"><p>conteudo premium</p></PremiumGate>);
    expect(screen.getByText("conteudo premium")).toBeDefined();
  });

  it("renderiza o Paywall com o copy da feature para plano Free", () => {
    mockPlan.mockReturnValue({ plan: "free", isPremium: false, isLoading: false });
    render(<PremiumGate feature="gifts"><p>conteudo premium</p></PremiumGate>);
    expect(screen.queryByText("conteudo premium")).toBeNull();
    expect(screen.getByText("Lista de Presentes")).toBeDefined();
    expect(screen.getByText("Recurso PRO")).toBeDefined();
  });

  it("mantém children enquanto o plano carrega (evita flash de paywall)", () => {
    mockPlan.mockReturnValue({ plan: undefined, isPremium: null, isLoading: true });
    render(<PremiumGate feature="tables"><p>conteudo premium</p></PremiumGate>);
    expect(screen.getByText("conteudo premium")).toBeDefined();
    expect(screen.queryByText("Recurso PRO")).toBeNull();
  });
});
