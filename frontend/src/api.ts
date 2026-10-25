import { DayAheadResponse, MonthlyOverviewResponse } from './types';

export async function fetchAvailableDates(): Promise<string[]> {
  const res = await fetch('/api/available-dates');
  if (!res.ok) throw new Error('Failed to fetch available dates');
  const data = await res.json();
  return data.dates;
}

export async function fetchDayAheadData(
  date: string,
  cutoffHour: number = 11,
  cutoffMinute: number = 0,
  imbalancePrice: number = 95
): Promise<DayAheadResponse> {
  const url = `/api/day-ahead?date=${date}&cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}&imbalance_price=${imbalancePrice}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Network response error' }));
    throw new Error(err.detail || 'Failed to fetch day-ahead data');
  }
  return res.json();
}

export async function fetchMonthlyMetrics(
  cutoffHour: number = 11,
  cutoffMinute: number = 0,
  imbalancePrice: number = 95
): Promise<MonthlyOverviewResponse> {
  const url = `/api/monthly-metrics?cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}&imbalance_price=${imbalancePrice}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Network response error' }));
    throw new Error(err.detail || 'Failed to fetch monthly metrics');
  }
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; cachedActuals: number; cachedForecasts: number }> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}
