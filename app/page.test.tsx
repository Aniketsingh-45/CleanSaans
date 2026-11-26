import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "@/lib/i18n";
import HomePage from "./page";

describe("HomePage", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("renders the CleanSaans heading, tagline, accessible landmarks, and footer disclaimer in default Hinglish", () => {
    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    expect(screen.getByRole("heading", { level: 1, name: /cleansaans/i })).toBeInTheDocument();
    expect(screen.getByText(/saaf saans, sabke saath\./i)).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText(/setup taiyaar/i)).toBeInTheDocument();
    expect(screen.getByText(/saans lene mein dikkat/i)).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      /CleanSaans: sirf jaankari ke liye, doctor ki salah nahi\. Sabhi numbers approximate hain\./i
    );
  });

  it("dynamically changes UI strings and document lang when switching language via LanguageToggle", () => {
    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    // Initial state: Hinglish, document.documentElement.lang is "en"
    expect(screen.getByText(/saaf saans, sabke saath\./i)).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");

    // Click Hindi
    const hindiBtn = screen.getByRole("radio", { name: /हिंदी/i });
    fireEvent.click(hindiBtn);

    expect(screen.getByText(/साफ़ सांस, सबके साथ।/i)).toBeInTheDocument();
    expect(screen.getByText(/सुरक्षा सूचना: सांस लेने में दिक्कत/i)).toBeInTheDocument();
    expect(screen.getByText(/सेटअप तैयार/i)).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("hi");

    // Click English
    const englishBtn = screen.getByRole("radio", { name: /english/i });
    fireEvent.click(englishBtn);

    expect(screen.getByText(/clean air, together\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/safety note: if you experience difficulty breathing/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/setup ready/i)).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });
});
