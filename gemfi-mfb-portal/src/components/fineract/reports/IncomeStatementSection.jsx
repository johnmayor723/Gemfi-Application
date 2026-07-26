import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import ExportToolbar from '@/components/fineract/accounting/ExportToolbar';
import { buildIncomeStatement } from '@/lib/reportCalculations';
import { fmtMoney } from '@/lib/reportFormat';

const inputCls = 'h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-600';

function startOfYear(iso) {
  const year = iso ? iso.slice(0, 4) : new Date().getFullYear();
  return `${year}-01-01`;
}

/**
 * Each row's `balance` carries its true signed natural balance (income is
 * credit-natural, expense is debit-natural — see aggregateGlMovement in
 * reportCalculations.js). The displayed amount is always the magnitude; a
 * row whose true balance is negative (opposite its natural direction) is
 * tagged "(reversed)" as pure information — per-row totals below already
 * sum normalized magnitudes (see sumNormalized), so this tag never changes
 * what the total actually is, it just tells you which account to check.
 */
function GroupTable({ title, rows, total, tone }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">No {title.toLowerCase()} recorded in this period</div>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-700/30">
            {rows.map(r => {
              const abnormal = r.balance < 0;
              return (
                <tr key={r.id}>
                  <td className="px-5 py-2 font-mono text-xs text-slate-500 w-24">{r.glCode}</td>
                  <td className="px-5 py-2 text-slate-200">
                    {r.name}
                    {abnormal && <span className="ml-1.5 text-[10px] text-amber-400 align-middle">(reversed)</span>}
                  </td>
                  <td className={`px-5 py-2 text-right font-mono ${abnormal ? 'text-amber-400' : 'text-slate-200'}`}>{fmtMoney(Math.abs(r.balance))}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-900/40 border-t-2 border-slate-700">
            <tr>
              <td colSpan={2} className="px-5 py-2.5 text-xs font-bold text-slate-300 uppercase tracking-wider">Total {title}</td>
              <td className={`px-5 py-2.5 text-right font-mono text-sm font-bold ${tone}`}>{fmtMoney(total)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

/**
 * Standalone Profit & Income Statement, and the section embedded inside the
 * CBN return. Computed entirely from journal entries already fetched by
 * useReportingData — changing the period here is a client-side re-filter,
 * not a new API call.
 */
export default function IncomeStatementSection({ glAccounts, journalEntries, defaultToDate, title = 'Profit & Income Statement', filenamePrefix = 'income_statement' }) {
  const [fromDate, setFromDate] = useState(startOfYear(defaultToDate));
  const [toDate, setToDate] = useState(defaultToDate);

  const statement = useMemo(
    () => buildIncomeStatement(glAccounts, journalEntries, fromDate, toDate),
    [glAccounts, journalEntries, fromDate, toDate],
  );

  const exportColumns = [
    { label: 'Section', key: 'section' },
    { label: 'GL Code', key: 'glCode' },
    { label: 'Account', key: 'name' },
    { label: 'Amount', key: 'balance', render: (v) => fmtMoney(v) },
  ];
  const exportData = [
    ...statement.income.map(r => ({ ...r, section: 'Income' })),
    ...statement.expense.map(r => ({ ...r, section: 'Expense' })),
  ];

  const isProfit = statement.netProfit >= 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Journal entry movement for the selected period</p>
        </div>
        <ExportToolbar filename={`${filenamePrefix}_${fromDate}_to_${toDate}`} title={title} columns={exportColumns} data={exportData} />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">From</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">To</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className={`rounded-xl p-4 flex items-center gap-3 ${isProfit ? 'bg-emerald-600/10 border border-emerald-600/30' : 'bg-rose-600/10 border border-rose-600/30'}`}>
        {isProfit ? <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <TrendingDown className="w-5 h-5 text-rose-400 flex-shrink-0" />}
        <div className="text-sm">
          <span className="font-semibold text-white">Income {fmtMoney(statement.totalIncome)}</span>
          <span className="text-slate-600 mx-2">·</span>
          <span className="font-semibold text-white">Expenses {fmtMoney(statement.totalExpense)}</span>
          <span className="text-slate-600 mx-2">·</span>
          <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
            Net {isProfit ? 'Profit' : 'Loss'} {isProfit ? fmtMoney(statement.netProfit) : `-${fmtMoney(Math.abs(statement.netProfit))}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GroupTable title="Income" rows={statement.income} total={statement.totalIncome} tone="text-emerald-400" />
        <GroupTable title="Expenses" rows={statement.expense} total={statement.totalExpense} tone="text-amber-400" />
      </div>
    </div>
  );
}
