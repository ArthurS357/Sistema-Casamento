import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LandingFaq } from "./faq";

describe("LandingFaq", () => {
  it("renders the four base questions", () => {
    render(<LandingFaq />);
    expect(screen.getByText("O que é o Casamento.app?")).toBeDefined();
    expect(screen.getByText("Posso testar de graça?")).toBeDefined();
    expect(screen.getByText("Como funciona a lista de presentes?")).toBeDefined();
    expect(screen.getByText("A IA Lia está em quais planos?")).toBeDefined();
  });

  it("opens the first item by default", () => {
    render(<LandingFaq />);
    const first = screen.getByRole("button", { name: /O que é o Casamento.app/ });
    expect(first.getAttribute("aria-expanded")).toBe("true");
  });

  it("expands a clicked question and collapses the previously open one", () => {
    render(<LandingFaq />);
    const first = screen.getByRole("button", { name: /O que é o Casamento.app/ });
    const second = screen.getByRole("button", { name: /Posso testar de graça/ });

    fireEvent.click(second);

    expect(second.getAttribute("aria-expanded")).toBe("true");
    expect(first.getAttribute("aria-expanded")).toBe("false");
  });

  it("toggles a question closed when clicked again", () => {
    render(<LandingFaq />);
    const first = screen.getByRole("button", { name: /O que é o Casamento.app/ });
    fireEvent.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("false");
  });
});
