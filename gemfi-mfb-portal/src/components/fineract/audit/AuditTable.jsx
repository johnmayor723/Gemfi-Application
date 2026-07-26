import React from 'react';
import { Loader2 } from 'lucide-react';
import { fmtDateTime } from '@/lib/auditApi';

const entityColors = {
  LOAN: 'bg-blue-500/15 text-blue-400',
  CLIENT: 'bg-emerald-500/15 text-emerald-400',
  SAVINGS_ACCOUNT: 'bg-purple-500/15 text-purple-400',
  GROUP: 'bg-cyan-500/15 text-cyan-400',
  OFFICE: 'bg-amber-500/15 text-amber-400',
  USER: 'bg-rose-500/15 text-rose-400',
  ROLE: 'bg-indigo-500/15 text-indigo-400',
};

const actionColors = {
  CREATE: 'bg-emerald-500/15 text-emerald-400',
  UPDATE: 'bg-blue-500/15 text-blue-400',
  DELETE: 'bg-rose-500/15 text-rose-400',
  APPROVE: 'bg-emerald-500/15 text-emerald-400',
  REJECT: 'bg-rose-500/15 text-rose-400',
  DISBURSE: 'bg-purple-500/15 text-purple-400',
  ACTIVATE: 'bg-emerald-500/15 text-emerald-400',
  CLOSE: 'bg-slate-500/15 text-slate-400',
  WITHDRAW: 'bg-amber-500/15 text-amber-400',
};

export default function AuditTable({ audits, loading }) {
  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto" /></div>;
  }
  if (!audits || audits.length === 0) {
    return <div className="text-center py-16 text-slate-500 text-sm">No audit records found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-800/80">
          <tr>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Timestamp</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">User</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Entity</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Resource ID</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Office</th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {audits.map((a, idx) => (
            <tr key={a.id || idx} className="transition-colors hover:bg-slate-700/30">
              <td className="px-4 py-2.5 text-slate-300 text-xs whitespace-nowrap">{fmtDateTime(a.madeOnDate)}</td>
              <td className="px-4 py-2.5 text-slate-200">{a.maker || '—'}</td>
              <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${entityColors[a.entityName] || 'bg-slate-500/15 text-slate-400'}`}>{a.entityName || '—'}</span></td>
              <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${actionColors[a.actionName] || 'bg-slate-500/15 text-slate-400'}`}>{a.actionName || '—'}</span></td>
              <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{a.resourceId ?? '—'}</td>
              <td className="px-4 py-2.5 text-slate-400 text-xs">{a.officeName || '—'}</td>
              <td className="px-4 py-2.5 text-slate-400 text-xs">{a.processingResult || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}