import React from 'react';
import { Loader2 } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, color = 'emerald', loading }) {
  const colorMap = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className={`rounded-xl border p-5 ${colorMap[color] || colorMap.emerald}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</span>
        {Icon && <Icon className="w-5 h-5 opacity-50" />}
      </div>
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <div className="text-3xl font-bold tracking-tight">{value ?? '—'}</div>
      )}
    </div>
  );
}