import React from 'react';
import { Wind, Activity, Calendar, BarChart3, Database } from 'lucide-react';

interface HeaderProps {
  activeTab: 'daily' | 'monthly';
  setActiveTab: (tab: 'daily' | 'monthly') => void;
  cachedCount?: { actuals: number; forecasts: number };
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, cachedCount }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Wind className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-white tracking-tight">GridBricks</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  UK Day-Ahead
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 hidden sm:inline-block">
                  January 2026 Pilot
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Elexon BMRS Wind Forecast Evaluation & Procurement Risk Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'daily'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Day-Ahead Trading</span>
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Monthly Accuracy Audit</span>
            </button>
          </div>

          {/* System Status Indicators */}
          <div className="hidden lg:flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-700/60">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Cached: <strong className="text-slate-200">{cachedCount?.actuals ?? 1488}</strong> actuals / <strong className="text-slate-200">{cachedCount?.forecasts ?? 19856}</strong> forecasts
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-medium">Elexon Stream Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
