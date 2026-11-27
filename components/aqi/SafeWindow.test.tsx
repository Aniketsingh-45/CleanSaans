import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HourlyPm25 } from "@/lib/data/aqi";
import { LanguageProvider } from "@/lib/i18n";
import { DEFAULT_PROFILE, type UserProfile } from "@/lib/profile";
import { SafeWindow } from "./SafeWindow";

const mockHourly: HourlyPm25[] = [
  { time: "2026-11-26T00:00:00Z", pm25: 220 },
  { time: "2026-11-26T01:00:00Z", pm25: 240 },
  { time: "2026-11-26T02:00:00Z", pm25: 250 },
  { time: "2026-11-26T03:00:00Z", pm25: 230 },
  { time: "2026-11-26T04:00:00Z", pm25: 210 },
  { time: "2026-11-26T05:00:00Z", pm25: 190 },
  { time: "2026-11-26T06:00:00Z", pm25: 170 },
  { time: "2026-11-26T07:00:00Z", pm25: 150 },
  { time: "2026-11-26T08:00:00Z", pm25: 130 },
  { time: "2026-11-26T09:00:00Z", pm25: 110 },
  { time: "2026-11-26T10:00:00Z", pm25: 90 },
  { time: "2026-11-26T11:00:00Z", pm25: 80 },
  { time: "2026-11-26T12:00:00Z", pm25: 60 },
  { time: "2026-11-26T13:00:00Z", pm25: 45 }, // cleanest midday window
  { time: "2026-11-26T14:00:00Z", pm25: 50 },
  { time: "2026-11-26T15:00:00Z", pm25: 75 },
  { time: "2026-11-26T16:00:00Z", pm25: 110 },
  { time: "2026-11-26T17:00:00Z", pm25: 160 },
  { time: "2026-11-26T18:00:00Z", pm25: 200 },
  { time: "2026-11-26T19:00:00Z", pm25: 230 },
  { time: "2026-11-26T20:00:00Z", pm25: 260 },
  { time: "2026-11-26T21:00:00Z", pm25: 280 },
  { time: "2026-11-26T22:00:00Z", pm25: 290 },
  { time: "2026-11-26T23:00:00Z", pm25: 300 },
];

describe("SafeWindow Component", () => {
  it("renders heading, 24-hour visual chart, and visually-hidden data table for screen readers", () => {
    render(
      <LanguageProvider>
        <SafeWindow hourly={mockHourly} profile={DEFAULT_PROFILE} />
      </LanguageProvider>
    );

    expect(
      screen.getByRole("heading", { level: 2, name: /bahar jaane ka sabse saaf time/i })
    ).toBeInTheDocument();

    // Chart image container
    expect(
      screen.getByRole("img", { name: /24-hour pm2\.5 pollution chart/i })
    ).toBeInTheDocument();

    // Visually hidden data table
    const table = screen.getByRole("table", { hidden: true });
    expect(table).toBeInTheDocument();
    expect(screen.getByText(/24 ghante ka pm2\.5 aur category data/i)).toBeInTheDocument();
  });

  it("renders labelled controls for start time and duration with min-h-11 touch targets", () => {
    render(
      <LanguageProvider>
        <SafeWindow hourly={mockHourly} profile={DEFAULT_PROFILE} />
      </LanguageProvider>
    );

    const startSlider = screen.getByLabelText(/aapka samay \(start time\)/i);
    expect(startSlider).toBeInTheDocument();
    expect(startSlider.className).toContain("min-h-11");

    const durationSlider = screen.getByLabelText(/bahar bitane ka samay \(duration\)/i);
    expect(durationSlider).toBeInTheDocument();
    expect(durationSlider.className).toContain("min-h-11");
  });

  it("updates live result in aria-live='polite' region when slider values change", () => {
    render(
      <LanguageProvider>
        <SafeWindow hourly={mockHourly} profile={DEFAULT_PROFILE} />
      </LanguageProvider>
    );

    const politeRegion = screen.getByText(/is time par ~/i).parentElement;
    expect(politeRegion).toHaveAttribute("aria-live", "polite");

    const startSlider = screen.getByLabelText(/aapka samay \(start time\)/i);

    // Initial check
    expect(screen.getByText(/is time par ~/i)).toBeInTheDocument();

    // Change start time to 20:00 (heavy smog hour)
    fireEvent.change(startSlider, { target: { value: "20" } });

    // Live result updates
    expect(screen.getByText(/is time par ~/i)).toBeInTheDocument();
    expect(screen.getByText(/sabse saaf time \d/i)).toBeInTheDocument();
  });

  it("clicking 'Best time set karo' button updates start time to optimal window", () => {
    render(
      <LanguageProvider>
        <SafeWindow hourly={mockHourly} profile={DEFAULT_PROFILE} />
      </LanguageProvider>
    );

    const startSlider = screen.getByLabelText(/aapka samay \(start time\)/i) as HTMLInputElement;
    fireEvent.change(startSlider, { target: { value: "0" } }); // midnight

    const bestTimeBtn = screen.getByRole("button", { name: /best time set karo/i });
    expect(bestTimeBtn).toBeInTheDocument();

    fireEvent.click(bestTimeBtn);

    // The cleanest hour during standard daytime is midday (around 13:00 / 14:00)
    expect(Number(startSlider.value)).toBeGreaterThanOrEqual(10);
  });

  it("displays sensitive member warning chip when kids/elderly/asthma are present and window is Poor or worse", () => {
    const sensitiveProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      kids: 2,
      elderly: 1,
      asthma: true,
    };

    render(
      <LanguageProvider>
        <SafeWindow hourly={mockHourly} profile={sensitiveProfile} />
      </LanguageProvider>
    );

    const startSlider = screen.getByLabelText(/aapka samay \(start time\)/i);
    // 22:00 has severe PM2.5 (~290)
    fireEvent.change(startSlider, { target: { value: "22" } });

    const warning = screen.getByRole("alert");
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent(/bachon, buzurgon ya asthma walon ke liye/i);
  });
});
