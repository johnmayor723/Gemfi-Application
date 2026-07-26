import React from 'react';
import { Link } from 'react-router-dom';
import { PiggyBank, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import StatusBadge from '@/components/fineract/StatusBadge';
import AccountIdentifiers from '@/components/fineract/savings/AccountIdentifiers';

export default function ClientSavingsTab({ accounts, clientId }) {
  const savings = accounts?.savingsAccounts || [];

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <PiggyBank className="w-4 h-4 text-amber-400" /> Savings Accounts
        <span className="text-xs text-slate-500 font-normal">({savings.length})</span>
      </h2>
      {savings.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No savings accounts for this client.</p>
      ) : (
        <div className="space-y-3">
          {savings.map(s => {
            const isActive = s.status?.value?.toLowerCase() === 'active';
            return (
              <div key={s.id} className="border border-slate-700/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Link to={`/savings/${s.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <PiggyBank className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium truncate">{s.productName}</div>
                      <div className="text-xs text-slate-500">#{s.accountNo}</div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm text-white font-medium">{s.accountBalance?.toLocaleString() ?? '—'}</div>
                      <div className="text-[10px] text-slate-500">Balance</div>
                    </div>
                    <StatusBadge status={s.status} />
                    {isActive && (
                      <div className="flex gap-1">
                        <Link to={`/savings/${s.id}?action=deposit`} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Deposit">
                          <ArrowDownCircle className="w-4 h-4" />
                        </Link>
                        <Link to={`/savings/${s.id}?action=withdrawal`} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors" title="Withdraw">
                          <ArrowUpCircle className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                <AccountIdentifiers compact fineractAccountId={s.id} clientId={clientId} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}