import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n";
import { ShareButton } from "./ShareButton";

describe("ShareButton Component", () => {
  const mockPlanData = {
    baseline: { low: 7.2, high: 9.6 },
    plan: { low: 4.5, high: 6.0 },
    percentSaved: 38,
  };

  beforeEach(() => {
    localStorage.clear();
    if ("share" in navigator) {
      delete (navigator as unknown as { share?: unknown }).share;
    }
  });

  afterEach(() => {
    if ("share" in navigator) {
      delete (navigator as unknown as { share?: unknown }).share;
    }
    vi.restoreAllMocks();
  });

  it("renders nothing when planData is null or undefined", () => {
    const { container } = render(
      <LanguageProvider>
        <ShareButton planData={null} />
      </LanguageProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders WhatsApp fallback link when Web Share API is not available", () => {
    // navigator.share is not present by default in JSDOM
    render(
      <LanguageProvider>
        <ShareButton planData={mockPlanData} />
      </LanguageProvider>
    );

    const shareLink = screen.getByRole("link", { name: /whatsapp par share karein/i });
    expect(shareLink).toBeInTheDocument();
    expect(shareLink).toHaveAttribute("target", "_blank");
    expect(shareLink).toHaveAttribute("rel", "noopener noreferrer");

    const href = shareLink.getAttribute("href") || "";
    expect(href).toContain("https://wa.me/?text=");

    // Decoded text must match the required pattern:
    // "CleanSaans ke plan se main ~X% kam pollution lunga (A -> B cigarette). Aap bhi try karo: <site url>"
    const decodedText = decodeURIComponent(href.replace("https://wa.me/?text=", ""));
    expect(decodedText).toContain(
      "CleanSaans ke plan se main ~38% kam pollution lunga (7.2-9.6 -> 4.5-6 cigarette). Aap bhi try karo:"
    );
  });

  it("uses Web Share API when navigator.share is available", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    render(
      <LanguageProvider>
        <ShareButton planData={mockPlanData} />
      </LanguageProvider>
    );

    const shareButton = screen.getByRole("button", { name: /plan share karein/i });
    expect(shareButton).toBeInTheDocument();

    fireEvent.click(shareButton);

    expect(mockShare).toHaveBeenCalledTimes(1);
    const sharePayload = mockShare.mock.calls[0]?.[0];
    expect(sharePayload).toBeDefined();
    expect(sharePayload.title).toBe("CleanSaans");
    expect(sharePayload.text).toContain(
      "CleanSaans ke plan se main ~38% kam pollution lunga (7.2-9.6 -> 4.5-6 cigarette). Aap bhi try karo:"
    );
  });

  it("formats single-value ranges cleanly without hyphen duplicate", () => {
    const singleValPlan = {
      baseline: { low: 8, high: 8 },
      plan: { low: 5, high: 5 },
      percentSaved: 37.5,
    };

    render(
      <LanguageProvider>
        <ShareButton planData={singleValPlan} />
      </LanguageProvider>
    );

    const shareLink = screen.getByRole("link", { name: /whatsapp par share karein/i });
    const href = shareLink.getAttribute("href") || "";
    const decoded = decodeURIComponent(href.replace("https://wa.me/?text=", ""));

    expect(decoded).toContain(
      "CleanSaans ke plan se main ~38% kam pollution lunga (8 -> 5 cigarette). Aap bhi try karo:"
    );
  });
});
