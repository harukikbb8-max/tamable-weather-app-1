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
    <div className="min-h-screen">
      {/* リキッドグラス風ヘッダー（iPhone天気アプリ風） */}
      <header
        className="relative border-b border-[var(--header-border)] bg-[var(--header-bg)] backdrop-blur-xl"
        role="banner"
      >
        <div className="mx-auto max-w-3xl px-5 py-5 sm:px-8">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              天気時系列
            </h1>
            <span className="text-sm font-medium text-[var(--accent)]">
              Weather Forecast
            </span>
          </div>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            Open-Meteo 予報を現在日から表示
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <section
          className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-[var(--glass-shadow)] backdrop-blur-xl"
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
          className="mt-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-[var(--glass-shadow)] backdrop-blur-xl"
          aria-label="チャート"
        >
          <h2 className="mb-1 text-sm font-semibold text-[var(--text)]">
            {city.name} — {metricLabel}（{periodLabel}）
          </h2>
          <p className="mb-4 text-xs text-[var(--text-muted)]" aria-hidden>
            折れ線グラフ（時系列）
          </p>
          {loading && <LoadingSpinner />}
          {!loading && error && (
            <ErrorMessage message={error} onRetry={load} />
          )}
          {!loading && !error && raw && chartDataConverted.length === 0 && (
            <div
              className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] px-4 py-6 text-center backdrop-blur-sm"
              role="status"
              aria-label="空状態"
            >
              <p className="text-sm text-[var(--text-muted)]">
                表示できるデータがありません。指標や期間を変更してください。
              </p>
              <button
                type="button"
                onClick={load}
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white shadow-[var(--glass-shadow)] transition-colors hover:opacity-90"
              >
                再読み込み
              </button>
            </div>
          )}
          {!loading && !error && raw && chartDataConverted.length > 0 && (
            <WeatherChart
              data={chartDataConverted}
              period={period}
              seriesUnits={seriesUnits}
            />
          )}
        </section>

        <footer className="mt-10 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-4 text-center text-xs text-[var(--text-subtle)] shadow-[var(--glass-shadow)] backdrop-blur-xl">
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
