const TZ = "Asia/Tokyo";

/** 日本時間で今日の日付文字列 YYYY-MM-DD */
export function getTodayJST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/** 日本時間で日付を加算した YYYY-MM-DD */
export function addDaysJST(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00+09:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** 開始日オプション（0=今日, 1=明日, ...） period に応じた最大日数 */
export function getStartDayOffsetMax(period: "48h" | "7d"): number {
  return period === "48h" ? 1 : 6;
}

export interface StartDateOption {
  offset: number;
  label: string;
  dateStr: string;
}

/** 開始日の選択肢を生成（常に現在日から。Open-Meteo は過去・任意開始日非対応） */
export function getStartDateOptions(period: "48h" | "7d"): StartDateOption[] {
  const today = getTodayJST();
  const max = getStartDayOffsetMax(period);
  const labels = ["今日", "明日", "明後日", "3日後", "4日後", "5日後", "6日後"];
  const options: StartDateOption[] = [];
  for (let i = 0; i <= max; i++) {
    const dateStr = i === 0 ? today : addDaysJST(today, i);
    const [y, m, d] = dateStr.split("-").map(Number);
    const label = i === 0 ? "今日（現在から）" : `${m}/${d}（${labels[i]}）`;
    options.push({ offset: i, label, dateStr });
  }
  return options;
}

/** ポイントの time (ISO) が指定日以降か（日本時間の日付で比較） */
export function isPointOnOrAfterDate(pointTime: string, fromDateStr: string): boolean {
  const pointDate = pointTime.slice(0, 10);
  return pointDate >= fromDateStr;
}
