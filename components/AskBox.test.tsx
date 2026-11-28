import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n";
import { AskBox } from "./AskBox";

describe("AskBox Component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders labelled textarea, submit button, character counter, and safety disclaimer note", () => {
    render(
      <LanguageProvider>
        <AskBox />
      </LanguageProvider>
    );

    // Labelled textarea
    const textarea = screen.getByLabelText(/apna sawaal yahan likhein/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("maxLength", "500");

    // Submit button
    const submitBtn = screen.getByRole("button", { name: /sawaal poochein/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled(); // Initially disabled when empty

    // Character counter
    expect(screen.getByText(/0\/500 akshar/i)).toBeInTheDocument();

    // Prominent disclaimer note
    expect(screen.getByText(/ai jawab, doctor ki salah nahi\./i)).toBeInTheDocument();
  });

  it("enables submit button when valid text is typed and updates character count", () => {
    render(
      <LanguageProvider>
        <AskBox />
      </LanguageProvider>
    );

    const textarea = screen.getByLabelText(/apna sawaal yahan likhein/i);
    const submitBtn = screen.getByRole("button", { name: /sawaal poochein/i });

    expect(submitBtn).toBeDisabled();

    // Type text
    const sampleText = "Subah exercise kab karein?";
    fireEvent.change(textarea, { target: { value: sampleText } });
    expect(submitBtn).not.toBeDisabled();
    expect(
      screen.getByText(new RegExp(`${sampleText.length}/500 akshar`, "i"))
    ).toBeInTheDocument();

    // Clear to whitespace
    fireEvent.change(textarea, { target: { value: "   " } });
    expect(submitBtn).toBeDisabled();
  });

  it("submits question, shows aria-live loading state, and renders AI response", async () => {
    const mockAnswer =
      "Dhoop nikalne ke baad 11 baje ke aas-paas walk karein jab surface inversion kam ho jata hai.";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: mockAnswer,
        source: "ai",
      }),
    } as Response);

    render(
      <LanguageProvider>
        <AskBox />
      </LanguageProvider>
    );

    const textarea = screen.getByLabelText(/apna sawaal yahan likhein/i);
    const submitBtn = screen.getByRole("button", { name: /sawaal poochein/i });

    fireEvent.change(textarea, { target: { value: "Best exercise time kya hai?" } });
    fireEvent.click(submitBtn);

    // Live loading text
    expect(screen.getByText(/cleansaans ai jawab taiyaar kar raha hai\.\.\./i)).toBeInTheDocument();

    // Wait for answer to render
    await waitFor(() => {
      expect(screen.getByText(mockAnswer)).toBeInTheDocument();
    });

    expect(screen.getByText(/cleansaans ai ka jawab/i)).toBeInTheDocument();
    expect(screen.getByText(/^ai jawab$/i)).toBeInTheDocument();
    // Safety note still visible inside the answer region
    const disclaimerNotes = screen.getAllByText(/ai jawab, doctor ki salah nahi\./i);
    expect(disclaimerNotes.length).toBeGreaterThanOrEqual(1);
  });

  it("displays error state with retry option when API request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Server connection failed." }),
    } as Response);

    render(
      <LanguageProvider>
        <AskBox />
      </LanguageProvider>
    );

    const textarea = screen.getByLabelText(/apna sawaal yahan likhein/i);
    const submitBtn = screen.getByRole("button", { name: /sawaal poochein/i });

    fireEvent.change(textarea, { target: { value: "Purifier konsa lein?" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/server connection failed\./i)).toBeInTheDocument();
    });

    // Retry button is available
    const retryBtn = screen.getByRole("button", { name: /dobara koshish karein/i });
    expect(retryBtn).toBeInTheDocument();
  });

  it("resets form and answer when 'Doosra sawaal poochein' is clicked", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: "Mask lagana zaroori hai.",
        source: "ai",
      }),
    } as Response);

    render(
      <LanguageProvider>
        <AskBox />
      </LanguageProvider>
    );

    const textarea = screen.getByLabelText(/apna sawaal yahan likhein/i);
    const submitBtn = screen.getByRole("button", { name: /sawaal poochein/i });

    fireEvent.change(textarea, { target: { value: "Kya mask zaroori hai?" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/mask lagana zaroori hai\./i)).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole("button", { name: /doosra sawaal poochein/i });
    fireEvent.click(resetBtn);

    // Answer is cleared and textarea is reset
    expect(screen.queryByText(/mask lagana zaroori hai\./i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/apna sawaal yahan likhein/i)).toHaveValue("");
  });

  it("renders all three suggested quick-question chips and clicking one populates the textarea", () => {
    render(
      <LanguageProvider>
        <AskBox />
      </LanguageProvider>
    );

    // All three suggested prompts are rendered
    expect(screen.getByText("Subah exercise kab karein?")).toBeInTheDocument();
    expect(screen.getByText("Kya bacchon ke liye N95 zaroori hai?")).toBeInTheDocument();
    expect(screen.getByText("Ghar ka dhuan kaise kam karein?")).toBeInTheDocument();

    // Clicking a chip populates the textarea
    fireEvent.click(screen.getByText("Kya bacchon ke liye N95 zaroori hai?"));
    const textarea = screen.getByLabelText(/apna sawaal yahan likhein/i);
    expect(textarea).toHaveValue("Kya bacchon ke liye N95 zaroori hai?");

    // Submit button should now be enabled
    expect(screen.getByRole("button", { name: /sawaal poochein/i })).not.toBeDisabled();
  });

  it("renders FormattedAnswer with bold+content lines (**Topic:** rest pattern)", async () => {
    const boldAnswer =
      "**N95 Mask:** Bacchon ke liye zaroori hai peak hours mein.\n**Ventilation:** Dopahar 12-3 baje khidki khol sakte hain.";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ answer: boldAnswer, source: "ai" }),
    } as Response);

    render(
      <LanguageProvider>
        <AskBox />
      </LanguageProvider>
    );

    const textarea = screen.getByLabelText(/apna sawaal yahan likhein/i);
    fireEvent.change(textarea, { target: { value: "N95 mask zaroori hai?" } });
    fireEvent.click(screen.getByRole("button", { name: /sawaal poochein/i }));

    await waitFor(() => {
      // Bold topic rendered as <strong>N95 Mask:</strong> — text may be split across elements
      // Use getAllByText with substring matching to find the strong element
      const boldElements = screen.getAllByText(/n95 mask/i);
      expect(boldElements.length).toBeGreaterThan(0);
      expect(
        screen.getByText(/bacchon ke liye zaroori hai peak hours mein\./i)
      ).toBeInTheDocument();
    });
  });

  it("renders FormattedAnswer with bullet lines (- pattern) and shows fallback badge", async () => {
    const bulletAnswer =
      "Kuch tips:\n- Subah bahar mat jayein\n- N95 mask pehnein\n- Ghar ki khidki band rakhein";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ answer: bulletAnswer, source: "fallback" }),
    } as Response);

    render(
      <LanguageProvider>
        <AskBox />
      </LanguageProvider>
    );

    const textarea = screen.getByLabelText(/apna sawaal yahan likhein/i);
    fireEvent.change(textarea, { target: { value: "Tips do?" } });
    fireEvent.click(screen.getByRole("button", { name: /sawaal poochein/i }));

    await waitFor(() => {
      expect(screen.getByText(/subah bahar mat jayein/i)).toBeInTheDocument();
      expect(screen.getByText(/n95 mask pehnein/i)).toBeInTheDocument();
    });

    // Fallback badge shown
    expect(screen.getByText(/fallback/i)).toBeInTheDocument();
  });

  it("filters out '*note:' disclaimer lines appended by Gemini from FormattedAnswer output", async () => {
    // Gemini sometimes appends *Note: ... lines — these should be stripped
    const answerWithNote =
      "N95 mask pehnein bahar jaane se pehle.\n*Note: This is an AI answer, not medical advice.";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ answer: answerWithNote, source: "ai" }),
    } as Response);

    render(
      <LanguageProvider>
        <AskBox />
      </LanguageProvider>
    );

    const textarea = screen.getByLabelText(/apna sawaal yahan likhein/i);
    fireEvent.change(textarea, { target: { value: "Mask tip?" } });
    fireEvent.click(screen.getByRole("button", { name: /sawaal poochein/i }));

    await waitFor(() => {
      expect(screen.getByText(/n95 mask pehnein bahar jaane se pehle\./i)).toBeInTheDocument();
    });

    // *Note: line should be filtered out by FormattedAnswer
    expect(screen.queryByText(/this is an ai answer, not medical advice/i)).not.toBeInTheDocument();
  });

  it("renders numbered list items (1. pattern) in FormattedAnswer", async () => {
    const numberedAnswer =
      "1. Subah 11 baje bahar jayein\n2. N95 mask pehnein\n3. Kam der ruko bahar";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ answer: numberedAnswer, source: "ai" }),
    } as Response);

    render(
      <LanguageProvider>
        <AskBox />
      </LanguageProvider>
    );

    const textarea = screen.getByLabelText(/apna sawaal yahan likhein/i);
    fireEvent.change(textarea, { target: { value: "Steps batao?" } });
    fireEvent.click(screen.getByRole("button", { name: /sawaal poochein/i }));

    await waitFor(() => {
      expect(screen.getByText(/subah 11 baje bahar jayein/i)).toBeInTheDocument();
      expect(screen.getByText(/n95 mask pehnein/i)).toBeInTheDocument();
      expect(screen.getByText(/kam der ruko bahar/i)).toBeInTheDocument();
    });
  });
});
