import React from 'react';

/**
 * Summary cards for account balances (used in General Ledger).
 */
export default function AccountSummaryCards({ openingBalance, totalDebits, totalCredits, closingBalance, currency = '' }) {
  const fmt = (v) => (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cards = [
    { label: 'Opening Balance', value: fmt(openingBalance), color: 'text-slate-300', bg: 'bg-slate-800/50', border: 'border-slate-700/50' },
    { label: 'Total Debits', value: fmt(totalDebits), color: 'text-emerald-400', bg: 'bg-emerald-600/5', border: 'border-emerald-600/20' },
    { label: 'Total Credits', value: fmt(totalCredits), color: 'text-amber-400', bg: 'bg-amber-600/5', border: 'border-amber-600/20' },
    { label: 'Closing Balance', value: fmt(closingBalance), color: 'text-white', bg: 'bg-slate-800/80', border: 'border-slate-600' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className={`${c.bg} ${c.border} border rounded-xl p-4`}>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider">{c.label}</div>
          <div className={`text-lg font-bold font-mono mt-1 ${c.color}`}>
            {currency} {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}