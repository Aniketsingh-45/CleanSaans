"use client";

import { useEffect, useRef, type JSX } from "react";
import { ASSUMPTIONS } from "@/lib/engine";
import { useT } from "@/lib/i18n";

export interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Accessible Assumptions & Methodology Modal:
 * - role="dialog", aria-modal="true", aria-labelledby
 * - Focus trap cycling between all interactive elements (Tab / Shift+Tab)
 * - Closes on Esc key
 * - Automatically returns focus back to opening trigger button on close
 * - Displays all modelling ASSUMPTIONS from /lib/engine with sources and explicit
 *   "approximate estimate, not medical advice" note.
 */
export function AssumptionsModal({
  isOpen,
  onClose,
  triggerRef,
}: AssumptionsModalProps): JSX.Element | null {
  const { t } = useT();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Capture currently focused element so we can restore focus when modal closes
    const previousActiveElement = (triggerRef?.current ??
      document.activeElement) as HTMLElement | null;

    // Shift initial focus into modal
    const timeoutId = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Prevent background scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Return focus to opening button
      previousActiveElement?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assumptions-modal-title"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 id="assumptions-modal-title" className="text-xl font-bold text-slate-950">
              {t("assumptionsModalTitle")}
            </h2>
            <p className="mt-1.5 inline-flex items-center rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-950">
              ℹ️ {t("assumptionsNote")}
            </p>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            aria-label={t("closeModal")}
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <span aria-hidden="true" className="text-xl font-bold">
              ✕
            </span>
          </button>
        </div>

        {/* Scrollable Table Content */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-800">
                <tr>
                  <th scope="col" className="p-3">
                    {t("tableHeaderFactor")}
                  </th>
                  <th scope="col" className="p-3">
                    {t("tableHeaderValue")}
                  </th>
                  <th scope="col" className="p-3">
                    {t("tableHeaderSource")}
                  </th>
                  <th scope="col" className="p-3">
                    {t("tableHeaderNote")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {ASSUMPTIONS.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-semibold text-slate-900">{item.label}</td>
                    <td className="p-3 font-mono text-slate-800">{item.value}</td>
                    <td className="p-3 text-slate-600">{item.source}</td>
                    <td className="p-3 text-slate-600">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-teal-900 px-5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            {t("closeModal")}
          </button>
        </div>
      </div>
    </div>
  );
}
