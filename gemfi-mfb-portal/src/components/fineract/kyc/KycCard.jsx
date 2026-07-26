import React from 'react';
import KycStatusBadge from './KycStatusBadge';

export default function KycCard({ title, icon: Icon, status, children, actions }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-emerald-400" />}
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {status && <KycStatusBadge status={status} />}
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}