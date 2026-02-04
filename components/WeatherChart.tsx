"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/lib/types";
import { useMemo, useCallback } from "react";

const COLORS = ["#22d3ee", "#e879f9", "#34d399", "#818cf8"];

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

  if (flatData.length === 0) {
    return (
      <div
        className="chart-panel flex h-[340px] items-center justify-center rounded-xl border border-white/10 bg-[var(--chart-bg-panel)] text-[var(--chart-axis-neon)] text-sm"
        role="status"
        aria-label="チャートデータなし"
      >
        表示するデータがありません
      </div>
    );
  }

  const singleUnit = seriesNames.length === 1 ? getUnit(seriesNames[0]) : null;

  const renderTooltip = useCallback(
    (props: unknown) => {
      const { active, payload, label } = (props as { active?: boolean; payload?: readonly { name?: string; value?: number; color?: string }[]; label?: string });
      if (!active || !payload?.length) return null;
      return (
        <div
          className="chart-tooltip"
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            minWidth: "220px",
            padding: "14px 18px",
            borderRadius: "12px",
            border: "1px solid var(--chart-tooltip-border-neon)",
            background: "var(--chart-tooltip-bg-neon)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.1)",
            fontSize: "14px",
            color: "var(--chart-tooltip-text)",
            zIndex: 10,
            pointerEvents: "none",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 10, color: "var(--chart-tooltip-text)", letterSpacing: "0.02em" }}>
            {label}
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
                  gap: 16,
                  marginTop: 6,
                }}
              >
                <span style={{ color: "var(--chart-tooltip-label)" }}>{entry.name}</span>
                <span style={{ fontWeight: 600, color: entry.color ?? "#22d3ee" }}>
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
      className="chart-panel relative h-[340px] w-full overflow-hidden rounded-xl border border-white/10 bg-[var(--chart-bg-panel)]"
      role="img"
      aria-label="天気予報の折れ線グラフ"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={flatData}
          margin={{ top: 52, right: 16, left: 8, bottom: 24 }}
        >
          <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid-neon)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--chart-axis-neon)", letterSpacing: "0.02em" }}
            tickLine={false}
            axisLine={{ stroke: "var(--chart-grid-neon)" }}
            interval="preserveStartEnd"
            minTickGap={32}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--chart-axis-neon)", letterSpacing: "0.02em" }}
            tickLine={false}
            axisLine={{ stroke: "var(--chart-grid-neon)" }}
            width={52}
            tickFormatter={(v) => {
              if (typeof v !== "number") return "";
              const u = singleUnit ?? "";
              return u ? `${v} ${u}` : `${v}`;
            }}
          />
          <Tooltip
            content={renderTooltip}
            cursor={{ stroke: "var(--chart-cursor-neon)", strokeWidth: 1 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(name) => {
              const u = seriesUnits?.[name];
              return (
                <span style={{ color: "var(--chart-axis-neon)" }}>
                  {name}
                  {u ? ` (${u})` : ""}
                </span>
              );
            }}
          />
          {seriesNames.map((name, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={color}
                strokeWidth={2.2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: color,
                  stroke: "rgba(255,255,255,0.9)",
                  strokeWidth: 1.5,
                }}
                connectNulls
                isAnimationActive={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
