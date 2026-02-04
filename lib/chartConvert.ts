import type { ChartDataPoint } from "./types";
import type { MetricId } from "./constants";
import { METRICS } from "./constants";
import type { TempUnit, WindUnit } from "./constants";
import { convertTemp, convertWind, getDisplayUnit } from "./units";

/** 系列名 → 指標ID（変換用） */
const LABEL_TO_METRIC: Record<string, MetricId> = {};
for (const m of METRICS) {
  LABEL_TO_METRIC[m.label] = m.id;
  if (Array.isArray(m.daily) && m.daily.length) {
    LABEL_TO_METRIC["最高気温"] = m.id;
    LABEL_TO_METRIC["最低気温"] = m.id;
  }
}

export interface ConvertedChartData {
  data: ChartDataPoint[];
  seriesUnits: Record<string, string>;
}

/**
 * チャートデータに単位変換を適用し、表示用単位を返す
 */
export function applyUnitConversion(
  data: ChartDataPoint[],
  metricIds: MetricId[],
  tempUnit: TempUnit,
  windUnit: WindUnit
): ConvertedChartData {
  if (data.length === 0) {
    return { data: [], seriesUnits: {} };
  }
  const seriesUnits: Record<string, string> = {};
  const converted = data.map((p) => {
    const values: Record<string, number | null> = {};
    for (const [name, v] of Object.entries(p.values)) {
      const metricId = LABEL_TO_METRIC[name] ?? metricIds[0];
      seriesUnits[name] = getDisplayUnit(metricId, tempUnit, windUnit);
      if (v == null) {
        values[name] = null;
        continue;
      }
      if (metricId === "temperature_2m" || metricId === "apparent_temperature") {
        values[name] = convertTemp(v, tempUnit);
      } else if (metricId === "windspeed_10m") {
        values[name] = convertWind(v, windUnit);
      } else {
        values[name] = v;
      }
    }
    return { ...p, values };
  });
  return { data: converted, seriesUnits };
}
