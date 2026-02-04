"use client";

import {
  TEMP_UNIT_OPTIONS,
  WIND_UNIT_OPTIONS,
  type TempUnit,
  type WindUnit,
} from "@/lib/constants";
import type { MetricId } from "@/lib/constants";

/** 気温単位が有効な指標（気温・体感温度） */
const TEMP_METRIC_IDS: MetricId[] = ["temperature_2m", "apparent_temperature"];

interface UnitTogglesProps {
  tempUnit: TempUnit;
  windUnit: WindUnit;
  onTempChange: (u: TempUnit) => void;
  onWindChange: (u: WindUnit) => void;
  /** 読み込み中などで全体を無効にする */
  disabled?: boolean;
  /** 選択中の指標。気温トグルは「気温」「体感温度」のいずれかが含まれる時のみ有効、風速トグルは「風速」が含まれる時のみ有効 */
  selectedMetricIds: MetricId[];
}

export function UnitToggles({
  tempUnit,
  windUnit,
  onTempChange,
  onWindChange,
  disabled,
  selectedMetricIds,
}: UnitTogglesProps) {
  const hasTempMetric = selectedMetricIds.some((id) =>
    TEMP_METRIC_IDS.includes(id)
  );
  const hasWindMetric = selectedMetricIds.includes("windspeed_10m");

  const tempDisabled = disabled || !hasTempMetric;
  const windDisabled = disabled || !hasWindMetric;

  return (
    <div className="flex flex-col gap-4">
      <fieldset
        className="flex flex-col"
        role="group"
        aria-label="気温単位"
        disabled={tempDisabled}
        aria-describedby={tempDisabled ? "temp-unit-hint" : undefined}
      >
        <legend className="text-xs font-medium text-[var(--text-muted)]">
          気温
        </legend>
        {tempDisabled && !disabled && (
          <span
            id="temp-unit-hint"
            className="mt-0.5 text-[10px] text-[var(--text-subtle)]"
          >
            気温・体感温度を選択中のみ変更できます
          </span>
        )}
        <div
          className={`mt-1.5 flex rounded-lg border border-[var(--border)] p-0.5 ${
            tempDisabled ? "cursor-not-allowed bg-slate-100 opacity-60" : "bg-[var(--accent-soft)]"
          }`}
        >
          {TEMP_UNIT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 rounded px-3 py-2 text-center text-sm font-medium transition-colors ${
                tempUnit === opt.value
                  ? "bg-white text-[var(--accent)] shadow-[var(--card-shadow)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              } ${tempDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name="temp-unit"
                value={opt.value}
                checked={tempUnit === opt.value}
                onChange={() => onTempChange(opt.value)}
                disabled={tempDisabled}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset
        className="flex flex-col"
        role="group"
        aria-label="風速単位"
        disabled={windDisabled}
        aria-describedby={windDisabled ? "wind-unit-hint" : undefined}
      >
        <legend className="text-xs font-medium text-[var(--text-muted)]">
          風速
        </legend>
        {windDisabled && !disabled && (
          <span
            id="wind-unit-hint"
            className="mt-0.5 text-[10px] text-[var(--text-subtle)]"
          >
            風速を選択中のみ変更できます
          </span>
        )}
        <div
          className={`mt-1.5 flex rounded-lg border border-[var(--border)] p-0.5 ${
            windDisabled ? "cursor-not-allowed bg-slate-100 opacity-60" : "bg-[var(--accent-soft)]"
          }`}
        >
          {WIND_UNIT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 rounded px-3 py-2 text-center text-sm font-medium transition-colors ${
                windUnit === opt.value
                  ? "bg-white text-[var(--accent)] shadow-[var(--card-shadow)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              } ${windDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <input
                type="radio"
                name="wind-unit"
                value={opt.value}
                checked={windUnit === opt.value}
                onChange={() => onWindChange(opt.value)}
                disabled={windDisabled}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
