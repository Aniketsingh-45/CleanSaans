"use client";

import { useEffect, useRef, type JSX } from "react";
import { InfoIcon, MicroscopeIcon } from "@/components/common/Icons";
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
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-teal-900/10 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-7"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100/90 pb-4">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/90 px-3 py-0.5 text-xs font-bold text-teal-900 shadow-2xs">
              <MicroscopeIcon className="h-3.5 w-3.5 text-teal-800" />
              <span>Open Science Model</span>
            </div>
            <h2
              id="assumptions-modal-title"
              className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl"
            >
              {t("assumptionsModalTitle")}
            </h2>
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-950">
              <InfoIcon className="h-3.5 w-3.5 text-teal-800 shrink-0" />
              <span>{t("assumptionsNote")}</span>
            </p>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            aria-label={t("closeModal")}
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className="h-5 w-5"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Table Content */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/90 font-extrabold text-slate-900">
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
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-950">{item.label}</td>
                    <td className="p-3 font-mono font-semibold text-teal-950">{item.value}</td>
                    <td className="p-3 text-slate-600">{item.source}</td>
                    <td className="p-3 text-slate-600">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-4 flex justify-end border-t border-slate-100/90 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl bg-linear-to-r from-teal-800 to-teal-950 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:from-teal-900 hover:to-slate-950 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            {t("closeModal")}
          </button>
        </div>
      </div>
    </div>
  );
}
