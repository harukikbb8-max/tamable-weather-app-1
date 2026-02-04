"use client";

import { PERIOD_OPTIONS } from "@/lib/constants";
import type { PeriodKind } from "@/lib/constants";

interface PeriodToggleProps {
  value: PeriodKind;
  onChange: (period: PeriodKind) => void;
  disabled?: boolean;
}

export function PeriodToggle({ value, onChange, disabled }: PeriodToggleProps) {
  return (
    <fieldset className="flex flex-col" role="radiogroup" aria-label="表示期間">
      <legend className="text-xs font-medium text-[var(--text-muted)]">
        期間
      </legend>
      <div className="mt-1.5 flex rounded-xl border border-[var(--glass-border)] bg-white/50 p-0.5 backdrop-blur-sm">
        {PERIOD_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex-1 cursor-pointer rounded px-4 py-2.5 text-center text-sm font-medium transition-colors ${
              value === opt.value
                ? "bg-white text-[var(--accent)] shadow-[var(--glass-shadow)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <input
              type="radio"
              name="period"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              className="sr-only"
              aria-label={opt.label}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
