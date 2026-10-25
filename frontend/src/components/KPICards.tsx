import React from 'react';
import { Metrics } from '../types';
import { Zap, AlertTriangle, TrendingUp, Gauge, HelpCircle, ArrowUpRight, ArrowDownRight, PoundSterling } from 'lucide-react';

interface KPICardsProps {
  metrics: Metrics;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics }) => {
  const isOver = metrics.meanBiasMw > 50;
  const isUnder = metrics.meanBiasMw < -50;
  const financial = metrics.financial;

  const penaltyGbp = financial?.cashoutPenaltyExposureGbp ?? 0;
  const formattedPenalty =
    penaltyGbp >= 1_000_000
      ? `£${(penaltyGbp / 1_000_000).toFixed(2)}M`
      : penaltyGbp >= 1_000
      ? `£${(penaltyGbp / 1_000).toFixed(0)}k`
      : `£${penaltyGbp.toFixed(0)}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Outturn Generation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20 hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Outturn Wind</span>
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {(metrics.totalActualMwh / 1000).toFixed(1)} <span className="text-xs text-slate-400 font-normal">GWh</span>
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-400">
          <span>Forecast: {(metrics.totalForecastMwh / 1000).toFixed(1)} GWh</span>
        </div>
        <div className="mt-1 text-[11px] font-medium">
          {metrics.energyVarianceMwh >= 0 ? (
            <span className="text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              +{(metrics.energyVarianceMwh / 1000).toFixed(1)} GWh surplus
            </span>
          ) : (
            <span className="text-rose-400 flex items-center">
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
              {(metrics.energyVarianceMwh / 1000).toFixed(1)} GWh deficit
            </span>
          )}
        </div>
      </div>

      {/* 2. MAE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20 hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Mean Abs Error (MAE)</span>
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {metrics.maeMw.toLocaleString()} <span className="text-xs text-slate-400 font-normal">MW</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Average magnitude of half-hour error across the delivery day
        </div>
        <div className="mt-1">
          {isOver && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Bias: +{metrics.meanBiasMw.toFixed(0)} MW (Over-forecast)
            </span>
          )}
          {isUnder && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Bias: {metrics.meanBiasMw.toFixed(0)} MW (Under-forecast)
            </span>
          )}
          {!isOver && !isUnder && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Bias: Balanced ({metrics.meanBiasMw.toFixed(0)} MW)
            </span>
          )}
        </div>
      </div>

      {/* 3. RMSE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20 hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Root Mean Sq (RMSE)</span>
          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {metrics.rmseMw.toLocaleString()} <span className="text-xs text-slate-400 font-normal">MW</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Penalizes large deviations (spikes and ramps) heavily
        </div>
      </div>

      {/* 4. MAPE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20 hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">MAPE %</span>
          <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {metrics.mapePct.toFixed(1)} <span className="text-xs text-slate-400 font-normal">%</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Relative percentage error against actual wind output
        </div>
      </div>

      {/* 5. The Standout Feature: Financial Cash-Out Risk Exposure (£ GBP) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-4 shadow-xl hover:border-amber-500/60 transition relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center">
            <PoundSterling className="w-3.5 h-3.5 mr-0.5" />
            Imbalance Cash-Out Risk
          </span>
          <div className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg">
            <PoundSterling className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-300 tracking-tight font-mono">
          {formattedPenalty}
        </div>
        <div className="mt-2 text-xs text-slate-300">
          At £{financial?.imbalancePriceGbp ?? 95}/MWh system cash-out price
        </div>
        <div className="mt-1 text-[11px] text-amber-400/90 font-medium">
          Deficit Volume: {(financial?.totalShortfallMwh ?? 0).toLocaleString()} MWh
        </div>
      </div>
    </div>
  );
};
