"use client";

import { METRICS } from "@/lib/constants";
import type { MetricId } from "@/lib/constants";

interface MetricMultiSelectProps {
  selectedIds: MetricId[];
  onChange: (ids: MetricId[]) => void;
  disabled?: boolean;
}

export function MetricMultiSelect({
  selectedIds,
  onChange,
  disabled,
}: MetricMultiSelectProps) {
  const toggle = (id: MetricId) => {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter((x) => x !== id);
      if (next.length > 0) onChange(next);
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <fieldset className="flex flex-col" role="group" aria-label="指標（複数選択可）">
      <legend className="text-xs font-medium text-[var(--text-muted)]">
        指標
      </legend>
      <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-2.5 rounded-xl border border-[var(--glass-border)] bg-white/50 px-4 py-3 backdrop-blur-sm">
        {METRICS.map((m) => (
          <label
            key={m.id}
            className={`flex cursor-pointer items-center gap-2.5 text-sm text-[var(--text)] ${
              disabled ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(m.id)}
              onChange={() => toggle(m.id)}
              disabled={disabled}
              className="h-4 w-4 rounded border-slate-300 text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
              aria-label={`${m.label}を表示`}
            />
            <span>
              {m.label}
              <span className="ml-1 text-[var(--text-muted)]">{m.unit}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
