import type { OpenMeteoForecastResponse } from "./types";
import type { MetricId } from "./constants";
import { METRICS } from "./constants";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

/** 同一リクエストの重複を防ぐ簡易キャッシュ（メモリ） */
const cache = new Map<string, { data: OpenMeteoForecastResponse; at: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分

function cacheKey(lat: number, lon: number, period: "48h" | "7d"): string {
  return `${lat.toFixed(4)}_${lon.toFixed(4)}_${period}`;
}

export interface FetchForecastParams {
  latitude: number;
  longitude: number;
  period: "48h" | "7d";
  metricId: MetricId;
}

/**
 * Open-Meteo Forecast API を呼び出し。
 * 選択変更時のみフェッチし、短時間のキャッシュでレート制限を緩和。
 */
export async function fetchForecast(
  params: FetchForecastParams
): Promise<OpenMeteoForecastResponse> {
  const { latitude, longitude, period, metricId } = params;
  const key = cacheKey(latitude, longitude, period);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  const hourlyParams =
    period === "48h"
      ? "temperature_2m,apparent_temperature,precipitation,windspeed_10m"
      : "temperature_2m,apparent_temperature,precipitation,windspeed_10m";
  const dailyParams =
    "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max";

  const searchParams = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: hourlyParams,
    daily: dailyParams,
    forecast_days: period === "48h" ? "3" : "7",
    timezone: "Asia/Tokyo",
  });

  const url = `${BASE_URL}?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒でタイムアウト
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (e) {
    clearTimeout(timeoutId);
    if ((e as Error).name === "AbortError") {
      throw new Error("接続がタイムアウトしました。ネットワークを確認して再試行してください。");
    }
    throw e;
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) {
      throw new Error("リクエストが多すぎます。しばらく待ってから再試行してください。");
    }
    throw new Error(`データの取得に失敗しました（${res.status}）。${text || res.statusText}`);
  }

  const data = (await res.json()) as OpenMeteoForecastResponse;
  cache.set(key, { data, at: Date.now() });
  return data;
}
