import React from 'react';
import { TradingRecommendation as RecommendationType } from '../types';
import { ShieldAlert, AlertCircle, CheckCircle2, Flame, ArrowRight } from 'lucide-react';

interface TradingRecommendationProps {
  recommendation: RecommendationType;
}

export const TradingRecommendation: React.FC<TradingRecommendationProps> = ({ recommendation }) => {
  const getBadgeIcon = () => {
    switch (recommendation.badgeType) {
      case 'danger':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getCardStyle = () => {
    switch (recommendation.badgeType) {
      case 'danger':
        return 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/30';
      case 'warning':
        return 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30';
      case 'success':
        return 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/30';
    }
  };

  return (
    <div className={`border rounded-2xl p-5 shadow-xl transition ${getCardStyle()}`}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
            {getBadgeIcon()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Procurement Decision Intelligence
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                recommendation.badgeType === 'danger'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : recommendation.badgeType === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {recommendation.badgeType === 'danger' ? 'High Risk' : recommendation.badgeType === 'warning' ? 'Moderate Risk' : 'Low Risk'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {recommendation.headline}
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-4xl">
              {recommendation.text}
            </p>
          </div>
        </div>

        {recommendation.criticalShortfallPeriods.length > 0 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 shrink-0 md:w-64">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-rose-300 mb-2">
              <Flame className="w-3.5 h-3.5" />
              <span>Critical Deficit Periods:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recommendation.criticalShortfallPeriods.map((slot) => (
                <span
                  key={slot}
                  className="px-2 py-1 text-xs font-mono font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-md"
                >
                  {slot}
                </span>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 block mt-2">
              Wind fell &gt; 500 MW short of Day-Ahead expectation during these slots.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
