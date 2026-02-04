/**
 * Open-Meteo Forecast API レスポンス型
 * @see https://open-meteo.com/en/docs/forecast-api
 */
export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly?: {
    time: string[];
    temperature_2m?: number[];
    apparent_temperature?: number[];
    precipitation?: number[];
    windspeed_10m?: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    windspeed_10m_max?: number[];
  };
}

/** チャート用に正規化した1点 */
export interface ChartDataPoint {
  time: string;
  /** 表示用ラベル（時刻 or 日付） */
  label: string;
  /** 系列ごとの値 { 系列名: 値 }（欠損は null） */
  values: Record<string, number | null>;
}
