import React from 'react';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  emerald: 'text-emerald-400 bg-emerald-500/10',
  blue: 'text-blue-400 bg-blue-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  purple: 'text-purple-400 bg-purple-500/10',
  rose: 'text-rose-400 bg-rose-500/10',
  orange: 'text-orange-400 bg-orange-500/10',
};

export default function KpiCard({ label, value, icon: Icon, color = 'emerald', trend, loading, prefix, suffix }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-600 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-white mt-2 truncate">
              {prefix}{value?.toLocaleString() ?? '—'}{suffix}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorMap[color] || colorMap.emerald}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend !== undefined && !loading && (
        <div className="flex items-center gap-1 mt-3">
          {trend >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {Math.abs(trend)}%
          </span>
          <span className="text-xs text-slate-500">vs last period</span>
        </div>
      )}
    </div>
  );
}