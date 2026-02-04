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

const COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b"];

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
        className="flex h-[360px] items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-white/40 text-[var(--text-muted)] text-sm shadow-[var(--glass-shadow)] backdrop-blur-xl"
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
            minWidth: "200px",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "1px solid var(--chart-tooltip-border)",
            background: "var(--chart-tooltip-bg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            backdropFilter: "blur(12px)",
            fontSize: "14px",
            color: "var(--text)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>
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
                  marginTop: 4,
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>{entry.name}</span>
                <span style={{ fontWeight: 600, color: entry.color ?? "var(--accent)" }}>
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
      className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-white/40 shadow-[var(--glass-shadow)] backdrop-blur-xl"
      role="img"
      aria-label="天気予報の折れ線グラフ（時系列）"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" aria-hidden />
      <div className="relative h-full w-full px-3 pt-2 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={flatData}
            margin={{ top: 56, right: 16, left: 4, bottom: 24 }}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 13, fill: "var(--chart-axis)", fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(148,163,184,0.25)", strokeWidth: 1 }}
            interval="preserveStartEnd"
            minTickGap={36}
          />
          <YAxis
            tick={{ fontSize: 13, fill: "var(--chart-axis)", fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(148,163,184,0.25)", strokeWidth: 1 }}
            width={56}
            tickFormatter={(v) => {
              if (typeof v !== "number") return "";
              const u = singleUnit ?? "";
              return u ? `${v} ${u}` : `${v}`;
            }}
          />
          <Tooltip
            content={renderTooltip}
            cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1.5, strokeOpacity: 0.4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 14, fontWeight: 600 }}
            iconType="circle"
            iconSize={10}
            formatter={(name) => {
              const u = seriesUnits?.[name];
              return (
                <span style={{ color: "var(--chart-axis)", fontWeight: 600 }}>
                  {name}
                  {u ? <span style={{ fontWeight: 400, opacity: 0.9 }}> ({u})</span> : ""}
                </span>
              );
            }}
          />
          {seriesNames.map((name, i) => {
            const color = COLORS[i % COLORS.length];
            const dotConfig =
              period === "48h"
                ? {
                    r: 4.5,
                    fill: color,
                    stroke: "#fff",
                    strokeWidth: 2,
                  }
                : period === "7d"
                  ? { r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }
                  : false;
            return (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                name={name}
                stroke={color}
                strokeWidth={2.5}
                dot={dotConfig}
                activeDot={{
                  r: 6,
                  fill: color,
                  stroke: "#fff",
                  strokeWidth: 2.5,
                }}
                connectNulls
                isAnimationActive={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
