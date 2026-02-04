import type { OpenMeteoForecastResponse } from "./types";
import type { ChartDataPoint } from "./types";
import type { MetricId } from "./constants";
import { METRICS } from "./constants";

type PeriodKind = "48h" | "7d";

/** ISO 日時 → 表示用「MM/DD HH:00」 or 「MM/DD」 */
function formatTime(iso: string, period: PeriodKind): string {
  const d = new Date(iso);
  if (period === "48h") {
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * API レスポンスをチャート用の配列に変換。
 * 48h = hourly、7d = daily（該当指標がない場合は hourly を 7 日分使用）。
 */
export function transformToChartData(
  data: OpenMeteoForecastResponse,
  metricId: MetricId,
  period: PeriodKind
): ChartDataPoint[] {
  const metric = METRICS.find((m) => m.id === metricId);
  if (!metric) return [];

  if (period === "48h" && data.hourly) {
    const times = data.hourly.time ?? [];
    const values = data.hourly[metric.hourly as keyof typeof data.hourly];
    const arr = Array.isArray(values) ? values : [];
    return times.slice(0, 48).map((time, i) => ({
      time,
      label: formatTime(time, "48h"),
      values: { [metric.label]: arr[i] ?? null },
    })) as ChartDataPoint[];
  }

  if (period === "7d" && data.daily) {
    const times = data.daily.time ?? [];
    const dailyKey = metric.daily;
    if (Array.isArray(dailyKey)) {
      // 気温: max / min 2系列
      const maxArr = data.daily.temperature_2m_max ?? [];
      const minArr = data.daily.temperature_2m_min ?? [];
      return times.map((time, i) => ({
        time,
        label: formatTime(time, "7d"),
        values: {
          "最高気温": maxArr[i] ?? null,
          "最低気温": minArr[i] ?? null,
        },
      })) as ChartDataPoint[];
    }
    if (dailyKey && typeof dailyKey === "string") {
      const arr =
        (data.daily[dailyKey as keyof typeof data.daily] as number[] | undefined) ?? [];
      return times.map((time, i) => ({
        time,
        label: formatTime(time, "7d"),
        values: { [metric.label]: arr[i] ?? null },
      })) as ChartDataPoint[];
    }
    // 体感温度: daily がないので hourly を 7 日分（日ごとに先頭のみ）。time は "YYYY-MM-DD" に統一し複数指標マージ時に気温と一致させる
    if (data.hourly && metric.hourly) {
      const times = data.hourly.time ?? [];
      const arr =
        (data.hourly[metric.hourly as keyof typeof data.hourly] as number[] | undefined) ?? [];
      const points: ChartDataPoint[] = [];
      let day = "";
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const d = t.slice(0, 10);
        if (d !== day) {
          day = d;
          points.push({
            time: d,
            label: formatTime(t, "7d"),
            values: { [metric.label]: arr[i] ?? null },
          });
        }
      }
      return points.slice(0, 7);
    }
  }

  return [];
}

/**
 * 複数指標を1つのチャート用データにマージ（任意拡張: 多系列重ね描き）
 */
export function transformToChartDataMulti(
  data: OpenMeteoForecastResponse,
  metricIds: MetricId[],
  period: PeriodKind
): ChartDataPoint[] {
  if (metricIds.length === 0) return [];
  if (metricIds.length === 1) return transformToChartData(data, metricIds[0], period);

  const byTime = new Map<string, ChartDataPoint>();
  for (const metricId of metricIds) {
    const points = transformToChartData(data, metricId, period);
    for (const p of points) {
      const existing = byTime.get(p.time);
      if (existing) {
        existing.values = { ...existing.values, ...p.values };
      } else {
        byTime.set(p.time, { ...p, values: { ...p.values } });
      }
    }
  }
  return Array.from(byTime.values()).sort((a, b) => a.time.localeCompare(b.time));
}
