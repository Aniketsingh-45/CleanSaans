import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AqiResponse } from "@/lib/data/aqi";
import type { PlanResponse } from "@/lib/data/plan";
import { LanguageProvider } from "@/lib/i18n";
import { DEFAULT_PROFILE, PROFILE_STORAGE_KEY } from "@/lib/profile";
import HomePage from "./page";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    prefetch: vi.fn(),
  }),
}));

const mockAqi: AqiResponse = {
  city: "Delhi",
  aqi: 220,
  category: {
    label: "Very Poor",
    hinglish: "Bahut kharab hawa",
  },
  pm25Now: 165,
  hourly: Array.from({ length: 48 }, (_, i) => ({
    time: `2026-11-26T${String(i % 24).padStart(2, "0")}:00:00Z`,
    pm25: 80 + (i % 8) * 15,
  })),
  updatedAt: new Date().toISOString(),
  source: "live",
};

const mockPlan: PlanResponse = {
  baseline: { low: 7.2, high: 9.6 },
  plan: { low: 4.5, high: 6.0 },
  percentSaved: 38,
  window: {
    startHour: 13,
    cost: { low: 0.8, high: 1.2 },
    baselineCost: { low: 1.5, high: 2.0 },
    saved: { low: 0.7, high: 0.8 },
    category: {
      label: "Moderate",
      hinglish: "Madhyam pradushan",
    },
    avoidIfPossible: false,
    advice: "Bahar jaane ka accha samay.",
  },
  actions: [
    {
      id: "action-routine-1",
      time: "12:00 - 15:00",
      category: "routine",
      title: "Dupahar ke saaf samay khidkiyan kholein",
      why: "Is samay PM2.5 sabse kam hota hai jisse taazi hawa aati hai.",
      impact: {
        cigsSavedLow: 0.8,
        cigsSavedHigh: 1.2,
        inrSaved: 0,
        co2KgSaved: 0,
        costInr: 0,
      },
    },
    {
      id: "action-routine-2",
      time: "07:00 - 10:00",
      category: "routine",
      title: "Subah ke pradushit samay N95 mask pehnein",
      why: "Subah PM2.5 charam par hota hai, mask lagbhag 95% particulate rokta hai.",
      impact: {
        cigsSavedLow: 1.5,
        cigsSavedHigh: 2.0,
        inrSaved: 0,
        co2KgSaved: 0,
        costInr: 30,
      },
    },
    {
      id: "action-indoor-1",
      time: "Khana banate waqt",
      category: "indoor",
      title: "Kitchen exhaust fan chalu rakhein",
      why: "Exhaust fan se rasoi ka dhuan aur gas seedhe bahar nikal jaati hai.",
      impact: {
        cigsSavedLow: 0.5,
        cigsSavedHigh: 0.7,
        inrSaved: 0,
        co2KgSaved: 0,
        costInr: 0,
      },
    },
    {
      id: "action-indoor-2",
      time: "Shaam ko",
      category: "indoor",
      title: "Dhoop agarbatti na jalayein",
      why: "Agarbatti se kamre ke andar 200+ ug/m3 barabar dhuan badh jaata hai.",
      impact: {
        cigsSavedLow: 0.4,
        cigsSavedHigh: 0.6,
        inrSaved: 10,
        co2KgSaved: 0,
        costInr: 0,
      },
    },
    {
      id: "action-sustainable-1",
      time: "Commute ke waqt",
      category: "sustainable",
      title: "Car ki jagah Metro ya Bus lein",
      why: "Metro se aap sadak ke seedhe exhaust dhuan se bachte hain aur paise bachte hain.",
      impact: {
        cigsSavedLow: 1.0,
        cigsSavedHigh: 1.4,
        inrSaved: 80,
        co2KgSaved: 2.5,
        costInr: 0,
      },
    },
  ],
  source: "ai",
};

