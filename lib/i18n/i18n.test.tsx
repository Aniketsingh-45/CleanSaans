import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { en, hi, hinglish, type TranslationKey } from "./dictionaries";
import { HTML_LANG_MAP, LanguageProvider, LanguageToggle, STORAGE_KEY, useT } from "./index";

function TestConsumer() {
  const { lang, setLanguage, t } = useT();
  return (
    <div>
      <span data-testid="current-lang">{lang}</span>
      <span data-testid="tagline">{t("tagline")}</span>
      <button onClick={() => setLanguage("hi")} data-testid="set-hi">
        Set Hindi
      </button>
      <button onClick={() => setLanguage("en")} data-testid="set-en">
        Set English
      </button>
      <button onClick={() => setLanguage("hinglish")} data-testid="set-hinglish">
        Set Hinglish
      </button>
    </div>
  );
}

describe("i18n Layer", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "en";
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("ensures all dictionaries have identical keys as hinglish", () => {
    const hinglishKeys = Object.keys(hinglish).sort() as TranslationKey[];
    const hiKeys = Object.keys(hi).sort();
    const enKeys = Object.keys(en).sort();

    expect(hiKeys).toEqual(hinglishKeys);
    expect(enKeys).toEqual(hinglishKeys);

    for (const key of hinglishKeys) {
      expect(typeof hinglish[key]).toBe("string");
      expect(typeof hi[key]).toBe("string");
      expect(typeof en[key]).toBe("string");
      expect(hi[key].length).toBeGreaterThan(0);
      expect(en[key].length).toBeGreaterThan(0);
    }
  });

  it("defaults to hinglish and synchronizes html lang attribute", () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId("current-lang")).toHaveTextContent("hinglish");
    expect(screen.getByTestId("tagline")).toHaveTextContent("Saaf saans, sabke saath.");
    expect(document.documentElement.lang).toBe(HTML_LANG_MAP.hinglish);
    expect(document.documentElement.lang).toBe("en");
  });

  it("switches to Hindi and updates rendered text, localStorage, and html lang to 'hi'", () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByTestId("set-hi"));

    expect(screen.getByTestId("current-lang")).toHaveTextContent("hi");
    expect(screen.getByTestId("tagline")).toHaveTextContent("साफ़ सांस, सबके साथ।");
    expect(document.documentElement.lang).toBe("hi");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("hi");
  });

  it("switches to English and updates rendered text, localStorage, and html lang to 'en'", () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByTestId("set-en"));

    expect(screen.getByTestId("current-lang")).toHaveTextContent("en");
    expect(screen.getByTestId("tagline")).toHaveTextContent("Clean air, together.");
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("en");
  });

  it("restores persisted language from localStorage on mount", () => {
    localStorage.setItem(STORAGE_KEY, "hi");

    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId("current-lang")).toHaveTextContent("hi");
    expect(screen.getByTestId("tagline")).toHaveTextContent("साफ़ सांस, सबके साथ।");
    expect(document.documentElement.lang).toBe("hi");
  });

  it("renders accessible LanguageToggle with radio roles, aria-checked, and min-h-11 touch targets", () => {
    render(
      <LanguageProvider>
        <LanguageToggle />
        <TestConsumer />
      </LanguageProvider>
    );

    const radiogroup = screen.getByRole("radiogroup");
    expect(radiogroup).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);

    // Initial default: Hinglish is checked
    const hinglishRadio = screen.getByRole("radio", { name: /hinglish/i });
    const hindiRadio = screen.getByRole("radio", { name: /हिंदी/i });
    const englishRadio = screen.getByRole("radio", { name: /english/i });

    expect(hinglishRadio).toHaveAttribute("aria-checked", "true");
    expect(hindiRadio).toHaveAttribute("aria-checked", "false");
    expect(englishRadio).toHaveAttribute("aria-checked", "false");

    // Check touch target class
    expect(hinglishRadio.className).toContain("min-h-11");
    expect(hindiRadio.className).toContain("min-h-11");
    expect(englishRadio.className).toContain("min-h-11");

    // Click Hindi radio
    fireEvent.click(hindiRadio);
    expect(hindiRadio).toHaveAttribute("aria-checked", "true");
    expect(hinglishRadio).toHaveAttribute("aria-checked", "false");
    expect(document.documentElement.lang).toBe("hi");
    expect(screen.getByTestId("tagline")).toHaveTextContent("साफ़ सांस, सबके साथ।");

    // Click English radio
    fireEvent.click(englishRadio);
    expect(englishRadio).toHaveAttribute("aria-checked", "true");
    expect(hindiRadio).toHaveAttribute("aria-checked", "false");
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByTestId("tagline")).toHaveTextContent("Clean air, together.");
  });
});
