"use client";

import { useSyncExternalStore, type JSX } from "react";
import { ShareIcon, WhatsAppIcon } from "@/components/common/Icons";
import { useT } from "@/lib/i18n";

export interface ShareButtonProps {
  planData?: {
    baseline: { low: number; high: number };
    plan: { low: number; high: number };
    percentSaved: number;
  } | null;
  className?: string;
}

const emptySubscribe = () => () => {};

/**
 * ShareButton Component
 * Builds text strictly from the current plan response:
 * "CleanSaans ke plan se main ~X% kam pollution lunga (A -> B cigarette). Aap bhi try karo: <site url>"
 * Uses the Web Share API when available, otherwise falls back to a https://wa.me/?text= link.
 */
export function ShareButton({ planData, className = "" }: ShareButtonProps): JSX.Element | null {
  const { t } = useT();

  const canShare = useSyncExternalStore(
    emptySubscribe,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false
  );

  const siteUrl = useSyncExternalStore(
    emptySubscribe,
    () =>
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://cleansaans.in",
    () => "https://cleansaans.in"
  );

  if (!planData) {
    return null;
  }

  const formatRange = (range: { low: number; high: number }): string =>
    range.low === range.high ? `${range.low}` : `${range.low}-${range.high}`;

  const baselineStr = formatRange(planData.baseline);
  const planStr = formatRange(planData.plan);
  const percentStr = Math.round(planData.percentSaved);

  const shareText = t("sharePlanText", {
    percent: percentStr,
    baseline: baselineStr,
    plan: planStr,
    url: siteUrl,
  });

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleWebShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "CleanSaans",
          text: shareText,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        }
      }
    } else {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  const buttonStyle = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-linear-to-r from-emerald-700 via-teal-800 to-teal-900 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-950/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:from-emerald-800 hover:to-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${className}`;

  if (canShare) {
    return (
      <button
        type="button"
        onClick={handleWebShare}
        aria-label={t("sharePlanBtn")}
        className={buttonStyle}
      >
        <ShareIcon className="h-4 w-4 text-emerald-200" />
        <span>{t("sharePlanBtn")}</span>
      </button>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("shareOnWhatsApp")}
      className={buttonStyle}
    >
      <WhatsAppIcon className="h-4 w-4 text-emerald-300" />
      <span>{t("shareOnWhatsApp")}</span>
    </a>
  );
}
