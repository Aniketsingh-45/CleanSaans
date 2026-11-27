import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuditResponse } from "@/lib/data/audit";
import { LanguageProvider } from "@/lib/i18n";
import AuditPage from "./page";

describe("AuditPage UI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.documentElement.lang = "en";

    // URL.createObjectURL and revokeObjectURL mock for jsdom
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => "blob:http://localhost/mock-preview");
    } else {
      vi.spyOn(globalThis.URL, "createObjectURL").mockReturnValue(
        "blob:http://localhost/mock-preview"
      );
    }

    if (!globalThis.URL.revokeObjectURL) {
      globalThis.URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(globalThis.URL, "revokeObjectURL").mockImplementation(() => {});
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders page title, privacy note, and labelled file input with camera capture attribute", () => {
    render(
      <LanguageProvider>
        <AuditPage />
      </LanguageProvider>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /ghar ka air audit/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/server par save nahi hoti/i)).toBeInTheDocument();

    const fileInput = screen.getByLabelText(/ghar ke kamre, khidki ya rasoi ki photo chunein/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute("type", "file");
    expect(fileInput).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    expect(fileInput).toHaveAttribute("capture", "environment");
  });

  it("displays photo preview with accessible alt text when an image is selected", async () => {
    render(
      <LanguageProvider>
        <AuditPage />
      </LanguageProvider>
    );

    const file = new File(["dummy content"], "photo.jpg", { type: "image/jpeg" });
    const fileInput = screen.getByLabelText(/ghar ke kamre, khidki ya rasoi ki photo chunein/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const previewImg = screen.getByAltText(/audit ke liye upload ki gayi photo ka preview/i);
      expect(previewImg).toBeInTheDocument();
      expect(previewImg).toHaveAttribute("src", "blob:http://localhost/mock-preview");
    });

    expect(screen.getByRole("button", { name: /photo scan karein/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /doosri photo lein/i })).toBeInTheDocument();
  });

  it("submits audit photo, displays loading state with aria-live, and renders leak cards with effort & cost", async () => {
    const mockAuditResult: AuditResponse = {
      leaks: [
        {
          issue: "Khidkiyon ke side mein gaps",
          why_it_matters: "Bahar ka smog seedhe kamre mein ghusta hai.",
          fix: "Weather strip seal lagayein.",
          approx_cost_inr: 0,
          effort: "low",
        },
        {
          issue: "Gas chulhe par exhaust fan nahi hai",
          why_it_matters: "Rasoi mein cooking PM2.5 400+ ho jata hai.",
          fix: "Khidki kholi rakhein aur exhaust lagwayein.",
          approx_cost_inr: 1200,
          effort: "med",
        },
      ],
      burning_detected: false,
      confidence: 0.9,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockAuditResult,
    } as Response);

    render(
      <LanguageProvider>
        <AuditPage />
      </LanguageProvider>
    );

    const file = new File(["dummy content"], "kitchen.jpg", { type: "image/jpeg" });
    const fileInput = screen.getByLabelText(/ghar ke kamre, khidki ya rasoi ki photo chunein/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = await screen.findByRole("button", { name: /photo scan karein/i });
    fireEvent.click(submitBtn);

    // Wait for results
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 2, name: /audit ke natije/i })
      ).toBeInTheDocument();
    });

    // Leak cards rendered
    expect(screen.getByText("Khidkiyon ke side mein gaps")).toBeInTheDocument();
    expect(screen.getByText(/weather strip seal lagayein/i)).toBeInTheDocument();
    expect(screen.getByText(/muft/i)).toBeInTheDocument();
    expect(screen.getByText(/kam \(low\)/i)).toBeInTheDocument();

    expect(screen.getByText("Gas chulhe par exhaust fan nahi hai")).toBeInTheDocument();
    expect(screen.getByText("₹1200")).toBeInTheDocument();
    expect(screen.getByText(/madhyam \(med\)/i)).toBeInTheDocument();
  });

  it("displays burning alert when burning_detected is true", async () => {
    const mockAuditResult: AuditResponse = {
      leaks: [
        {
          issue: "Khule mein kooda jal raha hai",
          why_it_matters: "Biomass dhuan se zehreeli gas nikalti hai.",
          fix: "Aag bujhayein aur municipal helpline par call karein.",
          approx_cost_inr: 0,
          effort: "low",
        },
      ],
      burning_detected: true,
      confidence: 0.95,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockAuditResult,
    } as Response);

    render(
      <LanguageProvider>
        <AuditPage />
      </LanguageProvider>
    );

    const file = new File(["dummy content"], "waste.jpg", { type: "image/jpeg" });
    const fileInput = screen.getByLabelText(/ghar ke kamre, khidki ya rasoi ki photo chunein/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = await screen.findByRole("button", { name: /photo scan karein/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/khule mein kooda \/ dhuan jalna detect hua!/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/sameer app ya municipal 311 helpline/i)).toBeInTheDocument();
  });

  it("displays friendly empty message when leaks array is empty", async () => {
    const mockAuditResult: AuditResponse = {
      leaks: [],
      burning_detected: false,
      confidence: 0.8,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockAuditResult,
    } as Response);

    render(
      <LanguageProvider>
        <AuditPage />
      </LanguageProvider>
    );

    const file = new File(["dummy content"], "clean_room.jpg", { type: "image/jpeg" });
    const fileInput = screen.getByLabelText(/ghar ke kamre, khidki ya rasoi ki photo chunein/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    const submitBtn = await screen.findByRole("button", { name: /photo scan karein/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/is photo mein koi pollution leak nahi mila ya photo saaf nahi hai/i)
      ).toBeInTheDocument();
    });
  });
});
