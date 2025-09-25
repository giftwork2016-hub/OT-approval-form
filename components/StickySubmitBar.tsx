"use client";

import clsx from "clsx";
import { formatHours } from "@/lib/utils";

interface StickySubmitBarProps {
  hours?: number;
  onSubmit: () => void;
  disabled?: boolean;
  submitting?: boolean;
  summaryText?: string;
  ctaText?: string;
}

export function StickySubmitBar({ hours = 0, onSubmit, disabled, submitting, summaryText, ctaText }: StickySubmitBarProps) {
  const displaySummary = summaryText ?? `OT ~ ${formatHours(hours)} ชม.`;
  const buttonLabel = submitting ? "กำลังส่ง..." : ctaText ?? "Submit OT Request";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-white via-white/95 to-white/80 pb-safe">
      <div className="mx-auto flex max-w-md items-center gap-4 px-6 pb-4 pt-3 sm:max-w-xl lg:max-w-4xl">
        <div className="flex-1 rounded-2xl bg-surface-100 px-4 py-3 text-sm font-semibold text-primary-600 shadow-inner shadow-primary-100/70">
          {displaySummary}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || submitting}
          className={clsx(
            "flex h-12 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 text-base font-semibold text-white shadow-lg shadow-primary-400/50 transition",
            (disabled || submitting) && "cursor-not-allowed opacity-60",
          )}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
