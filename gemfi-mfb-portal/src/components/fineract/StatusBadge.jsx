import React from 'react';

const statusStyles = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  approved: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  pendingapproval: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  submittedandpendingapproval: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  closed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  withdrawn: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  withdrawnbyapplicant: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  disbursed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  overpaid: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  verified: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  notverified: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  transferinprogress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  transferonhold: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  default: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const key = (status.value || status).toString().toLowerCase().replace(/\s+/g, '');
  const displayText = status.value || status;
  const style = statusStyles[key] || statusStyles.default;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {displayText}
    </span>
  );
}