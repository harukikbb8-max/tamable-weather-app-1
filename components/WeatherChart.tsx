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
      row[k] = d.values[k] ?? undefined;
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
        className="flex h-[360px] items-center justify-center rounded-2xl border border-[var(--chart-panel-border)] bg-[var(--chart-panel-bg)] text-[var(--chart-axis-neon)] text-sm backdrop-blur-sm"
        role="status"
        aria-label="チャートデータなし"
      >
        表示するデータがありません
      </div>
    );
  }

  const singleUnit = seriesNames.length === 1 ? getUnit(seriesNames[0]) : null;

  /** ツールチップ：大きく・常に上部固定で見切れない・カーソルと被らない */
  const renderTooltip = useCallback(
    (props: unknown) => {
      const { active, payload, label } = (props as { active?: boolean; payload?: readonly { name?: string; value?: number; color?: string }[]; label?: string });
      if (!active || !payload?.length) return null;
      return (
        <div
          className="chart-tooltip"
          style={{
            position: "relative",
            top: 0,
            left: 0,
            minWidth: "260px",
            padding: "14px 18px",
            borderRadius: "12px",
            border: "1px solid var(--chart-tooltip-border-neon)",
            background: "var(--chart-tooltip-bg-neon)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
            backdropFilter: "blur(16px)",
            fontSize: "15px",
            color: "#e2e8f0",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: "16px", color: "#f8fafc" }}>
            日時: {label}
          </div>
          {payload.map((entry) => {
            const u = getUnit(entry.name ?? "");
            const val =
              entry.value != null && typeof entry.value === "number"
                ? `${entry.value} ${u}`
                : "—";
            return (
              <div
                key={entry.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 20,
                  marginTop: 8,
                  fontSize: "15px",
                }}
              >
                <span style={{ color: "#94a3b8" }}>{entry.name}</span>
                <span style={{ fontWeight: 700, color: entry.color ?? "#22d3ee" }}>
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      );
    },
    [getUnit]
  );

  return (
    <div
      className="relative h-[360px] w-full overflow-visible rounded-2xl border border-[var(--chart-panel-border)] bg-[var(--chart-panel-bg)] shadow-[0 8px 32px rgba(0,0,0,0.2)] backdrop-blur-sm"
      role="img"
      aria-label="天気予報の折れ線グラフ（時系列）"
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl px-3 pt-2 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={flatData}
            margin={{ top: 64, right: 16, left: 4, bottom: 24 }}
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
                    <stop offset="0%" stopColor={color} stopOpacity={is48h ? 0 : 0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="var(--chart-grid-neon)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "var(--chart-axis-neon)", fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid-neon)", strokeWidth: 1 }}
              interval="preserveStartEnd"
              minTickGap={32}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "var(--chart-axis-neon)", fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid-neon)", strokeWidth: 1 }}
              width={52}
              tickFormatter={(v) => {
                if (typeof v !== "number") return "";
                const u = singleUnit ?? "";
                return u ? `${v} ${u}` : `${v}`;
              }}
            />
            <Tooltip
              content={renderTooltip}
              cursor={{ stroke: "rgba(34,211,238,0.4)", strokeWidth: 1 }}
              wrapperStyle={{ outline: "none" }}
              contentStyle={{
                position: "absolute",
                top: 4,
                left: "50%",
                transform: "translateX(-50%)",
                margin: 0,
                padding: 0,
                border: "none",
                background: "transparent",
                boxShadow: "none",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 13, fontWeight: 600 }}
              iconType="circle"
              iconSize={8}
              formatter={(name) => {
                const u = seriesUnits?.[name];
                return (
                  <span style={{ color: "var(--chart-axis-neon)", fontWeight: 600 }}>
                    {name}
                    {u ? <span style={{ fontWeight: 400, opacity: 0.9 }}> ({u})</span> : ""}
                  </span>
                );
              }}
            />
            {seriesNames.map((name, i) => {
              const color = getSeriesColor(name, i);
              const gradientId = `area-grad-${i}`;
              /** ドット：シンプルで洗練（白縁・適度なサイズ）。48h はピボット用にやや大きめ */
              const dotR = is48h ? 3.5 : 2.5;
              const dotConfig = {
                r: dotR,
                fill: color,
                stroke: "rgba(255,255,255,0.95)",
                strokeWidth: 1.5,
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
                    />
                  )}
                  <Line
                    type={is48h ? "linear" : "natural"}
                    dataKey={name}
                    name={name}
                    stroke={color}
                    strokeWidth={is48h ? 1.2 : 2.2}
                    strokeDasharray={is48h ? "4 4" : undefined}
                    dot={dotConfig}
                    activeDot={{
                      r: is48h ? 4.5 : 3.5,
                      fill: color,
                      stroke: "rgba(255,255,255,1)",
                      strokeWidth: 2,
                    }}
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
