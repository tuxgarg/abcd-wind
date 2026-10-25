import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { PeriodData, HourlyData } from '../types';

interface HourlyErrorChartProps {
  data: (PeriodData | HourlyData)[];
  viewMode: 'half-hour' | 'hourly';
}

export const HourlyErrorChart: React.FC<HourlyErrorChartProps> = ({ data, viewMode }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      const error = p.errorMw;
      const isSurplus = error > 0;

      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
            Time: {label} UTC
          </div>
          <div className="flex items-center justify-between space-x-3">
            <span className="text-slate-400">Deviation:</span>
            <span
              className={`font-mono font-bold ${
                isSurplus ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isSurplus ? `+${error?.toLocaleString()}` : error?.toLocaleString()} MW
            </span>
          </div>
          <div className="text-[10px] text-slate-500 pt-1">
            {isSurplus
              ? 'Wind generation exceeded Day-Ahead forecast (System Surplus)'
              : 'Wind generation fell short of Day-Ahead forecast (Imbalance Deficit)'}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Forecast Deviation Profile (Residuals)</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Error (Actual − Forecast). Green = Surplus wind; Red = Deficit (unmet generation).
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
            <span className="text-slate-300">Surplus</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded bg-rose-500"></div>
            <span className="text-slate-300">Shortfall</span>
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
              unit=" MW"
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
            <Bar dataKey="errorMw" name="Error (MW)" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => {
                const val = entry.errorMw ?? 0;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={val >= 0 ? '#10b981' : '#f43f5e'}
                    fillOpacity={0.85}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
