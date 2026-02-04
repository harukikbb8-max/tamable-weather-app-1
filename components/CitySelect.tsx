"use client";

import { CITIES } from "@/lib/constants";
import type { CityId } from "@/lib/constants";

interface CitySelectProps {
  value: CityId;
  onChange: (id: CityId) => void;
  disabled?: boolean;
}

export function CitySelect({ value, onChange, disabled }: CitySelectProps) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor="city-select"
        className="text-xs font-medium text-[var(--text-muted)]"
      >
        都市
      </label>
      <select
        id="city-select"
        value={value}
        onChange={(e) => onChange(e.target.value as CityId)}
        disabled={disabled}
        className="mt-1.5 h-10 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] px-3 text-sm text-[var(--text)] backdrop-blur-sm transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60 disabled:text-slate-400"
        aria-label="都市を選択"
      >
        {CITIES.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}
