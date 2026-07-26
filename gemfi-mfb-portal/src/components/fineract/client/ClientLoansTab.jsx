import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import { CreditCard, FileText, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/fineract/StatusBadge';
import LoanDetailsPanel from '@/components/fineract/loan/LoanDetailsPanel';
import LoanApplicationForm from '@/components/fineract/loan/LoanApplicationForm';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const fmtArr = (d) => (Array.isArray(d) ? d.map(n => String(n).padStart(2, '0')).join('-') : null);

export default function ClientLoansTab({ clientId, accounts, onRefreshClient, showApply: externalShowApply, setShowApply: externalSetShowApply }) {
  const { toast } = useToast();
  const loanAccounts = accounts?.loanAccounts || [];
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [internalShowApply, setInternalShowApply] = useState(false);
  const showApply = externalShowApply !== undefined ? externalShowApply : internalShowApply;
  const setShowApply = externalSetShowApply || setInternalShowApply;
  const [detailedLoans, setDetailedLoans] = useState({});
  const [loadingIds, setLoadingIds] = useState({});

  // Load full timeline (submission/approval/expected disbursement) for each loan account
  // The summary accounts endpoint doesn't always include the full timeline.
  useEffect(() => {
    if (!loanAccounts.length) return;
    const missing = loanAccounts.filter(l => !detailedLoans[l.id]);
    if (!missing.length) return;
    setLoadingIds(prev => {
      const next = { ...prev };
      missing.forEach(l => { next[l.id] = true; });
      return next;
    });
    Promise.allSettled(
      missing.map(l => fineractApi(`/loans/${l.id}`).then(d => ({ id: l.id, d })))
    ).then(results => {
      const next = { ...detailedLoans };
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value?.d) next[r.value.id] = r.value.d;
      });
      setDetailedLoans(next);
      setLoadingIds({});
    });
  }, [loanAccounts, detailedLoans]);

  const handleLoanChanged = () => {
    // Refresh the selected loan detail, the client's loan list, and the client summary
    if (selectedLoanId) {
      fineractApi(`/loans/${selectedLoanId}`).then(d => {
        setDetailedLoans(prev => ({ ...prev, [selectedLoanId]: d }));
      }).catch(() => {});
    }
    if (onRefreshClient) onRefreshClient();
  };

  const handleSubmitted = (loanId) => {
    setShowApply(false);
    toast({ title: 'Loan application submitted successfully' });
    if (onRefreshClient) onRefreshClient();
    if (loanId) setSelectedLoanId(loanId);
  };

  const loanColumns = [
    { key: 'id', label: 'Loan ID' },
    { key: 'productName', label: 'Loan Product' },
    { key: 'principal', label: 'Principal', render: (v) => v?.toLocaleString() || '—' },
    { key: 'loanBalance', label: 'Outstanding Balance', render: (v) => v?.toLocaleString() || '—' },
  ];

  return (
    <div className="space-y-5">
      {/* Apply for Loan */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-400" /> Loans
          <span className="text-xs text-slate-500 font-normal">({loanAccounts.length})</span>
        </h2>
        <Button size="sm" onClick={() => setShowApply(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <FileText className="w-3.5 h-3.5 mr-1" /> Apply for Loan
        </Button>
      </div>

      {loanAccounts.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
          <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No loans found for this client.</p>
          <p className="text-xs text-slate-600 mt-1">Click "Apply for Loan" to originate a new loan application.</p>
        </div>
      ) : selectedLoanId ? (
        /* Loan Details Panel — in-page, no navigation */
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedLoanId(null)}
            className="text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to loan list
          </Button>
          <LoanDetailsPanel
            loanId={selectedLoanId}
            onClose={() => setSelectedLoanId(null)}
            onChanged={handleLoanChanged}
          />
        </div>
      ) : (
        /* Loan List */
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50">
                  {['Loan ID', 'Loan Product', 'Principal', 'Outstanding Balance', 'Loan Status', 'Submission Date', 'Approval Date', 'Expected Disbursement', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loanAccounts.map(l => {
                  const detail = detailedLoans[l.id];
                  const loading = loadingIds[l.id];
                  return (
                    <tr
                      key={l.id}
                      onClick={() => setSelectedLoanId(l.id)}
                      className="border-b border-slate-700/30 hover:bg-slate-700/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-300 font-medium whitespace-nowrap">#{l.accountNo || l.id}</td>
                      <td className="px-4 py-3 text-white whitespace-nowrap">{l.productName || '—'}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{(detail?.principal ?? l.originalLoan)?.toLocaleString() || '—'}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{(detail?.summary?.totalOutstanding ?? l.loanBalance)?.toLocaleString() || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={l.status} /></td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : (fmtArr(detail?.timeline?.submittedOnDate) || '—')}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : (fmtArr(detail?.timeline?.approvedOnDate) || '—')}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : (fmtArr(detail?.timeline?.expectedDisbursementDate) || '—')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-600 inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply for Loan Dialog */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Apply for Loan</DialogTitle></DialogHeader>
          <LoanApplicationForm
            clientId={clientId}
            onClose={() => setShowApply(false)}
            onSubmitted={handleSubmitted}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}