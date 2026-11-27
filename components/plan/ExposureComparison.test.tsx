import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/lib/i18n";
import { ExposureComparison } from "./ExposureComparison";

describe("ExposureComparison Component", () => {
  const defaultProps = {
    baseline: { low: 7.2, high: 9.6 },
    plan: { low: 4.5, high: 6.0 },
    percentSaved: 38,
  };

  it("renders comparison title, baseline exposure bar, plan exposure bar, and percent saved badge", () => {
    render(
      <LanguageProvider>
        <ExposureComparison {...defaultProps} />
      </LanguageProvider>
    );

    expect(
      screen.getByRole("heading", { level: 2, name: /bina plan vs plan ke saath/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/^bina plan ke$/i)).toBeInTheDocument();
    expect(screen.getByText(/7\.2\s*se\s*9\.6\s*cigarette\/din/i)).toBeInTheDocument();

    expect(screen.getByText(/^plan ke saath$/i)).toBeInTheDocument();
    expect(screen.getByText(/4\.5\s*se\s*6\s*cigarette\/din/i)).toBeInTheDocument();

    expect(screen.getByText(/~38% kam dhuan/i)).toBeInTheDocument();
  });

  it("toggles the animation state when the switch button is clicked", () => {
    render(
      <LanguageProvider>
        <ExposureComparison {...defaultProps} />
      </LanguageProvider>
    );

    const toggleBtn = screen.getByRole("switch");
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute("aria-checked", "true");

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute("aria-checked", "true");
  });
});
