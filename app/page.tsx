"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CitySelect } from "@/components/CitySelect";
import { MetricMultiSelect } from "@/components/MetricMultiSelect";
import { PeriodToggle } from "@/components/PeriodToggle";
import { StartDateDisplay } from "@/components/StartDateDisplay";
import { UnitToggles } from "@/components/UnitToggles";
import { WeatherChart } from "@/components/WeatherChart";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { CITIES, METRICS } from "@/lib/constants";
import type {
  CityId,
  MetricId,
  PeriodKind,
  TempUnit,
  WindUnit,
} from "@/lib/constants";
import { getTodayJST, isPointOnOrAfterDate } from "@/lib/dates";
import { fetchForecast } from "@/lib/api";
import {
  transformToChartData,
  transformToChartDataMulti,
} from "@/lib/transform";
import { applyUnitConversion } from "@/lib/chartConvert";
import { loadPrefs, savePrefs } from "@/lib/storage";
import type { OpenMeteoForecastResponse } from "@/lib/types";

export default function Home() {
  const [cityId, setCityId] = useState<CityId>("tokyo");
  const [metricIds, setMetricIds] = useState<MetricId[]>(() => ["temperature_2m" as MetricId]);
  const [period, setPeriod] = useState<PeriodKind>("7d");
  const [tempUnit, setTempUnit] = useState<TempUnit>("C");
  const [windUnit, setWindUnit] = useState<WindUnit>("km/h");
  const [raw, setRaw] = useState<OpenMeteoForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const city = useMemo(
    () => CITIES.find((c) => c.id === cityId) ?? CITIES[0],
    [cityId]
  );
  const safeMetricIds = useMemo((): MetricId[] => {
    if (metricIds.length === 0) return ["temperature_2m"];
    return metricIds;
  }, [metricIds]);

  useEffect(() => {
    const p = loadPrefs();
    setCityId(p.cityId);
    setMetricIds(
      p.metricIds.length > 0 ? (p.metricIds as MetricId[]) : (["temperature_2m"] as MetricId[])
    );
    setPeriod(p.period);
    setTempUnit(p.tempUnit);
    setWindUnit(p.windUnit);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      savePrefs({
        cityId,
        metricIds: safeMetricIds as MetricId[],
        period,
        startDayOffset: 0,
        tempUnit,
        windUnit,
      });
    }, 100);
    return () => clearTimeout(t);
  }, [cityId, safeMetricIds, period, tempUnit, windUnit]);

  const loadIdRef = useRef(0);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const id = ++loadIdRef.current;
    const timeoutId = setTimeout(() => {
      if (id === loadIdRef.current) {
        setLoading(false);
        setError("読み込みがタイムアウトしました。ネットワークを確認して「再試行」を押してください。");
      }
    }, 12000);
    try {
      const data = await fetchForecast({
        latitude: city.lat,
        longitude: city.lon,
        period,
        metricId: safeMetricIds[0],
      });
      if (id !== loadIdRef.current) return;
      setRaw(data);
    } catch (e) {
      if (id !== loadIdRef.current) return;
      setError(e instanceof Error ? e.message : "データの取得に失敗しました");
      setRaw(null);
    } finally {
      clearTimeout(timeoutId);
      if (id === loadIdRef.current) setLoading(false);
    }
  }, [city.lat, city.lon, period, safeMetricIds]);

  useEffect(() => {
    load();
  }, [load]);

  const fromDateStr = getTodayJST();

  const chartDataRaw = useMemo(() => {
    if (!raw) return [];
    return safeMetricIds.length === 1
      ? transformToChartData(raw, safeMetricIds[0] as MetricId, period)
      : transformToChartDataMulti(raw, safeMetricIds as MetricId[], period);
  }, [raw, safeMetricIds, period]);

  const chartDataFiltered = useMemo(() => {
    return chartDataRaw.filter((p) => isPointOnOrAfterDate(p.time, fromDateStr));
  }, [chartDataRaw, fromDateStr]);

  const { data: chartDataConverted, seriesUnits } = useMemo(
    () =>
      applyUnitConversion(
        chartDataFiltered,
        safeMetricIds as MetricId[],
        tempUnit,
        windUnit
      ),
    [chartDataFiltered, safeMetricIds, tempUnit, windUnit]
  );

  const periodLabel = period === "48h" ? "48時間" : "7日間";
  const metricLabel =
    safeMetricIds.length === 1
      ? METRICS.find((m) => m.id === safeMetricIds[0])?.label ?? ""
      : `${safeMetricIds.length}指標`;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* 看板風ヘッダー：枠・影で「貼られた看板」の雰囲気 */}
      <header
        className="relative border-b-[3px] border-[var(--signboard-accent)] bg-[var(--signboard)] text-[var(--signboard-text)] shadow-[var(--signboard-shadow)]"
        role="banner"
      >
        <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
          <div className="rounded border border-[var(--signboard-border)] bg-[var(--signboard)]/50 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--signboard-text)] sm:text-3xl">
                天気時系列
              </h1>
              <span className="text-sm font-semibold uppercase tracking-wider text-[var(--signboard-accent-bright)]">
                Weather Forecast
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--signboard-text-subtle)]">
              Open-Meteo 予報を現在日から表示
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <section
          className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]"
          aria-label="条件選択"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <CitySelect
              value={cityId}
              onChange={setCityId}
              disabled={loading}
            />
            <StartDateDisplay />
            <div className="sm:col-span-2">
              <PeriodToggle
                value={period}
                onChange={setPeriod}
                disabled={loading}
              />
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <MetricMultiSelect
              selectedIds={safeMetricIds as MetricId[]}
              onChange={setMetricIds}
              disabled={loading}
            />
            <UnitToggles
              tempUnit={tempUnit}
              windUnit={windUnit}
              onTempChange={setTempUnit}
              onWindChange={setWindUnit}
              disabled={loading}
              selectedMetricIds={safeMetricIds as MetricId[]}
            />
          </div>
        </section>

        <section
          className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]"
          aria-label="チャート"
        >
          <h2 className="mb-4 text-sm font-semibold text-[var(--text)]">
            {city.name} — {metricLabel}（{periodLabel}）
          </h2>
          {loading && <LoadingSpinner />}
          {error && !loading && (
            <ErrorMessage message={error} onRetry={load} />
          )}
          {!loading && !error && raw && (
            <WeatherChart
              data={chartDataConverted}
              period={period}
              seriesUnits={seriesUnits}
            />
          )}
        </section>

        <footer className="mt-10 rounded-lg border border-[var(--card-border)] bg-[var(--bg-card)] px-4 py-4 text-center text-xs text-[var(--text-subtle)] shadow-[var(--card-shadow)]">
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
          >
            Open-Meteo
          </a>
          {" "}Forecast API
        </footer>
      </main>
    </div>
  );
}
