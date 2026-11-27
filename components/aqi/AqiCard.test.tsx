import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AqiResponse } from "@/lib/data/aqi";
import { LanguageProvider } from "@/lib/i18n";
import { AqiCard } from "./AqiCard";

const mockAqiResponse: AqiResponse = {
  city: "Delhi",
  aqi: 245,
  category: {
    label: "Very Poor",
    hinglish: "Bahut kharab hawa",
  },
  pm25Now: 195,
  hourly: Array.from({ length: 48 }, (_, i) => ({
    time: `2026-11-26T${String(i % 24).padStart(2, "0")}:00:00Z`,
    pm25: 150 + (i % 6) * 10,
  })),
  updatedAt: new Date(Date.now() - 5 * 60_000).toISOString(), // 5 mins ago
  source: "live",
};

describe("AqiCard Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("displays loading skeleton with accessible role='status' while fetching", () => {
    // Hang fetch indefinitely
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}));

    render(
      <LanguageProvider>
        <AqiCard city="Delhi" />
      </LanguageProvider>
    );

    expect(screen.getByRole("status", { name: /aqi data load ho raha hai/i })).toBeInTheDocument();
  });

  it("renders live AQI, city, CPCB text label, and relative time upon successful fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockAqiResponse,
    } as Response);

    render(
      <LanguageProvider>
        <AqiCard city="Delhi" />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("245")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Delhi" })).toBeInTheDocument();
    // CPCB Category as explicit TEXT label
    expect(screen.getByText(/very poor \(bahut kharab hawa\)/i)).toBeInTheDocument();
    // Live badge
    expect(screen.getByText(/live data/i)).toBeInTheDocument();
    // Relative updated time
    expect(screen.getByText(/5 min pehle update hua/i)).toBeInTheDocument();
  });

  it("displays 'Cached data' badge when source is 'cached'", async () => {
    const cachedResponse: AqiResponse = {
      ...mockAqiResponse,
      source: "cached",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => cachedResponse,
    } as Response);

    render(
      <LanguageProvider>
        <AqiCard city="Delhi" />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("245")).toBeInTheDocument();
    });

    expect(screen.getByText(/cached data/i)).toBeInTheDocument();
  });

  it("displays error alert and retry button when fetch fails, retrying on click", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network fail"));

    render(
      <LanguageProvider>
        <AqiCard city="Delhi" />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByText(/aqi data load nahi ho paya/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /dobara koshish karein/i });
    expect(retryBtn).toBeInTheDocument();

    // Now resolve on retry
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAqiResponse,
    } as Response);

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("245")).toBeInTheDocument();
    });
  });
});
