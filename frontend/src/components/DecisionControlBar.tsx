import React from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, HelpCircle, Layers, Coins } from 'lucide-react';

interface DecisionControlBarProps {
  availableDates: string[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  cutoffHour: number;
  onCutoffChange: (hour: number) => void;
  viewMode: 'half-hour' | 'hourly';
  onViewModeChange: (mode: 'half-hour' | 'hourly') => void;
  imbalancePrice: number;
  onImbalancePriceChange: (price: number) => void;
  decisionDay?: string;
}

export const DecisionControlBar: React.FC<DecisionControlBarProps> = ({
  availableDates,
  selectedDate,
  onDateChange,
  cutoffHour,
  onCutoffChange,
  viewMode,
  onViewModeChange,
  imbalancePrice,
  onImbalancePriceChange,
  decisionDay,
}) => {
  const currentIndex = availableDates.indexOf(selectedDate);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < availableDates.length - 1;

  const handlePrev = () => {
    if (hasPrev) onDateChange(availableDates[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onDateChange(availableDates[currentIndex + 1]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl shadow-black/40 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* 1. Date Selection */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              title="Previous Day"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 px-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <select
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-100 focus:outline-none cursor-pointer"
              >
                {availableDates.map((date) => (
                  <option key={date} value={date} className="bg-slate-900 text-slate-200">
                    {date} {date === '2026-01-01' ? '(New Year)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNext}
              disabled={!hasNext}
              title="Next Day"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            Delivery: <span className="text-emerald-400 font-medium">{selectedDate}</span>
          </div>
        </div>

        {/* 2. Gate Closure Cutoff */}
        <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300 font-medium">Gate Closure:</span>
          
          <div className="flex items-center space-x-1">
            {[9, 10, 11, 12].map((hour) => (
              <button
                key={hour}
                onClick={() => onCutoffChange(hour)}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition ${
                  cutoffHour === hour
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {hour}:00 UTC
              </button>
            ))}
          </div>

          <div className="relative group">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help hover:text-slate-300" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-2.5 bg-slate-800 text-slate-200 text-[11px] rounded-lg shadow-xl border border-slate-700 z-50">
              UK wholesale day-ahead auctions (EPEX SPOT GB) close at 11:00 UTC on D-1. This freezes the forecast snapshot to only predictions available before cutoff.
            </div>
          </div>
        </div>

        {/* 3. Imbalance Cash-Out Price Selector (The Standout Financial Engine) */}
        <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-amber-500/30">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-300 font-medium">System Cash-Out:</span>
          <div className="flex items-center space-x-1">
            {[75, 95, 125, 150].map((price) => (
              <button
                key={price}
                onClick={() => onImbalancePriceChange(price)}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition ${
                  imbalancePrice === price
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                £{price}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">/MWh</span>
        </div>

        {/* 4. Resolution Toggle */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onViewModeChange('half-hour')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition ${
              viewMode === 'half-hour'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>48 SP</span>
          </button>
          <button
            onClick={() => onViewModeChange('hourly')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition ${
              viewMode === 'hourly'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>24h</span>
          </button>
        </div>
      </div>

      {decisionDay && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Forecast point-in-time snapshot frozen on <strong className="text-slate-200">{decisionDay}</strong> at <strong className="text-cyan-300">{cutoffHour}:00 UTC</strong> with UK cash-out penalty set to <strong className="text-amber-300">£{imbalancePrice}/MWh</strong>.
          </span>
          <span className="hidden sm:inline text-slate-500">
            Bi-Temporal Model: Valid Time ({selectedDate}) vs Knowledge Time ({decisionDay})
          </span>
        </div>
      )}
    </div>
  );
};
