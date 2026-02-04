"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/lib/types";
import React, { useMemo, useCallback } from "react";

/** グラフ用固定パレット（色相を離して被らない） */
const FIXED_PALETTE = ["#22d3ee", "#e879f9", "#34d399", "#fbbf24", "#0ea5e9", "#38bdf8"] as const;

/** 系列名 → 固定色（常に同じ指標は同じ色、被りなし） */
const SERIES_COLOR_MAP: Record<string, string> = {
  "気温": FIXED_PALETTE[0],
  "体感温度": FIXED_PALETTE[1],
  "降水量": FIXED_PALETTE[2],
  "風速": FIXED_PALETTE[3],
  "最高気温": FIXED_PALETTE[4],
  "最低気温": FIXED_PALETTE[5],
};

function getSeriesColor(seriesName: string, index: number): string {
  return SERIES_COLOR_MAP[seriesName] ?? FIXED_PALETTE[index % FIXED_PALETTE.length];
}

/** 系列名 → 表示単位（複数指標時は系列ごと） */
export type SeriesUnits = Record<string, string>;

interface WeatherChartProps {
  data: ChartDataPoint[];
  period: "48h" | "7d";
  unit?: string;
  seriesUnits?: SeriesUnits;
}

/** 降水量は0未満を表示しない（データ・表示の二重ガード） */
function clampPrecipitationValue(v: number | null | undefined, key: string): number | undefined {
  if (v == null) return undefined;
  return key === "降水量" ? Math.max(0, Number(v)) : Number(v);
}

function flattenChartData(
  data: ChartDataPoint[]
): Record<string, string | number | undefined>[] {
  if (data.length === 0) return [];
  const keys = new Set<string>();
  for (const d of data) {
    for (const k of Object.keys(d.values)) keys.add(k);
  }
  const keyList = Array.from(keys);
  return data.map((d) => {
    const row: Record<string, string | number | undefined> = { label: d.label };
    for (const k of keyList) {
      const v = d.values[k];
      row[k] = v == null ? undefined : clampPrecipitationValue(v, k);
    }
    return row;
  });
}

