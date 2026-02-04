"use client";

import { METRICS } from "@/lib/constants";
import type { MetricId } from "@/lib/constants";

interface MetricSelectProps {
  value: MetricId;
  onChange: (id: MetricId) => void;
  disabled?: boolean;
}

export function MetricSelect({ value, onChange, disabled }: MetricSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="metric-select" className="text-sm font-medium text-slate-700">
        指標
      </label>
      <select
        id="metric-select"
        value={value}
        onChange={(e) => onChange(e.target.value as MetricId)}
        disabled={disabled}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:bg-slate-100 disabled:text-slate-500"
        aria-label="指標を選択"
      >
        {METRICS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}（{m.unit}）
          </option>
        ))}
      </select>
    </div>
  );
}
