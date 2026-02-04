import type { CityId, MetricId, PeriodKind, TempUnit, WindUnit } from "./constants";
import { CITIES, METRICS } from "./constants";

const VALID_CITY_IDS = new Set(CITIES.map((c) => c.id));
const VALID_METRIC_IDS = new Set(METRICS.map((m) => m.id));

const STORAGE_KEY = "tamable-weather-prefs";

export interface SavedPrefs {
  cityId: CityId;
  metricIds: MetricId[];
  period: PeriodKind;
  startDayOffset: number;
  tempUnit: TempUnit;
  windUnit: WindUnit;
}

const DEFAULT_PREFS: SavedPrefs = {
  cityId: "tokyo",
  metricIds: ["temperature_2m"],
  period: "7d",
  startDayOffset: 0,
  tempUnit: "C",
  windUnit: "km/h",
};

function ensureMetricIds(ids: unknown): MetricId[] {
  if (!Array.isArray(ids) || ids.length === 0) return DEFAULT_PREFS.metricIds;
  const out = ids.filter((id): id is MetricId => typeof id === "string" && VALID_METRIC_IDS.has(id as MetricId));
  return out.length > 0 ? out : DEFAULT_PREFS.metricIds;
}

function ensureCityId(id: unknown): CityId {
  return typeof id === "string" && VALID_CITY_IDS.has(id as CityId) ? (id as CityId) : DEFAULT_PREFS.cityId;
}

function ensurePeriod(p: unknown): PeriodKind {
  return p === "48h" || p === "7d" ? p : DEFAULT_PREFS.period;
}

function ensureTempUnit(u: unknown): TempUnit {
  return u === "C" || u === "F" ? u : DEFAULT_PREFS.tempUnit;
}

function ensureWindUnit(u: unknown): WindUnit {
  return u === "km/h" || u === "m/s" ? u : DEFAULT_PREFS.windUnit;
}

function parsePrefs(raw: string | null): Partial<SavedPrefs> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Partial<SavedPrefs>;
  } catch {
    return null;
  }
}

export function loadPrefs(): SavedPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  const raw = localStorage.getItem(STORAGE_KEY);
  const partial = parsePrefs(raw);
  if (!partial) return DEFAULT_PREFS;
  return {
    cityId: ensureCityId(partial.cityId),
    metricIds: ensureMetricIds(partial.metricIds),
    period: ensurePeriod(partial.period),
    startDayOffset:
      typeof partial.startDayOffset === "number" ? partial.startDayOffset : DEFAULT_PREFS.startDayOffset,
    tempUnit: ensureTempUnit(partial.tempUnit),
    windUnit: ensureWindUnit(partial.windUnit),
  };
}

export function savePrefs(prefs: SavedPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // quota or private mode
  }
}
