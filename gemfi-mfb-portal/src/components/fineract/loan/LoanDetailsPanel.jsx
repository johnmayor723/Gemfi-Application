import React, { useState, useEffect } from 'react';
import { fineractApi } from '@/lib/fineract';
import {
  Loader2, X, DollarSign, FileText, CheckCircle, Receipt,
  Calendar, Clock, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/fineract/StatusBadge';
import DataTable from '@/components/fineract/DataTable';
import LoanWorkflowActions from '@/components/fineract/loan/LoanWorkflowActions';
import { useToast } from '@/components/ui/use-toast';

const fmtArr = (d) => (Array.isArray(d) ? d.map(n => String(n).padStart(2, '0')).join('-') : null);

export default function LoanDetailsPanel({ loanId, onClose, onChanged }) {
  const { toast } = useToast();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      // GET /api/v1/loans/{loanId} — refresh the loan after every workflow action
      const l = await fineractApi(`/loans/${loanId}?associations=repaymentSchedule,transactions,charges`);
      setLoan(l);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [loanId]);

  // After every successful workflow action: refresh the loan, then bubble up
  const handleAction = async () => {
    await load();
    if (onChanged) onChanged();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }
  if (!loan) {
    return <div className="p-8 text-center text-slate-500">Loan not found</div>;
  }

  const Field = ({ label, value }) => (
    <div>
      <dt className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-white mt-1">{value ?? '—'}</dd>
    </div>
  );

  const scheduleColumns = [
    { key: 'period', label: 'Period' },
    { key: 'dueDate', label: 'Due Date', render: (v) => fmtArr(v) || '—' },
    { key: 'principalOriginal', label: 'Principal', render: (v) => v?.toLocaleString() || '—' },
    { key: 'interestOriginal', label: 'Interest', render: (v) => v?.toLocaleString() || '—' },
    { key: 'totalOriginalInstallmentAmount', label: 'Total', render: (v) => v?.toLocaleString() || '—' },
    { key: 'principalLoanBalanceOutstanding', label: 'Balance', render: (v) => v?.toLocaleString() || '—' },
    { key: 'complete', label: 'Status', render: (v) => v ? <span className="text-emerald-400 text-xs">Paid</span> : <span className="text-amber-400 text-xs">Pending</span> },
  ];

  const txColumns = [
    { key: 'date', label: 'Date', render: (v) => fmtArr(v) || '—' },
    { key: 'type', label: 'Type', render: (v) => v?.value || '—' },
    { key: 'amount', label: 'Amount', render: (v) => v?.toLocaleString() || '—' },
    { key: 'outstandingLoanBalance', label: 'Outstanding', render: (v) => v?.toLocaleString() || '—' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">{loan.loanProductName}</h2>
          <p className="text-sm text-slate-400 mt-0.5">#{loan.accountNo} · {loan.clientName}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={loan.status} />
          <Button size="sm" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" /> Close
          </Button>
        </div>
      </div>

      {/* Workflow Actions — status-specific */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-white">{loan.status?.value || 'Unknown'}</span>
            <span className="text-slate-600">·</span>
            <span>Actions available for this status</span>
          </div>
          <LoanWorkflowActions loanId={loanId} status={loan.status} loan={loan} onAction={handleAction} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Principal" value={loan.principal?.toLocaleString()} icon={DollarSign} color="text-emerald-400" bg="bg-emerald-500/10" />
        <SummaryCard label="Total Expected" value={loan.summary?.totalExpectedRepayment?.toLocaleString()} icon={FileText} color="text-blue-400" bg="bg-blue-500/10" />
        <SummaryCard label="Total Paid" value={loan.summary?.totalRepayment?.toLocaleString()} icon={CheckCircle} color="text-purple-400" bg="bg-purple-500/10" />
        <SummaryCard label="Outstanding" value={loan.summary?.totalOutstanding?.toLocaleString()} icon={Receipt} color="text-amber-400" bg="bg-amber-500/10" />
      </div>

      {/* Loan Summary + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Loan Summary
          </h3>
          <dl className="grid grid-cols-2 gap-4">
            <Field label="Principal" value={loan.principal?.toLocaleString()} />
            <Field label="Interest Rate" value={`${loan.interestRatePerPeriod}%`} />
            <Field label="Interest" value={loan.summary?.totalInterestCharged?.toLocaleString()} />
            <Field label="# Repayments" value={loan.numberOfRepayments} />
            <Field label="Term" value={`${loan.termFrequency} ${loan.termPeriodFrequencyType?.value || ''}`} />
            <Field label="Currency" value={loan.currency?.displayLabel} />
            <Field label="Status" value={loan.status?.value} />
            <Field label="Total Outstanding" value={loan.summary?.totalOutstanding?.toLocaleString()} />
          </dl>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" /> Timeline
          </h3>
          <dl className="grid grid-cols-1 gap-4">
            <Field label="Submission Date" value={fmtArr(loan.timeline?.submittedOnDate)} />
            <Field label="Approval Date" value={fmtArr(loan.timeline?.approvedOnDate)} />
            <Field label="Expected Disbursement Date" value={fmtArr(loan.timeline?.expectedDisbursementDate)} />
            <Field label="Actual Disbursement Date" value={fmtArr(loan.timeline?.actualDisbursementDate)} />
          </dl>
        </div>
      </div>

      {/* Repayment Schedule — read-only */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" /> Repayment Schedule (read-only)
          </h3>
        </div>
        <DataTable columns={scheduleColumns} data={loan.repaymentSchedule?.periods || []} emptyMessage="No schedule available" />
      </div>

      {/* Transactions — read-only */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" /> Transactions (read-only)
          </h3>
        </div>
        <DataTable columns={txColumns} data={loan.transactions || []} emptyMessage="No transactions" />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-bold text-white">{value ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        </div>
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
    </div>
  );
}