import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import ExportToolbar from '@/components/fineract/accounting/ExportToolbar';
import { buildLoanPortfolioClassification, computeCapitalAdequacyRatio } from '@/lib/reportCalculations';
import { CBN_MIN_CAPITAL_ADEQUACY_RATIO } from '@/lib/regulatoryConstants';
import { fmtMoney, fmtPct } from '@/lib/reportFormat';

const toneForBucket = {
  performing: 'text-emerald-400',
  watch: 'text-amber-400',
  substandard: 'text-orange-400',
  doubtful: 'text-rose-400',
  lost: 'text-rose-500',
};

export default function LoanClassificationSection({ activeLoans, asOfDate, totalEquity }) {
  const par = useMemo(() => buildLoanPortfolioClassification(activeLoans, asOfDate), [activeLoans, asOfDate]);
  const car = computeCapitalAdequacyRatio(totalEquity, par.totalOutstanding);
  const carMeetsMinimum = car != null && car >= CBN_MIN_CAPITAL_ADEQUACY_RATIO;

  const exportColumns = [
    { label: 'Classification', key: 'label' },
    { label: 'Days Past Due', key: '_days', render: (_, r) => (r.maxDays === Infinity ? `${r.minDays}+` : `${r.minDays}–${r.maxDays}`) },
    { label: '# Loans', key: 'count' },
    { label: 'Outstanding Principal', key: 'outstanding', render: (v) => fmtMoney(v) },
    { label: 'Provision Rate', key: 'provisionRate', render: (v) => fmtPct(v, 0) },
    { label: 'Required Provision', key: 'requiredProvision', render: (v) => fmtMoney(v) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Loan Portfolio Classification (Prudential)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Active loans, classified by days past due as of {asOfDate}</p>
        </div>
        <ExportToolbar filename={`cbn_portfolio_classification_${asOfDate}`} title="Loan Portfolio Classification" columns={exportColumns} data={par.rows} />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Classification</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Days Past Due</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400"># Loans</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Outstanding</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Provision Rate</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Required Provision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {par.rows.map(r => (
              <tr key={r.key}>
                <td className={`px-4 py-2.5 font-medium ${toneForBucket[r.key]}`}>{r.label}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{r.maxDays === Infinity ? `${r.minDays}+ days` : `${r.minDays}–${r.maxDays} days`}</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-200">{r.count}</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-200">{fmtMoney(r.outstanding)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-400">{fmtPct(r.provisionRate, 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-200">{fmtMoney(r.requiredProvision)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-900/40 border-t-2 border-slate-700">
            <tr>
              <td className="px-4 py-3 text-xs font-bold text-slate-300 uppercase tracking-wider">Total</td>
              <td></td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold text-white">{par.totalLoans}</td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold text-white">{fmtMoney(par.totalOutstanding)}</td>
              <td></td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold text-white">{fmtMoney(par.totalProvision)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Portfolio at Risk Ratio</div>
          <div className="text-2xl font-bold text-white">{fmtPct(par.parRatio)}</div>
          <div className="text-xs text-slate-500 mt-1">Substandard + Doubtful + Lost, over total outstanding portfolio</div>
        </div>
        <div className={`rounded-xl p-4 border ${carMeetsMinimum ? 'bg-emerald-600/10 border-emerald-600/30' : 'bg-rose-600/10 border-rose-600/30'}`}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-1 text-slate-400">
            Capital Adequacy Ratio (approximate)
            {carMeetsMinimum ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
          </div>
          <div className="text-2xl font-bold text-white">{fmtPct(car)}</div>
          <div className="text-xs text-slate-500 mt-1">
            Equity ÷ total outstanding loan portfolio (simplified proxy for risk-weighted assets) · minimum {fmtPct(CBN_MIN_CAPITAL_ADEQUACY_RATIO, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
