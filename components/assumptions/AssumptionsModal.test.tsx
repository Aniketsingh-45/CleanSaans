import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "@/lib/i18n";
import { AssumptionsModal } from "./AssumptionsModal";

function ModalTestHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <button ref={triggerRef} type="button" onClick={() => setIsOpen(true)}>
        Ye numbers kaise nikle?
      </button>

      <AssumptionsModal isOpen={isOpen} onClose={() => setIsOpen(false)} triggerRef={triggerRef} />
    </div>
  );
}

describe("AssumptionsModal Component", () => {
  it("opens modal on trigger click with accessible dialog role, aria-modal, and assumptions table", async () => {
    render(
      <LanguageProvider>
        <ModalTestHarness />
      </LanguageProvider>
    );

    // Initial state: dialog is closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const triggerBtn = screen.getByRole("button", { name: /ye numbers kaise nikle\?/i });
    fireEvent.click(triggerBtn);

    // Modal dialog is open
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "assumptions-modal-title");

    // Title and explicit approximate / not medical advice note
    expect(
      screen.getByRole("heading", { level: 2, name: /modelling assumptions & sources/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/approximate estimate, not medical advice/i)).toBeInTheDocument();

    // Table rows from ASSUMPTIONS
    expect(screen.getByText(/pm2\.5 to cigarette equivalence/i)).toBeInTheDocument();
    expect(screen.getByText(/berkeley earth/i)).toBeInTheDocument();
  });

  it("traps focus between first and last interactive elements within the modal", async () => {
    render(
      <LanguageProvider>
        <ModalTestHarness />
      </LanguageProvider>
    );

    const triggerBtn = screen.getByRole("button", { name: /ye numbers kaise nikle\?/i });
    fireEvent.click(triggerBtn);

    const dialog = screen.getByRole("dialog");
    const closeButtons = screen.getAllByRole("button", { name: /band karein/i });
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);

    const firstInteractive = closeButtons[0]!;
    const lastInteractive = closeButtons[closeButtons.length - 1]!;

    // Initial focus lands inside the dialog
    await waitFor(() => {
      expect(firstInteractive).toHaveFocus();
    });

    // Tab from last element wraps around to first element
    lastInteractive.focus();
    expect(lastInteractive).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: false });
    expect(firstInteractive).toHaveFocus();

    // Shift+Tab from first element wraps around to last element
    firstInteractive.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(lastInteractive).toHaveFocus();
  });

  it("closes modal on Escape key press and restores focus back to the trigger button", async () => {
    render(
      <LanguageProvider>
        <ModalTestHarness />
      </LanguageProvider>
    );

    const triggerBtn = screen.getByRole("button", { name: /ye numbers kaise nikle\?/i });
    triggerBtn.focus();
    expect(triggerBtn).toHaveFocus();

    fireEvent.click(triggerBtn);

    // Modal is open
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Press Escape to close modal
    fireEvent.keyDown(document, { key: "Escape" });

    // Modal is now closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Focus returned to trigger button
    expect(triggerBtn).toHaveFocus();
  });

  it("closes modal when clicking the close button and restores focus", async () => {
    render(
      <LanguageProvider>
        <ModalTestHarness />
      </LanguageProvider>
    );

    const triggerBtn = screen.getByRole("button", { name: /ye numbers kaise nikle\?/i });
    triggerBtn.focus();
    fireEvent.click(triggerBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const closeBtn = screen.getAllByRole("button", { name: /band karein/i })[0]!;
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(triggerBtn).toHaveFocus();
  });
});
