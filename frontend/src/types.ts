export interface FinancialMetrics {
  imbalancePriceGbp: number;
  totalShortfallMwh: number;
  totalSurplusMwh: number;
  cashoutPenaltyExposureGbp: number;
  surplusDiscountLossGbp: number;
  totalFinancialExposureGbp: number;
}

export interface Metrics {
  maeMw: number;
  rmseMw: number;
  mapePct: number;
  meanBiasMw: number;
  biasDirection: 'OVER_PREDICTION' | 'UNDER_PREDICTION' | 'BALANCED';
  totalActualMwh: number;
  totalForecastMwh: number;
  energyVarianceMwh: number;
  validPeriods: number;
  totalPeriods: number;
  financial?: FinancialMetrics;
}

export interface PeriodData {
  settlementPeriod: number;
  startTime: string;
  timeLabel: string;
  actualMw: number;
  forecastMw: number | null;
  publishTime: string | null;
  errorMw: number | null;
  biasMw: number | null;
  pctError: number | null;
  penaltyGbp: number | null;
  status: 'shortfall' | 'surplus' | 'accurate';
}

export interface HourlyData {
  hour: number;
  timeLabel: string;
  actualMw: number;
  forecastMw: number | null;
  errorMw: number | null;
  biasMw: number | null;
  penaltyGbp?: number;
}

export interface TradingRecommendation {
  headline: string;
  badgeType: 'danger' | 'warning' | 'success';
  text: string;
  financialExposureGbp?: number;
  criticalShortfallPeriods: string[];
  criticalSurplusPeriods: string[];
}

export interface DayAheadResponse {
  deliveryDate: string;
  cutoffTime: string;
  decisionDay: string;
  metrics: Metrics;
  recommendation: TradingRecommendation;
  periods: PeriodData[];
  hourlyData: HourlyData[];
}

export interface DailySummaryMetric {
  date: string;
  maeMw: number;
  rmseMw: number;
  mapePct: number;
  meanBiasMw: number;
  totalActualMwh: number;
  totalForecastMwh: number;
  varianceMwh: number;
  penaltyGbp?: number;
}

export interface DiurnalPoint {
  settlementPeriod: number;
  timeLabel: string;
  avgMaeMw: number;
  avgBiasMw: number;
  avgPenaltyGbp?: number;
}

export interface MonthlyOverviewResponse {
  datesCount: number;
  cutoffHour: number;
  cutoffMinute: number;
  imbalancePriceGbp: number;
  overall: {
    maeMw: number;
    rmseMw: number;
    mapePct: number;
    meanBiasMw: number;
    totalActualMwh: number;
    totalForecastMwh: number;
    energyVarianceMwh: number;
    totalPenaltyExposureGbp?: number;
    bestDay?: DailySummaryMetric;
    worstDay?: DailySummaryMetric;
  };
  dailyMetrics: DailySummaryMetric[];
  diurnalProfile: DiurnalPoint[];
}
