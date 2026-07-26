import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import ExportToolbar from '@/components/fineract/accounting/ExportToolbar';
import { fmtMoney, fmtNaira } from '@/lib/reportFormat';

/**
 * Every row's `balance` carries its true signed natural accounting balance
 * (see aggregateGlMovement in reportCalculations.js). The displayed amount
 * is always the magnitude; a row whose true balance is negative (opposite
 * its natural direction) is tagged "(reversed)" as pure information — the
 * section total below is already normalized (see sumNormalized in
 * buildBalanceSheet), so an individual reversed account never distorts it.
 *
 * The Equity total is the one exception that can still legitimately go
 * negative — accumulated losses reduce real equity, that's not a posting
 * anomaly — so it's shown as a magnitude with a distinct "Accumulated
 * Losses" status instead of the generic "(reversed)" tag.
 */
function GroupTable({ title, rows, total, negativeStatus }) {
  const totalNegative = total < 0;
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">No {title.toLowerCase()} balances as of this date</div>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-700/30">
            {rows.map(r => {
              // The synthetic "Net Income/Loss (current period)" equity row is
              // expected to go negative on a real loss — that's not a posting
              // anomaly, its own name already says "Loss", so it's excluded
              // from the (reversed) flag that's meant for actual GL accounts.
              const abnormal = r.balance < 0 && r.id !== 'net-income';
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
              <td colSpan={2} className="px-5 py-2.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                Total {title}
                {totalNegative && negativeStatus && <span className="ml-1.5 text-[10px] text-amber-400 normal-case font-normal">({negativeStatus})</span>}
              </td>
              <td className={`px-5 py-2.5 text-right font-mono text-sm font-bold ${totalNegative && negativeStatus ? 'text-amber-400' : 'text-white'}`}>{fmtNaira(Math.abs(total))}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

export default function BalanceSheetSection({ balanceSheet, asOfDate }) {
  const { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, isBalanced, difference } = balanceSheet;

  const exportColumns = [
    { label: 'Section', key: 'section' },
    { label: 'GL Code', key: 'glCode' },
    { label: 'Account', key: 'name' },
    { label: 'Balance', key: 'balance', render: (v) => fmtMoney(v) },
  ];
  const exportData = [
    ...assets.map(r => ({ ...r, section: 'Asset' })),
    ...liabilities.map(r => ({ ...r, section: 'Liability' })),
    ...equity.map(r => ({ ...r, section: 'Equity' })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Statement of Assets &amp; Liabilities</h2>
          <p className="text-xs text-slate-500 mt-0.5">As of {asOfDate}</p>
        </div>
        <ExportToolbar filename={`cbn_balance_sheet_${asOfDate}`} title="Statement of Assets & Liabilities" columns={exportColumns} data={exportData} />
      </div>

      <div className={`rounded-xl p-4 flex items-center gap-3 ${isBalanced ? 'bg-emerald-600/10 border border-emerald-600/30' : 'bg-rose-600/10 border border-rose-600/30'}`}>
        {isBalanced ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
        <div className="text-sm">
          <span className="font-semibold text-white">Assets {fmtNaira(Math.abs(totalAssets))}</span>
          <span className="text-slate-600 mx-2">·</span>
          <span className="font-semibold text-white">Liabilities + Equity {fmtNaira(Math.abs(totalLiabilities + totalEquity))}</span>
          <span className="text-slate-600 mx-2">·</span>
          <span className={isBalanced ? 'text-emerald-400' : 'text-rose-400'}>
            {isBalanced ? '✓ Balanced' : `❌ Out of Balance by ${fmtNaira(Math.abs(difference))}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GroupTable title="Assets" rows={assets} total={totalAssets} negativeStatus="unusual — verify postings" />
        <GroupTable title="Liabilities" rows={liabilities} total={totalLiabilities} negativeStatus="unusual — verify postings" />
        <GroupTable title="Equity" rows={equity} total={totalEquity} negativeStatus="Accumulated Losses (negative equity)" />
      </div>
    </div>
  );
}
