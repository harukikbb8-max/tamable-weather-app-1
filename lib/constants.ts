/**
 * 都市マスタ（要件: 東京・大阪・札幌・福岡・那覇）
 * 緯度・経度は Open-Meteo で利用する座標
 */
export const CITIES = [
  { id: "tokyo", name: "東京", lat: 35.6762, lon: 139.6503 },
  { id: "osaka", name: "大阪", lat: 34.6937, lon: 135.5023 },
  { id: "sapporo", name: "札幌", lat: 43.0618, lon: 141.3545 },
  { id: "fukuoka", name: "福岡", lat: 33.5902, lon: 130.4017 },
  { id: "naha", name: "那覇", lat: 26.2124, lon: 127.6792 },
] as const;

export type CityId = (typeof CITIES)[number]["id"];

/** 表示用指標（要件: hourly / daily の各パラメータ） */
export const METRICS = [
  { id: "temperature_2m", label: "気温", unit: "°C", hourly: "temperature_2m", daily: ["temperature_2m_max", "temperature_2m_min"] as const },
  { id: "apparent_temperature", label: "体感温度", unit: "°C", hourly: "apparent_temperature", daily: null },
  { id: "precipitation", label: "降水量", unit: "mm", hourly: "precipitation", daily: "precipitation_sum" },
  { id: "windspeed_10m", label: "風速", unit: "km/h", hourly: "windspeed_10m", daily: "windspeed_10m_max" },
] as const;

export type MetricId = (typeof METRICS)[number]["id"];

/** 期間: 48時間 = hourly / 7日間 = daily */
export type PeriodKind = "48h" | "7d";

export const PERIOD_OPTIONS: { value: PeriodKind; label: string }[] = [
  { value: "48h", label: "48時間" },
  { value: "7d", label: "7日間" },
];

/** 気温単位（任意拡張） */
export type TempUnit = "C" | "F";
export const TEMP_UNIT_OPTIONS: { value: TempUnit; label: string }[] = [
  { value: "C", label: "°C" },
  { value: "F", label: "°F" },
];

/** 風速単位（任意拡張） */
export type WindUnit = "km/h" | "m/s";
export const WIND_UNIT_OPTIONS: { value: WindUnit; label: string }[] = [
  { value: "km/h", label: "km/h" },
  { value: "m/s", label: "m/s" },
];