describe("HomePage - Part (a) & Part (b)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockReplace.mockClear();
    mockPush.mockClear();
    vi.restoreAllMocks();
    document.documentElement.lang = "en";
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("redirects to /onboarding if no profile is found in localStorage", () => {
    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    expect(mockReplace).toHaveBeenCalledWith("/onboarding");
  });

  it("renders header with CleanSaans, tagline, LanguageToggle, and 'Profile badlein' link when profile exists", async () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/aqi")) {
        return {
          ok: true,
          json: async () => mockAqi,
        } as Response;
      }
      return {
        ok: true,
        json: async () => mockPlan,
      } as Response;
    });

    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    expect(mockReplace).not.toHaveBeenCalled();

    // 1) Header components
    expect(screen.getByRole("heading", { level: 1, name: /cleansaans/i })).toBeInTheDocument();
    expect(screen.getByText(/saaf saans, sabke saath\./i)).toBeInTheDocument();

    const editProfileLink = screen.getByRole("link", { name: /profile badlein/i });
    expect(editProfileLink).toBeInTheDocument();
    expect(editProfileLink).toHaveAttribute("href", "/onboarding");

    // 2) AQI Card loads
    await waitFor(() => {
      expect(screen.getByText("220")).toBeInTheDocument();
    });
    expect(screen.getByRole("status", { name: /cpcb category: very poor/i })).toBeInTheDocument();

    // 3) SafeWindow component loads with hourly data
    expect(
      screen.getByRole("heading", { level: 2, name: /bahar jaane ka sabse saaf time/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /best time set karo/i })).toBeInTheDocument();
  });

  it("dynamically changes UI strings and document lang when switching language via LanguageToggle", async () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/aqi")) {
        return {
          ok: true,
          json: async () => mockAqi,
        } as Response;
      }
      return {
        ok: true,
        json: async () => mockPlan,
      } as Response;
    });

    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("220")).toBeInTheDocument();
    });

    // Initial state: Hinglish
    expect(screen.getByText(/profile badlein/i)).toBeInTheDocument();

    // Switch to Hindi
    const hindiBtn = screen.getByRole("radio", { name: /हिंदी/i });
    fireEvent.click(hindiBtn);

    expect(screen.getByText(/प्रोफाइल बदलें/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /बाहर जाने का सबसे साफ़ समय/i })
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("hi");

    // Switch to English
    const englishBtn = screen.getByRole("radio", { name: /english/i });
    fireEvent.click(englishBtn);

    expect(screen.getByText(/edit profile/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /cleanest window for outdoor activity/i })
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  it("renders Part (b) plan comparison, the 3 categorized sections, toggle works, and 'Kyun?' expands", async () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/aqi")) {
        return {
          ok: true,
          json: async () => mockAqi,
        } as Response;
      }
      return {
        ok: true,
        json: async () => mockPlan,
      } as Response;
    });

    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    // Wait for the plan to load (after debounce)
    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { level: 2, name: /bina plan vs plan ke saath/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // 1) Exposure comparison and toggle
    expect(screen.getByText(/~38% kam dhuan/i)).toBeInTheDocument();
    const switchToggle = screen.getByRole("switch");
    expect(switchToggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(switchToggle);
    expect(switchToggle).toHaveAttribute("aria-checked", "false");

    // 2) Three sections render
    expect(
      screen.getByRole("heading", { level: 3, name: /low-emission daily routines/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /indoor air quality hacks/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /sustainable alternatives/i })
    ).toBeInTheDocument();

    // 3) 'Kyun?' button expands
    const kyunBtns = screen.getAllByRole("button", { name: /kyun\?/i });
    expect(kyunBtns.length).toBeGreaterThan(0);
    const firstKyun = kyunBtns[0]!;
    expect(firstKyun).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(firstKyun);
    expect(firstKyun).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/is samay pm2\.5 sabse kam hota hai jisse taazi hawa aati hai\./i)
    ).toBeInTheDocument();
  });

  it("renders Part (c) skip-to-content link, landmarks, updated footer disclaimer, and functional assumptions modal", async () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/aqi")) {
        return {
          ok: true,
          json: async () => mockAqi,
        } as Response;
      }
      return {
        ok: true,
        json: async () => mockPlan,
      } as Response;
    });

    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    // 1) Skip link & main landmark
    const skipLink = screen.getByRole("link", { name: /skip to content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");

    // 2) Footer disclaimer & landmark
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent(
      /ye sirf jaankari hai, doctor ki salah nahi\. saans lene mein dikkat ya seene mein dard ho to turant doctor se milein\./i
    );

    // 3) "Ye numbers kaise nikle?" button opens modal
    const howCalculatedBtn = screen.getByRole("button", { name: /ye numbers kaise nikle\?/i });
    howCalculatedBtn.focus();
    expect(howCalculatedBtn).toHaveFocus();

    fireEvent.click(howCalculatedBtn);

    // Modal dialog is open
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText(/approximate estimate, not medical advice/i)).toBeInTheDocument();

    // Close with Escape
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Focus restored to the button
    expect(howCalculatedBtn).toHaveFocus();
  });

  it("renders plan error alert and retries when retry button is clicked", async () => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));

    let planAttempts = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/aqi")) {
        return {
          ok: true,
          json: async () => mockAqi,
        } as Response;
      }
      planAttempts += 1;
      if (planAttempts === 1) {
        return {
          ok: false,
          status: 500,
        } as Response;
      }
      return {
        ok: true,
        json: async () => mockPlan,
      } as Response;
    });

    render(
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    );

    // Wait for plan error alert to appear
    await waitFor(
      () => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const retryBtn = screen.getByRole("button", { name: /dobara koshish karein/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);

    // Plan loads after retry
    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { level: 2, name: /bina plan vs plan ke saath/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
