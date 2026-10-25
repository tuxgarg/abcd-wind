import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { PeriodData, HourlyData } from '../types';
import { Eye } from 'lucide-react';

interface ForecastVsActualChartProps {
  data: (PeriodData | HourlyData)[];
  viewMode: 'half-hour' | 'hourly';
  cutoffHour: number;
}

export const ForecastVsActualChart: React.FC<ForecastVsActualChartProps> = ({
  data,
  viewMode,
  cutoffHour,
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      const actual = p.actualMw;
      const forecast = p.forecastMw;
      const diff = forecast !== null ? actual - forecast : null;
      const sp = p.settlementPeriod;

      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-semibold text-slate-200">
            <span>Time: {label} UTC</span>
            {sp && <span className="text-[11px] font-mono text-slate-400">SP {sp}</span>}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-emerald-400 flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1.5"></span>
              Actual Outturn:
            </span>
            <span className="font-mono font-bold text-white">{actual?.toLocaleString()} MW</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-cyan-400 flex items-center">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block mr-1.5"></span>
              Day-Ahead Forecast:
            </span>
            <span className="font-mono font-bold text-white">
              {forecast !== null ? `${forecast?.toLocaleString()} MW` : 'N/A'}
            </span>
          </div>

          {diff !== null && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Variance (Act - Fc):</span>
              <span
                className={`font-mono font-bold ${
                  diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-200'
                }`}
              >
                {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()} MW
              </span>
            </div>
          )}

          {p.publishTime && (
            <div className="text-[10px] text-slate-500 pt-1">
              Forecast issued: {new Date(p.publishTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Day-Ahead Forecast vs Actual Wind Generation</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-normal">
              {viewMode === 'half-hour' ? '48 Settlement Periods (30m)' : '24 Hourly Averages'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compares outturn wind generation against the latest forecast published before {cutoffHour}:00 UTC on D-1.
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-300 font-medium">Actual Generation</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-1 bg-cyan-400 rounded"></div>
            <span className="text-slate-300 font-medium">Day-Ahead Forecast</span>
          </div>
        </div>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={viewMode === 'half-hour' ? 3 : 1}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="actualMw"
              name="Actual Generation"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#actualGradient)"
            />
            <Line
              type="monotone"
              dataKey="forecastMw"
              name="Day-Ahead Forecast"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
