import React, { useState, useMemo } from 'react';
import { ShieldCheck, Users, PiggyBank, DollarSign } from 'lucide-react';
import ExportToolbar from '@/components/fineract/accounting/ExportToolbar';
import RegulatoryDisclosureBanner from '@/components/fineract/reports/RegulatoryDisclosureBanner';
import { computeInsuredDeposits, computeNdicPremium } from '@/lib/reportCalculations';
import { NDIC_MAX_INSURED_DEPOSIT_PER_DEPOSITOR, NDIC_PREMIUM_RATE } from '@/lib/regulatoryConstants';
import { fmtMoney, fmtPct } from '@/lib/reportFormat';

const inputCls = 'h-9 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-600';

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-bold text-white">{value}</div>
          <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        </div>
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export default function NDICReturns({ savingsAccounts, asOfDate }) {
  const [premiumRate, setPremiumRate] = useState(NDIC_PREMIUM_RATE);

  const insured = useMemo(
    () => computeInsuredDeposits(savingsAccounts, NDIC_MAX_INSURED_DEPOSIT_PER_DEPOSITOR),
    [savingsAccounts],
  );
  const premium = computeNdicPremium(insured.totalDeposits, premiumRate);

  const exportColumns = [
    { label: 'Client', key: 'clientName' },
    { label: '# Accounts', key: 'accounts' },
    { label: 'Total Deposit', key: 'total', render: (v) => fmtMoney(v) },
    { label: 'Insured Amount', key: 'insured', render: (v) => fmtMoney(v) },
    { label: 'Uninsured Amount', key: 'uninsured', render: (v) => fmtMoney(v) },
    { label: 'Coverage', key: '_cov', render: (_, r) => (r.uninsured === 0 ? 'Fully Covered' : 'Partially Covered') },
  ];

  return (
    <div className="space-y-5">
      <RegulatoryDisclosureBanner />

      <div>
        <h2 className="text-sm font-semibold text-white">Statement of Insured Deposits</h2>
        <p className="text-xs text-slate-500 mt-0.5">All active savings deposits as of {asOfDate}, per depositor</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Deposits" value={fmtMoney(insured.totalDeposits)} icon={PiggyBank} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard label="Depositors" value={insured.depositors.length.toLocaleString()} icon={Users} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard label="Insured Amount" value={fmtMoney(insured.totalInsured)} icon={ShieldCheck} color="text-cyan-400" bg="bg-cyan-500/10" />
        <StatCard label="Fully Covered Depositors" value={fmtPct(insured.fullyCoveredPct)} icon={ShieldCheck} color="text-emerald-400" bg="bg-emerald-500/10" />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Coverage limit: <span className="text-white font-medium">₦{fmtMoney(NDIC_MAX_INSURED_DEPOSIT_PER_DEPOSITOR)}</span> per depositor
        </div>
        <ExportToolbar filename={`ndic_insured_deposits_${asOfDate}`} title="Statement of Insured Deposits" columns={exportColumns} data={insured.depositors} />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Client</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400"># Accounts</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Deposit</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Insured</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Uninsured</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {insured.depositors.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">No active savings deposits found</td></tr>
            ) : insured.depositors.map(d => (
              <tr key={d.clientId ?? d.clientName}>
                <td className="px-4 py-2.5 text-slate-200">{d.clientName}</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-400">{d.accounts}</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-200">{fmtMoney(d.total)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-cyan-400">{fmtMoney(d.insured)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-rose-400">{fmtMoney(d.uninsured)}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${d.uninsured === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {d.uninsured === 0 ? 'Fully Covered' : 'Partially Covered'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Deposit Insurance Premium</h2>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Certified Deposit Liabilities</div>
              <div className="text-lg font-bold text-white">{fmtMoney(insured.totalDeposits)}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Current total active deposits, used as the assessment base</div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Premium Rate</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.001" value={premiumRate}
                  onChange={e => setPremiumRate(parseFloat(e.target.value) || 0)}
                  className={`${inputCls} w-24`}
                />
                <span className="text-xs text-slate-500">({fmtPct(premiumRate, 2)})</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><DollarSign className="w-3 h-3" /> Premium Payable</div>
              <div className="text-2xl font-bold text-emerald-400">{fmtMoney(premium)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
