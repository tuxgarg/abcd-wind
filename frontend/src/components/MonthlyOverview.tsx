import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { MonthlyOverviewResponse } from '../types';
import { fetchMonthlyMetrics } from '../api';
import { Award, AlertOctagon, Calendar, BarChart2, PoundSterling } from 'lucide-react';

interface MonthlyOverviewProps {
  cutoffHour: number;
  imbalancePrice: number;
  onSelectDate: (date: string) => void;
}

export const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({ cutoffHour, imbalancePrice, onSelectDate }) => {
  const [data, setData] = useState<MonthlyOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchMonthlyMetrics(cutoffHour, 0, imbalancePrice)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [cutoffHour, imbalancePrice]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm text-slate-400">Aggregating 31-day January 2026 performance & financial exposure...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
        Failed to load monthly summary: {error}
      </div>
    );
  }

  const { overall, dailyMetrics, diurnalProfile } = data;
  const totalPenalty = overall.totalPenaltyExposureGbp ?? 0;
  const formattedMonthPenalty =
    totalPenalty >= 1_000_000
      ? `£${(totalPenalty / 1_000_000).toFixed(2)}M`
      : `£${(totalPenalty / 1_000).toFixed(0)}k`;

  return (
    <div className="space-y-6">
      {/* 1. Month-wide High Level Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            January 2026 Total Output
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {(overall.totalActualMwh / 1_000_000).toFixed(2)} <span className="text-xs text-slate-400 font-normal">TWh</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Forecasted: {(overall.totalForecastMwh / 1_000_000).toFixed(2)} TWh
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Month-Wide MAE
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {overall.maeMw.toLocaleString()} <span className="text-xs text-slate-400 font-normal">MW</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Overall MAPE: <strong className="text-slate-200">{overall.mapePct.toFixed(1)}%</strong>
          </div>
        </div>

        {/* Financial Imbalance Risk Card */}
        <div className="bg-gradient-to-br from-slate-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-4 shadow-lg">
          <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center">
            <PoundSterling className="w-3.5 h-3.5 mr-0.5" />
            Total Month Penalty Risk
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono mt-1">
            {formattedMonthPenalty}
          </div>
          <div className="text-xs text-slate-300 mt-2">
            At £{imbalancePrice}/MWh UK cash-out price
          </div>
        </div>

        {overall.bestDay && (
          <div
            onClick={() => onSelectDate(overall.bestDay!.date)}
            className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg cursor-pointer hover:border-emerald-500/60 transition group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center">
                <Award className="w-3.5 h-3.5 mr-1" />
                Best Accuracy Day
              </span>
              <span className="text-[11px] text-emerald-400 group-hover:underline">Inspect →</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">{overall.bestDay.date}</div>
            <div className="text-xs text-slate-300 mt-1">
              Lowest MAE: <strong className="text-emerald-400">{overall.bestDay.maeMw.toLocaleString()} MW</strong>
            </div>
          </div>
        )}

        {overall.worstDay && (
          <div
            onClick={() => onSelectDate(overall.worstDay!.date)}
            className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 shadow-lg cursor-pointer hover:border-rose-500/60 transition group"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center">
                <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                Worst Accuracy Day
              </span>
              <span className="text-[11px] text-rose-400 group-hover:underline">Inspect →</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">{overall.worstDay.date}</div>
            <div className="text-xs text-slate-300 mt-1">
              Highest MAE: <strong className="text-rose-400">{overall.worstDay.maeMw.toLocaleString()} MW</strong>
            </div>
          </div>
        )}
      </div>

      {/* 2. Diurnal Error Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Diurnal Error Profile (Average Error by Settlement Period)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies systematic intra-day accuracy patterns across all 31 days in January 2026.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span className="text-slate-300">Average MAE (MW)</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={diurnalProfile} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={11} interval={3} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} unit=" MW" tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <div className="font-bold text-white">Settlement Period: {label} UTC</div>
                        <div className="text-amber-400">Avg MAE: {p.avgMaeMw?.toLocaleString()} MW</div>
                        <div className="text-slate-400">Avg Bias: {p.avgBiasMw?.toLocaleString()} MW</div>
                        {p.avgPenaltyGbp && (
                          <div className="text-amber-300 font-mono">Avg Penalty: £{p.avgPenaltyGbp?.toLocaleString()}</div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="avgMaeMw" name="Avg MAE (MW)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Daily Summary Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-white mb-3 flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>January 2026 Daily Outturn, Errors & Financial Risk</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Actual Outturn</th>
                <th className="py-3 px-3 text-right">Forecast</th>
                <th className="py-3 px-3 text-right">MAE</th>
                <th className="py-3 px-3 text-right">RMSE</th>
                <th className="py-3 px-3 text-right">Bias (MW)</th>
                <th className="py-3 px-3 text-right">Imbalance Penalty (£)</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {dailyMetrics.map((day) => (
                <tr key={day.date} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-200">{day.date}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">
                    {(day.totalActualMwh / 1000).toFixed(1)} GWh
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">
                    {(day.totalForecastMwh / 1000).toFixed(1)} GWh
                  </td>
                  <td className="py-2.5 px-3 text-right text-white font-semibold">
                    {day.maeMw.toLocaleString()} MW
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {day.rmseMw.toLocaleString()} MW
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        day.meanBiasMw > 100
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          : day.meanBiasMw < -100
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      {day.meanBiasMw > 0 ? `+${day.meanBiasMw.toFixed(0)}` : day.meanBiasMw.toFixed(0)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-300 font-semibold">
                    {day.penaltyGbp ? `£${(day.penaltyGbp / 1000).toFixed(0)}k` : '£0'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onSelectDate(day.date)}
                      className="px-2.5 py-1 text-[11px] font-sans font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-md transition"
                    >
                      View Day
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
