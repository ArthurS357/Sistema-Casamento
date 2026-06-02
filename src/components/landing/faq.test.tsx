import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LandingFaq } from "./faq";

describe("LandingFaq", () => {
  it("renders the base questions with the new brand name", () => {
    render(<LandingFaq />);
    expect(screen.getByText("O que é o Atelier do Sim?")).toBeDefined();
    expect(screen.getByText("Posso testar de graça?")).toBeDefined();
    expect(screen.getByText("Como funciona a lista de presentes?")).toBeDefined();
    expect(screen.getByText("A IA Lia está em quais planos?")).toBeDefined();
  });

  it("renders the expanded set of questions", () => {
    render(<LandingFaq />);
    expect(screen.getByText("Meus dados e os dos convidados estão seguros?")).toBeDefined();
    expect(screen.getByText("Como recebo os presentes via PIX?")).toBeDefined();
    expect(
      screen.getByText("Qual a diferença entre gerenciar 1 casamento e vários?"),
    ).toBeDefined();
    expect(screen.getByText("Quais são as formas de pagamento dos planos?")).toBeDefined();
  });

  it("opens the first item by default", () => {
    render(<LandingFaq />);
    const first = screen.getByRole("button", { name: /O que é o Atelier do Sim/ });
    expect(first.getAttribute("aria-expanded")).toBe("true");
  });

  it("expands a clicked question and collapses the previously open one", () => {
    render(<LandingFaq />);
    const first = screen.getByRole("button", { name: /O que é o Atelier do Sim/ });
    const second = screen.getByRole("button", { name: /Posso testar de graça/ });

    fireEvent.click(second);

    expect(second.getAttribute("aria-expanded")).toBe("true");
    expect(first.getAttribute("aria-expanded")).toBe("false");
  });

  it("toggles a question closed when clicked again", () => {
    render(<LandingFaq />);
    const first = screen.getByRole("button", { name: /O que é o Atelier do Sim/ });
    fireEvent.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("false");
  });
});
