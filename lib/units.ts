import type { TempUnit, WindUnit } from "./constants";
import type { MetricId } from "./constants";

export function convertTemp(celsius: number | null, unit: TempUnit): number | null {
  if (celsius == null) return null;
  if (unit === "F") return Math.round((celsius * 9) / 5 + 32);
  return celsius;
}

export function convertWind(kmh: number | null, unit: WindUnit): number | null {
  if (kmh == null) return null;
  if (unit === "m/s") return Math.round((kmh / 3.6) * 10) / 10;
  return kmh;
}

export function getDisplayUnit(
  metricId: MetricId,
  tempUnit: TempUnit,
  windUnit: WindUnit
): string {
  if (metricId === "temperature_2m" || metricId === "apparent_temperature")
    return tempUnit === "F" ? "°F" : "°C";
  if (metricId === "windspeed_10m") return windUnit;
  return "mm";
}
