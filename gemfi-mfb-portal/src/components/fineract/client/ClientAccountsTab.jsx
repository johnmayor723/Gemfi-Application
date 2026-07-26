import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, PiggyBank, ArrowDownCircle, ArrowUpCircle, FileText } from 'lucide-react';
import StatusBadge from '@/components/fineract/StatusBadge';
import LoanActions from '@/components/fineract/loan/LoanActions';

export default function ClientAccountsTab({ accounts, loans, onLoanAction }) {
  const loanAccounts = accounts?.loanAccounts || loans || [];
  const savings = accounts?.savingsAccounts || [];

  return (
    <div className="space-y-6">
      {/* Savings Accounts with Related Loans */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-amber-400" /> Savings Accounts
          <span className="text-xs text-slate-500 font-normal">({savings.length})</span>
        </h2>
        {savings.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No savings accounts</p>
        ) : (
          <div className="space-y-3">
            {savings.map(s => {
              const isActive = s.status?.value?.toLowerCase() === 'active';
              const relatedLoans = loanAccounts.filter(l => l.loanProductId === s.productId || l.productName === s.productName);
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

                  {/* Related Loans Section */}
                  <div className="mt-3 pt-3 border-t border-slate-700/30">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Related Loans
                    </div>
                    {relatedLoans.length === 0 ? (
                      <p className="text-xs text-slate-600">No loans found for this client.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {relatedLoans.map(rl => (
                          <Link key={rl.id} to={`/loans/${rl.id}`} className="block p-2 rounded-md bg-slate-900/50 hover:bg-slate-700/50 transition-colors">
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                              <div>
                                <div className="text-slate-600 text-[10px]">Loan Product</div>
                                <div className="text-slate-300 truncate">{rl.productName || rl.loanProductName || '—'}</div>
                              </div>
                              <div>
                                <div className="text-slate-600 text-[10px]">Status</div>
                                <StatusBadge status={rl.status} />
                              </div>
                              <div>
                                <div className="text-slate-600 text-[10px]">Principal</div>
                                <div className="text-slate-300">{rl.originalLoan != null ? rl.originalLoan.toLocaleString() : '—'}</div>
                              </div>
                              <div>
                                <div className="text-slate-600 text-[10px]">Outstanding</div>
                                <div className="text-slate-300">{rl.loanBalance?.toLocaleString() ?? '—'}</div>
                              </div>
                              <div>
                                <div className="text-slate-600 text-[10px]">Next Repayment</div>
                                <div className="text-slate-300">{rl.timeline?.expectedFirstRepaymentDate ? rl.timeline.expectedFirstRepaymentDate.join('-') : '—'}</div>
                              </div>
                              <div>
                                <div className="text-slate-600 text-[10px]">Remaining Inst.</div>
                                <div className="text-slate-300">{rl.numberOfRepayments ?? '—'}</div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Loan Accounts */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-400" /> Loan Accounts
          <span className="text-xs text-slate-500 font-normal">({loanAccounts.length})</span>
        </h2>
        {loanAccounts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No loans found for this client.</p>
        ) : (
          <div className="space-y-2">
            {loanAccounts.map(l => (
              <div key={l.id} className="p-3 rounded-lg transition-colors border border-slate-700/30">
                <div className="flex items-center justify-between">
                  <Link to={`/loans/${l.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium">{l.productName}</div>
                      <div className="text-xs text-slate-500">#{l.accountNo}</div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm text-white font-medium">{l.loanBalance?.toLocaleString() ?? '—'}</div>
                      <div className="text-[10px] text-slate-500">Balance</div>
                    </div>
                    <StatusBadge status={l.status} />
                    <LoanActions loanId={l.id} status={l.status} onAction={onLoanAction} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}