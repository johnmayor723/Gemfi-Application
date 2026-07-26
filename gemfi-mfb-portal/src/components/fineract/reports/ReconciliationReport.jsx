import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import ExportToolbar from '@/components/fineract/accounting/ExportToolbar';
import { buildReconciliationReport } from '@/lib/reportCalculations';
import { fmtMoney, fmtNaira } from '@/lib/reportFormat';

const inputCls = 'h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-600';

function StatCard({ label, value, tone = 'text-white' }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${tone}`}>{value}</div>
    </div>
  );
}

const STATUS_TONE = {
  Included: 'text-slate-200',
  'Excluded from BS lines': 'text-amber-400',
  Misclassified: 'text-rose-400',
};

/**
 * The audit trail behind the Balance Sheet's headline figures: every GL
 * account exactly once, a whole-ledger debit/credit check independent of
 * the Balance Sheet logic entirely, and any journal entries whose GL
 * account no longer exists in the fetched chart of accounts — those are
 * silently dropped everywhere else in this app, and are the one way this
 * report can be genuinely (not cosmetically) out of balance.
 */
export default function ReconciliationReport({ glAccounts, journalEntries, asOfDate }) {
  const [search, setSearch] = useState('');

  const report = useMemo(
    () => buildReconciliationReport(glAccounts, journalEntries, asOfDate),
    [glAccounts, journalEntries, asOfDate],
  );

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return report.accountRows;
    return report.accountRows.filter(a =>
      [a.glCode, a.name, a.typeLabel, a.status].some(v => String(v || '').toLowerCase().includes(q)));
  }, [report.accountRows, search]);

  const accountExportColumns = [
    { label: 'GL Code', key: 'glCode' },
    { label: 'Account Name', key: 'name' },
    { label: 'Type', key: 'typeLabel' },
    { label: 'Debit', key: 'debit', render: (v) => fmtMoney(v) },
    { label: 'Credit', key: 'credit', render: (v) => fmtMoney(v) },
    { label: 'Balance', key: 'balance', render: (v) => fmtMoney(v) },
    { label: 'Status', key: 'status' },
    { label: 'Reason', key: 'reason' },
  ];

  const orphanExportColumns = [
    { label: 'Transaction ID', key: 'transactionId' },
    { label: 'GL Account ID', key: 'glAccountId' },
    { label: 'GL Account Code', key: 'glAccountCode' },
    { label: 'GL Account Name', key: 'glAccountName' },
    { label: 'Side', key: 'side' },
    { label: 'Amount', key: 'amount', render: (v) => fmtMoney(v) },
  ];

  const misclassifiedCount = report.accountRows.filter(a => a.status === 'Misclassified').length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-white">Balance Sheet Reconciliation</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Diagnostic behind Assets = Liabilities + Equity as of {asOfDate} — every GL account, the whole-ledger Dr/Cr
          check, and any posting the Balance Sheet can't see.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Assets" value={fmtNaira(report.totalAssets)} />
        <StatCard label="Total Liabilities" value={fmtNaira(report.totalLiabilities)} />
        <StatCard label="Total Equity" value={fmtNaira(report.totalEquity)} tone={report.totalEquity < 0 ? 'text-amber-400' : 'text-white'} />
        <StatCard label="Current Year P/L" value={fmtNaira(Math.abs(report.currentYearProfitLoss))} tone={report.currentYearProfitLoss < 0 ? 'text-rose-400' : 'text-emerald-400'} />
        <StatCard label="Variance" value={fmtNaira(Math.abs(report.variance))} tone={report.isBalanced ? 'text-emerald-400' : 'text-rose-400'} />
      </div>

      <div className={`rounded-xl p-4 flex items-center gap-3 ${report.isBalanced ? 'bg-emerald-600/10 border border-emerald-600/30' : 'bg-rose-600/10 border border-rose-600/30'}`}>
        {report.isBalanced ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
        <div className="text-sm">
          Assets − (Liabilities + Equity) ={' '}
          <span className={report.isBalanced ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {report.isBalanced ? fmtNaira(0) : fmtNaira(Math.abs(report.variance))}
          </span>
          <span className="text-slate-500 ml-2">{report.isBalanced ? '— Balanced' : '— Out of Balance'}</span>
        </div>
      </div>

      <div className={`rounded-xl p-4 flex items-center gap-3 ${report.ledger.isLedgerBalanced ? 'bg-emerald-600/10 border border-emerald-600/30' : 'bg-rose-600/10 border border-rose-600/30'}`}>
        {report.ledger.isLedgerBalanced ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
        <div className="text-sm">
          <span className="font-semibold text-white">Ledger-wide check</span>
          <span className="text-slate-600 mx-2">·</span>
          Total Debits {fmtMoney(report.ledger.totalDebit)}
          <span className="text-slate-600 mx-2">·</span>
          Total Credits {fmtMoney(report.ledger.totalCredit)}
          <span className="text-slate-600 mx-2">·</span>
          <span className={report.ledger.isLedgerBalanced ? 'text-emerald-400' : 'text-rose-400'}>
            {report.ledger.isLedgerBalanced ? 'Every posted entry balances' : `Off by ${fmtMoney(Math.abs(report.ledger.difference))} — a journal entry itself is unbalanced`}
          </span>
        </div>
      </div>

      {report.orphanEntries.length > 0 && (
        <div className="bg-rose-600/5 border border-rose-600/30 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-rose-600/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-rose-400">
              {report.orphanEntries.length} Orphaned Journal {report.orphanEntries.length === 1 ? 'Entry' : 'Entries'} — real posting(s) invisible to every report
            </h3>
            <div className="ml-auto">
              <ExportToolbar filename={`orphan_entries_${asOfDate}`} title="Orphaned Journal Entries" columns={orphanExportColumns} data={report.orphanEntries} />
            </div>
          </div>
          <p className="px-5 py-2 text-xs text-rose-200/80">
            These entries reference a GL account ID that no longer exists in the current chart of accounts (deleted or
            never fetched). Their real debit/credit effect is not reflected in Total Assets, Liabilities, or Equity
            above — this is the one way the Balance Sheet can be genuinely out of balance rather than a display issue.
          </p>
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Transaction</th>
                <th className="text-left px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Missing GL Account</th>
                <th className="text-left px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Side</th>
                <th className="text-right px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-700/20">
              {report.orphanEntries.map((o, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 font-mono text-xs text-emerald-400">#{o.transactionId ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-300 text-xs">
                    {o.glAccountName || o.glAccountCode || '—'} <span className="text-slate-600">(id {o.glAccountId})</span>
                  </td>
                  <td className="px-4 py-2 text-xs">{o.side}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-slate-200">{fmtMoney(o.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {misclassifiedCount > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200/80">
          {misclassifiedCount} GL account{misclassifiedCount === 1 ? '' : 's'} below {misclassifiedCount === 1 ? 'has' : 'have'} no
          recognized Asset/Liability/Equity/Income/Expense type and are excluded from every report until reclassified
          in Chart of Accounts.
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-slate-700/50 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by code, name, type, status…" className={`${inputCls} w-full pl-9`} />
          </div>
          <ExportToolbar filename={`gl_reconciliation_${asOfDate}`} title="Balance Sheet Reconciliation" columns={accountExportColumns} data={report.accountRows} />
        </div>
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">GL Code</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Account</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Balance</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filteredAccounts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500 text-sm">No accounts match</td></tr>
              ) : filteredAccounts.map(a => (
                <tr key={a.id}>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{a.glCode}</td>
                  <td className="px-4 py-2.5 text-slate-200">{a.name}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{a.typeLabel}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-200">{fmtMoney(Math.abs(a.balance))}{a.balance < 0 ? ' (reversed)' : ''}</td>
                  <td className={`px-4 py-2.5 text-xs font-medium ${STATUS_TONE[a.status] || 'text-slate-300'}`}>{a.status}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{a.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
