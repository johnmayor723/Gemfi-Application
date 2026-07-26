import React from 'react';

const STYLES = {
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/30',
  verified:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  failed:    'bg-rose-500/10 text-rose-400 border-rose-500/30',
  expired:   'bg-orange-500/10 text-orange-400 border-orange-500/30',
  rejected:  'bg-rose-500/10 text-rose-400 border-rose-500/30',
  passed:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cleared:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  hit:       'bg-rose-500/10 text-rose-400 border-rose-500/30',
  default:   'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

export default function KycStatusBadge({ status }) {
  const key = (typeof status === 'string' ? status : status?.value || '').toLowerCase();
  const cls = STYLES[key] || STYLES.default;
  const label = typeof status === 'string' ? status : (status?.value || status?.label || '—');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}