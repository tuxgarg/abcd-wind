import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DecisionControlBar } from './components/DecisionControlBar';
import { KPICards } from './components/KPICards';
import { TradingRecommendation } from './components/TradingRecommendation';
import { ForecastVsActualChart } from './components/ForecastVsActualChart';
import { HourlyErrorChart } from './components/HourlyErrorChart';
import { MonthlyOverview } from './components/MonthlyOverview';
import { fetchAvailableDates, fetchDayAheadData, fetchHealth } from './api';
import { DayAheadResponse } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-01');
  const [cutoffHour, setCutoffHour] = useState<number>(11);
  const [imbalancePrice, setImbalancePrice] = useState<number>(95);
  const [viewMode, setViewMode] = useState<'half-hour' | 'hourly'>('half-hour');

  const [dayData, setDayData] = useState<DayAheadResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedCount, setCachedCount] = useState<{ actuals: number; forecasts: number } | undefined>();

  // Load initial dates and health check
  useEffect(() => {
    fetchHealth()
      .then((h) => setCachedCount({ actuals: h.cachedActuals, forecasts: h.cachedForecasts }))
      .catch((e) => console.warn('Health check issue:', e));

    fetchAvailableDates()
      .then((dates) => {
        setAvailableDates(dates);
        if (dates.length > 0 && !dates.includes(selectedDate)) {
          setSelectedDate(dates[0]);
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  // Fetch day-ahead data whenever date, cutoffHour, or imbalancePrice changes
  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    fetchDayAheadData(selectedDate, cutoffHour, 0, imbalancePrice)
      .then((res) => {
        setDayData(res);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [selectedDate, cutoffHour, imbalancePrice]);

  const handleSelectDateFromMonthly = (date: string) => {
    setSelectedDate(date);
    setActiveTab('daily');
  };

  const chartData = viewMode === 'half-hour' ? dayData?.periods ?? [] : dayData?.hourlyData ?? [];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cachedCount={cachedCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'daily' ? (
          <>
            {/* Decision Gate-Closure, Cash-Out Price & Date Controls */}
            <DecisionControlBar
              availableDates={availableDates}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              cutoffHour={cutoffHour}
              onCutoffChange={setCutoffHour}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              imbalancePrice={imbalancePrice}
              onImbalancePriceChange={setImbalancePrice}
              decisionDay={dayData?.decisionDay}
            />

            {error ? (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex items-start space-x-3 text-rose-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <h4 className="font-bold text-sm">Failed to load data for {selectedDate}</h4>
                  <p className="text-xs mt-1 text-rose-300/80">{error}</p>
                  <button
                    onClick={() => setSelectedDate(selectedDate)}
                    className="mt-3 px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg flex items-center space-x-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Request</span>
                  </button>
                </div>
              </div>
            ) : loading || !dayData ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs font-medium text-slate-400">
                  Retrieving Day-Ahead wind forecast snapshot for {selectedDate}...
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Quantitative KPI Metric Cards (including £ Financial Exposure) */}
                <KPICards metrics={dayData.metrics} />

                {/* 2. Procurement Trading Insight & Risk Banner */}
                <TradingRecommendation recommendation={dayData.recommendation} />

                {/* 3. Primary Time Series Chart: Forecast vs Actual */}
                <ForecastVsActualChart
                  data={chartData}
                  viewMode={viewMode}
                  cutoffHour={cutoffHour}
                />

                {/* 4. Residuals & Directional Deviation Bar Chart */}
                <HourlyErrorChart data={chartData} viewMode={viewMode} />
              </div>
            )}
          </>
        ) : (
          <MonthlyOverview
            cutoffHour={cutoffHour}
            imbalancePrice={imbalancePrice}
            onSelectDate={handleSelectDateFromMonthly}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            Data sourced from <a href="https://bmrs.elexon.co.uk" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-400 underline">Elexon BMRS</a> datasets (<code className="text-slate-300">FUELHH</code> and <code className="text-slate-300">WINDFOR</code>).
          </div>
          <div className="flex items-center space-x-4">
            <span>Built with React + FastAPI</span>
            <span>•</span>
            <span>Financial Imbalance Engine (£/MWh)</span>
            <span>•</span>
            <span>UK Day-Ahead Wholesale Power</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
