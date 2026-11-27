import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n";
import { DEFAULT_PROFILE, loadProfile, PROFILE_STORAGE_KEY } from "@/lib/profile";
import OnboardingPage from "./page";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
}));

describe("OnboardingPage", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    mockReplace.mockClear();
    document.documentElement.lang = "en";
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the onboarding form with real labels, fieldset/legend, privacy note, and LanguageToggle", () => {
    render(
      <LanguageProvider>
        <OnboardingPage />
      </LanguageProvider>
    );

    // Headings & landmarks
    expect(
      screen.getByRole("heading", { level: 2, name: /apna parivar setup karein/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/aapka data sirf aapke phone mein rehta hai/i)).toBeInTheDocument();

    // Fieldsets and legends
    expect(screen.getByText(/aapka shehar/i)).toBeInTheDocument();
    expect(screen.getByText(/parivar ke sadasya/i)).toBeInTheDocument();
    expect(screen.getByText(/roz ka aana-jaana/i)).toBeInTheDocument();
    expect(screen.getByText(/ghar aur rasoi/i)).toBeInTheDocument();

    // Inputs with labels
    expect(screen.getByLabelText(/shehar chunein/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bachhon ki sankhya/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/buzurgon ki sankhya/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/roz aane-jaane ki doori/i)).toBeInTheDocument();

    // Submit button
    expect(
      screen.getByRole("button", { name: /profile save karein aur plan dekhein/i })
    ).toBeInTheDocument();
  });

  it("enforces accessible min-h-11 touch targets across all interactive elements", () => {
    render(
      <LanguageProvider>
        <OnboardingPage />
      </LanguageProvider>
    );

    const select = screen.getByLabelText(/shehar chunein/i);
    expect(select.className).toContain("min-h-11");

    const kidsInput = screen.getByLabelText(/bachhon ki sankhya/i);
    expect(kidsInput.className).toContain("min-h-11");

    const submitBtn = screen.getByRole("button", { name: /profile save karein aur plan dekhein/i });
    expect(submitBtn.className).toContain("min-h-11");
  });

  it("shows inline validation error with aria-describedby on invalid kid count", () => {
    render(
      <LanguageProvider>
        <OnboardingPage />
      </LanguageProvider>
    );

    const kidsInput = screen.getByLabelText(/bachhon ki sankhya/i);
    fireEvent.change(kidsInput, { target: { value: "-3" } });

    const submitBtn = screen.getByRole("button", { name: /profile save karein aur plan dekhein/i });
    fireEvent.click(submitBtn);

    expect(kidsInput).toHaveAttribute("aria-invalid", "true");
    expect(kidsInput).toHaveAttribute("aria-describedby", "kids-error");

    const errorAlert = screen.getByRole("alert");
    expect(errorAlert).toHaveTextContent(/bachhon ki sankhya 0 ya usse zyada honi chahiye/i);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("successfully validates, saves profile to localStorage, and redirects to '/'", () => {
    render(
      <LanguageProvider>
        <OnboardingPage />
      </LanguageProvider>
    );

    // Fill valid form values
    const citySelect = screen.getByLabelText(/shehar chunein/i);
    fireEvent.change(citySelect, { target: { value: "Noida" } });

    const kidsInput = screen.getByLabelText(/bachhon ki sankhya/i);
    fireEvent.change(kidsInput, { target: { value: "1" } });

    const kmInput = screen.getByLabelText(/roz aane-jaane ki doori/i);
    fireEvent.change(kmInput, { target: { value: "14" } });

    const submitBtn = screen.getByRole("button", { name: /profile save karein aur plan dekhein/i });
    fireEvent.click(submitBtn);

    // Profile saved in localStorage
    const stored = loadProfile();
    expect(stored).not.toBeNull();
    expect(stored?.city).toBe("Noida");
    expect(stored?.kids).toBe(1);
    expect(stored?.commuteKm).toBe(14);

    // Router navigated to "/"
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("pre-populates existing profile if user already saved one", () => {
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_PROFILE, city: "Lucknow", kids: 3, commuteKm: 25 })
    );

    render(
      <LanguageProvider>
        <OnboardingPage />
      </LanguageProvider>
    );

    expect(screen.getByLabelText(/shehar chunein/i)).toHaveValue("Lucknow");
    expect(screen.getByLabelText(/bachhon ki sankhya/i)).toHaveValue(3);
    expect(screen.getByLabelText(/roz aane-jaane ki doori/i)).toHaveValue(25);
  });

  it("dynamically updates all form strings when language is toggled", () => {
    render(
      <LanguageProvider>
        <OnboardingPage />
      </LanguageProvider>
    );

    expect(screen.getByText(/aapka shehar/i)).toBeInTheDocument();

    // Toggle to Hindi
    const hindiRadio = screen.getByRole("radio", { name: /हिंदी/i });
    fireEvent.click(hindiRadio);

    expect(screen.getByText(/आपका शहर/i)).toBeInTheDocument();
    expect(screen.getByText(/परिवार के सदस्य/i)).toBeInTheDocument();
    expect(screen.getByText(/आपका डेटा सिर्फ आपके फोन में रहता है/i)).toBeInTheDocument();

    // Toggle to English
    const englishRadio = screen.getByRole("radio", { name: /english/i });
    fireEvent.click(englishRadio);

    expect(screen.getByText(/your city/i)).toBeInTheDocument();
    expect(screen.getByText(/family members/i)).toBeInTheDocument();
    expect(screen.getByText(/your data stays only on your phone/i)).toBeInTheDocument();
  });
});