export function WeatherChart({ data, period, unit = "", seriesUnits }: WeatherChartProps) {
  const flatData = useMemo(() => flattenChartData(data), [data]);
  const seriesNames = useMemo(() => {
    if (data.length === 0) return [];
    const keys = new Set<string>();
    for (const p of data) {
      for (const k of Object.keys(p.values)) keys.add(k);
    }
    return Array.from(keys);
  }, [data]);
  const getUnit = useCallback(
    (name: string) => (seriesUnits ? seriesUnits[name] ?? "" : unit),
    [seriesUnits, unit]
  );

  const is48h = period === "48h";

  if (flatData.length === 0) {
    return (
      <div
        className="flex h-[360px] items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-white/40 text-[var(--text-muted)] text-sm shadow-[var(--glass-shadow)] backdrop-blur-xl"
        role="status"
        aria-label="チャートデータなし"
      >
        表示するデータがありません
      </div>
    );
  }

  const singleUnit = seriesNames.length === 1 ? getUnit(seriesNames[0]) : null;

  /** ツールチップ：グラフ上端に固定、横だけデータに合わせてちょこちょこ動く・凡例の手前に表示 */
  const renderTooltip = useCallback(
    (props: unknown) => {
      const p = props as {
        active?: boolean;
        payload?: readonly { name?: string; value?: number; color?: string }[];
        label?: string;
        coordinate?: { x?: number; y?: number };
      };
      const { active, payload, label, coordinate } = p;
      if (!active || !payload?.length) return null;
      const cx = coordinate?.x ?? 0;
      return (
        <div
          className="chart-tooltip"
          style={{
            position: "absolute",
            top: -28,
            left: cx,
            transform: "translate(-50%, 0)",
            minWidth: "200px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--chart-tooltip-border)",
            background: "var(--chart-tooltip-bg)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            backdropFilter: "blur(14px)",
            fontSize: "13px",
            color: "var(--text)",
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: "13px", color: "var(--text)" }}>
            {label}
          </div>
          {payload.map((entry) => {
            const name = entry.name ?? "";
            const u = getUnit(name);
            const rawVal = entry.value != null && typeof entry.value === "number" ? entry.value : null;
            const displayVal = rawVal != null ? (name === "降水量" ? Math.max(0, rawVal) : rawVal) : null;
            const val = displayVal != null ? `${displayVal} ${u}` : "—";
            const color = getSeriesColor(name, seriesNames.indexOf(name));
            return (
              <div
                key={entry.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  marginTop: 4,
                  fontSize: "12px",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>{entry.name}</span>
                <span style={{ fontWeight: 600, color: color ?? entry.color ?? "var(--accent)" }}>
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      );
    },
    [getUnit, seriesNames]
  );

  return (
    <div
      className="relative h-[360px] w-full overflow-visible rounded-2xl border border-[var(--glass-border)] bg-white/40 shadow-[var(--glass-shadow)] backdrop-blur-xl"
      role="img"
      aria-label="天気予報の折れ線グラフ（時系列）"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" aria-hidden />
      <div className="relative h-full w-full px-3 pt-2 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={flatData}
            margin={{ top: 52, right: 16, left: 4, bottom: 24 }}
          >
            <defs>
              {seriesNames.map((name, i) => {
                const color = getSeriesColor(name, i);
                return (
                  <linearGradient
                    key={name}
                    id={`area-grad-${i}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={is48h ? 0 : 0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="var(--chart-grid)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "var(--chart-axis)", fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
              interval="preserveStartEnd"
              minTickGap={32}
            />
            <YAxis
              domain={
                seriesNames.length === 1 && seriesNames[0] === "降水量"
                  ? [0, "auto"]
                  : undefined
              }
              tick={{ fontSize: 12, fill: "var(--chart-axis)", fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
              width={52}
              tickFormatter={(v) => {
                if (typeof v !== "number") return "";
                const u = singleUnit ?? "";
                return u ? `${v} ${u}` : `${v}`;
              }}
            />
            <Tooltip
              content={renderTooltip}
              cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1, strokeOpacity: 0.3 }}
              wrapperStyle={{ outline: "none", zIndex: 100 }}
              contentStyle={{ margin: 0, padding: 0, border: "none", background: "transparent", boxShadow: "none" }}
            />
            <Legend
              content={() => (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px 14px",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    zIndex: 5,
                  }}
                >
                  {seriesNames.map((name, i) => {
                    const color = getSeriesColor(name, i);
                    const u = seriesUnits?.[name];
                    return (
                      <span
                        key={name}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          color: "var(--text)",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: color,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>
                          {name}
                          {u ? (
                            <span style={{ fontWeight: 400, opacity: 0.85 }}> ({u})</span>
                          ) : (
                            ""
                          )}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
              wrapperStyle={{ zIndex: 5 }}
            />
            {seriesNames.map((name, i) => {
              const color = getSeriesColor(name, i);
              const gradientId = `area-grad-${i}`;
              const lineType = name === "降水量" ? "linear" : is48h ? "linear" : "natural";
              const dotR = is48h ? 4 : 3;
              const activeR = is48h ? 5 : 4;
              const strokeW = is48h ? 2 : 1.5;
              /** ドット・activeDot をすべて丸で統一（Recharts の既定形状に依存しない） */
              const renderCircleDot =
                (r: number) =>
                (props: { cx?: number; cy?: number }) => {
                  const { cx = 0, cy = 0 } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={color}
                      stroke="#fff"
                      strokeWidth={strokeW}
                    />
                  );
                };
              return (
                <React.Fragment key={name}>
                  {!is48h && (
                    <Area
                      type="monotone"
                      dataKey={name}
                      fill={`url(#${gradientId})`}
                      stroke="none"
                      connectNulls
                      isAnimationActive={false}
                      hide
                      legendType="none"
                    />
                  )}
                  <Line
                    type={lineType}
                    dataKey={name}
                    name={name}
                    stroke={color}
                    strokeWidth={is48h ? 1.2 : 2.2}
                    strokeDasharray={is48h ? "4 4" : undefined}
                    dot={renderCircleDot(dotR)}
                    activeDot={renderCircleDot(activeR)}
                    connectNulls
                    isAnimationActive={false}
                  />
                </React.Fragment>
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
