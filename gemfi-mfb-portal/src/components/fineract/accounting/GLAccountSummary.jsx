import React from 'react';
import { BookOpen, X } from 'lucide-react';

function getAccountTypeColor(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('asset')) return 'bg-emerald-600/10 text-emerald-400';
  if (t.includes('liab')) return 'bg-amber-600/10 text-amber-400';
  if (t.includes('equity')) return 'bg-blue-600/10 text-blue-400';
  if (t.includes('income')) return 'bg-purple-600/10 text-purple-400';
  if (t.includes('expense')) return 'bg-rose-600/10 text-rose-400';
  return 'bg-slate-600/10 text-slate-400';
}

/**
 * Displays all GL accounts in a compact, scrollable table.
 * Clicking a row selects that account to filter the journal entries below.
 */
export default function GLAccountSummary({ glAccounts, selectedAccountId, onSelect, onClose }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">GL Account Summary</h3>
          <span className="text-xs text-slate-500">({glAccounts.length} accounts)</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/80 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">GL Code</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Account Name</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Type</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Usage</th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {glAccounts.map(a => {
              const isSelected = String(a.id) === String(selectedAccountId);
              const isHeader = a.usage?.value === 'HEADER';
              return (
                <tr
                  key={a.id}
                  onClick={() => onSelect(isSelected ? '' : String(a.id))}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-emerald-600/10' : 'hover:bg-slate-700/30'} ${isHeader ? 'font-semibold' : ''}`}
                >
                  <td className="px-4 py-2 font-mono text-xs text-slate-400 whitespace-nowrap">{a.glCode}</td>
                  <td className="px-4 py-2 text-slate-200 text-xs">{a.name}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getAccountTypeColor(a.type?.value)}`}>
                      {a.type?.value || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-400">{a.usage?.value || '—'}</td>
                  <td className="px-4 py-2">
                    {a.disabled ? (
                      <span className="text-xs text-rose-400">Disabled</span>
                    ) : (
                      <span className="text-xs text-emerald-400">Active</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}